// controllers/quotation.controller.js
import { Op } from 'sequelize';
import {
    Quotation,
    QuotationItem,
    Client,
    Product,
    sequelize
} from '../models/index.js';
import { paginateResponse } from '../middleware/paginate.js';
import { logActivity } from '../services/activity.service.js';
import { generateQuotationPdf } from '../services/pdf.service.mjs';
import { sendEmail, emailTemplates } from '../services/email.service.js'; // FIX: added emailTemplates
import { generateDocNumber } from '../utils/numberGenrate.js';          // FIX: correct filename numberGenerator


// ─── Get All Quotations ───────────────────────────────────────────
export const getQuotations = async (req, res, next) => {
    try {
        const { page, limit, offset, search, sortBy, sortOrder } = req.pagination;

        const where = {};

        if (search) {
            where[Op.or] = [
                { quotationNumber: { [Op.like]: `%${search}%` } }
            ];
        }

        if (req.query.status)   where.status   = req.query.status;
        if (req.query.clientId) where.clientId = req.query.clientId;

        const { count, rows } = await Quotation.findAndCountAll({
            where,
            include: [{ model: Client, as: 'client', attributes: ['id', 'name', 'company'] }],
            limit,
            offset,
            order: [[sortBy, sortOrder]],
        });

        res.json({
            success: true,
            ...paginateResponse(rows, count, req.pagination)
        });

    } catch (error) {
        next(error);
    }
};


// ─── Get Single Quotation ─────────────────────────────────────────
export const getQuotation = async (req, res, next) => {
    try {
        const quotation = await Quotation.findByPk(req.params.id, {
            include: [
                { model: Client, as: 'client' },
                {
                    model: QuotationItem,
                    as: 'items',
                    include: [{ model: Product, as: 'product' }]
                }
            ]
        });

        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: 'Quotation not found'
            });
        }

        res.json({ success: true, data: quotation });

    } catch (error) {
        next(error);
    }
};


// ─── Create Quotation ─────────────────────────────────────────────
export const createQuotation = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { items, ...quotationData } = req.body;

        quotationData.quotationNumber = await generateDocNumber('QT');

        const quotation = await Quotation.create(quotationData, { transaction: t });

        if (items && items.length > 0) {
            const itemsData = items.map((item, i) => ({
                ...item,
                quotationId: quotation.id,
                sortOrder: i
            }));
            await QuotationItem.bulkCreate(itemsData, { transaction: t });
        }

        await recalculateTotals(quotation.id, t);

        await t.commit();

        const created = await Quotation.findByPk(quotation.id, {
            include: [
                { model: QuotationItem, as: 'items' },
                { model: Client, as: 'client' }
            ]
        });

        await logActivity({
            userId: req.user.id,
            action: 'CREATE',
            module: 'quotation',
            moduleId: quotation.id,
            description: `Created quotation: ${quotation.quotationNumber}`
        });

        res.status(201).json({
            success: true,
            message: 'Quotation created successfully',
            data: created,
        });

    } catch (error) {
        await t.rollback();
        next(error);
    }
};


// ─── Update Quotation ─────────────────────────────────────────────
export const updateQuotation = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { items, ...quotationData } = req.body;

        const quotation = await Quotation.findByPk(req.params.id);

        if (!quotation) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Quotation not found'
            });
        }

        await quotation.update(quotationData, { transaction: t });

        if (items) {
            await QuotationItem.destroy({
                where: { quotationId: quotation.id },
                transaction: t,
            });

            const itemsData = items.map((item, i) => ({
                ...item,
                quotationId: quotation.id,
                sortOrder: i
            }));

            await QuotationItem.bulkCreate(itemsData, { transaction: t });
            await recalculateTotals(quotation.id, t);
        }

        await t.commit();

        const updated = await Quotation.findByPk(quotation.id, {
            include: [
                { model: QuotationItem, as: 'items' },
                { model: Client, as: 'client' }
            ]
        });

        res.json({
            success: true,
            message: 'Quotation updated successfully',
            data: updated
        });

    } catch (error) {
        await t.rollback();
        next(error);
    }
};


// ─── Delete Quotation ─────────────────────────────────────────────
export const deleteQuotation = async (req, res, next) => {
    try {
        const quotation = await Quotation.findByPk(req.params.id);

        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: 'Quotation not found'
            });
        }

        await quotation.destroy(); // soft delete (paranoid: true)

        res.json({ success: true, message: 'Quotation deleted successfully' });

    } catch (error) {
        next(error);
    }
};


// ─── Update Status ────────────────────────────────────────────────
export const updateStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        const quotation = await Quotation.findByPk(req.params.id);

        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: 'Quotation not found'
            });
        }

        const updates = { status };

        if (status === 'approved') updates.approvedAt = new Date();
        if (status === 'sent')     updates.sentAt     = new Date();

        await quotation.update(updates);

        res.json({
            success: true,
            message: `Quotation status updated to ${status}`,
            data: quotation
        });

    } catch (error) {
        next(error);
    }
};


// ─── Download PDF ─────────────────────────────────────────────────
export const downloadPdf = async (req, res, next) => {
    try {
        const quotation = await Quotation.findByPk(req.params.id, {
            include: [
                { model: Client, as: 'client' },
                { model: QuotationItem, as: 'items' }
            ]
        });

        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: 'Quotation not found'
            });
        }

        const pdfBuffer = await generateQuotationPdf(quotation);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="quotation-${quotation.quotationNumber}.pdf"`
        });

        res.send(pdfBuffer);

    } catch (error) {
        next(error);
    }
};


// ─── Email Quotation ──────────────────────────────────────────────
export const emailQuotation = async (req, res, next) => {
    try {
        const quotation = await Quotation.findByPk(req.params.id, {
            include: [
                { model: Client, as: 'client' },
                { model: QuotationItem, as: 'items' }
            ]
        });

        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: 'Quotation not found'
            });
        }

        if (!quotation.client) {
            return res.status(400).json({
                success: false,
                message: 'Client not found for this quotation'
            });
        }

        const companyName = process.env.COMPANY_NAME || 'BillFlow Pro';
        const template    = emailTemplates.quotation(quotation, companyName);
        const pdfBuffer   = await generateQuotationPdf(quotation);

        const result = await sendEmail({
            to:          quotation.client.email,
            subject:     template.subject,
            html:        template.html,
            attachments: [{
                filename: `quotation-${quotation.quotationNumber}.pdf`,
                content:  pdfBuffer,
            }],
        });

        // Always mark as sent regardless of email delivery result
        await quotation.update({ status: 'sent', sentAt: new Date() });

        if (result.skipped) {
            return res.json({
                success: true,
                message: 'Quotation marked as sent. (Email skipped — SMTP not configured in .env)'
            });
        }

        if (result.failed) {
            return res.json({
                success: true,
                message: `Quotation marked as sent. (Email delivery failed: ${result.error})`
            });
        }

        res.json({
            success: true,
            message: `Quotation emailed successfully to ${quotation.client.email}`
        });

    } catch (error) {
        next(error);
    }
};


// ─── Helper: Recalculate Totals from Items ────────────────────────
const recalculateTotals = async (quotationId, transaction) => {
    const items = await QuotationItem.findAll({
        where: { quotationId },
        transaction
    });

    const subtotal = items.reduce(
        (sum, item) => sum + parseFloat(item.unitPrice) * parseFloat(item.quantity), 0
    );

    const gstAmount = items.reduce(
        (sum, item) => sum + parseFloat(item.gstAmount || 0), 0
    );

    const discount = items.reduce(
        (sum, item) => sum + parseFloat(item.discount || 0), 0
    );

    const totalAmount = subtotal + gstAmount - discount;

    await Quotation.update(
        { subtotal, gstAmount, discount, totalAmount },
        { where: { id: quotationId }, transaction }
    );
};