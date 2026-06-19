import { Op } from "sequelize";
import { paginateResponse } from "../middleware/paginate.js";
import {
    ProformaInvoice,
    ProformaInvoiceItem,
    Client,
    FinalInvoice,
        FinalInvoiceItem,
    sequelize
} from '../models/index.js';
import { logActivity } from '../services/activity.service.js';
import { generateDocNumber } from '../utils/numberGenrate.js';


// ─── Get All PIs ──────────────────────────────────────────────────
export const getPIs = async (req, res, next) => {
    try {
        const { limit, offset, search, sortBy, sortOrder } = req.pagination;

        const where = {};
        if (search) {
            where[Op.or] = [
                { piNumber: { [Op.like]: `%${search}%` } }
            ];
        }
        if (req.query.status) where.status = req.query.status;

        const { count, rows } = await ProformaInvoice.findAndCountAll({
            where,
            include: [{
                model: Client,        // ✅ lowercase 'model'
                as: 'client',
                attributes: ['id', 'name', 'company']
            }],
            limit,
            offset,
            order: [[sortBy, sortOrder]]
        });

        res.json({
            success: true,
            ...paginateResponse(rows, count, req.pagination)
        });

    } catch (error) {
        next(error);
    }
};


// ─── Get Single PI ────────────────────────────────────────────────
export const getPI = async (req, res, next) => {
    try {
        const pi = await ProformaInvoice.findByPk(req.params.id, {
            include: [
                { model: Client,             as: 'client' },
                { model: ProformaInvoiceItem, as: 'items' }, // ✅ quotes add kiye
            ]
        });

        if (!pi) {
            return res.status(404).json({
                success: false,
                message: 'PI not found'
            });
        }

        res.json({ success: true, data: pi });

    } catch (error) {
        next(error);
    }
};


// ─── Create PI ────────────────────────────────────────────────────
export const createPI = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { items, ...piData } = req.body;

        piData.piNumber = await generateDocNumber('PI');

        const pi = await ProformaInvoice.create(piData, { transaction: t });

        if (items && items.length > 0) {
            const itemsData = items.map((item, i) => ({
                ...item,
                proformaInvoiceId: pi.id,
                sortOrder: i
            }));
            await ProformaInvoiceItem.bulkCreate(itemsData, { transaction: t });
        }

        await t.commit();

        const created = await ProformaInvoice.findByPk(pi.id, {
            include: [
                { model: Client,              as: 'client' },
                { model: ProformaInvoiceItem, as: 'items'  },
            ]
        });

        res.status(201).json({
            success: true,
            message: 'PI created.',
            data: created
        });

    } catch (error) {
        await t.rollback();
        next(error);
    }
};


// ─── Update PI ────────────────────────────────────────────────────
export const updatePI = async (req, res, next) => {
    const t = await sequelize.transaction(); // ✅ 
    try {
        const pi = await ProformaInvoice.findByPk(req.params.id);
        if (!pi) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'PI not found'
            });
        }

        await pi.update(req.body, { transaction: t });
        await t.commit();

        res.json({
            success: true,
            message: 'PI updated',
            data: pi
        });

    } catch (error) {
        await t.rollback();
        next(error);
    }
};


// ─── Delete PI ────────────────────────────────────────────────────
export const deletePI = async (req, res, next) => {
    try {
        const pi = await ProformaInvoice.findByPk(req.params.id);
        if (!pi) {
            return res.status(404).json({
                success: false,
                message: 'PI not found'
            });
        }

        await pi.destroy();

        res.json({
            success: true,
            message: 'PI deleted successfully'
        });

    } catch (error) {
        next(error);
    }
};


// ─── Update Status ────────────────────────────────────────────────
export const updateStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        const validStatuses = ['draft', 'sent', 'approved', 'partially_paid', 'converted'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const pi = await ProformaInvoice.findByPk(req.params.id);
        if (!pi) {
            return res.status(404).json({
                success: false,
                message: 'PI not found'
            });
        }

        await pi.update({
            status,
            ...(status === 'sent' ? { sentAt: new Date() } : {})
        });

        res.json({ success: true, data: pi });

    } catch (error) {
        next(error);
    }
};


// ─── Convert PI → Final Invoice ───────────────────────────────────
export const convertToFinalInvoice = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const pi = await ProformaInvoice.findByPk(req.params.id, {
            include: [{ model: ProformaInvoiceItem, as: 'items' }]
        });

        if (!pi) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'PI not found' });
        }

        const invoiceNumber = await generateDocNumber('INV');

        const invoice = await FinalInvoice.create({
            invoiceNumber,
            clientId:          pi.clientId,
            proformaInvoiceId: pi.id,
            invoiceDate:       new Date(),
            dueDate:           new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            subtotal:          pi.subtotal,
            gstAmount:         pi.gstAmount,
            totalAmount:       pi.totalAmount,
            dueAmount:         pi.dueAmount,
            status:            'draft',
        }, { transaction: t });

        // ✅ PI ke items copy karke Final Invoice ke items bana rahe hain
        if (pi.items && pi.items.length > 0) {
            const itemsData = pi.items.map((item, i) => ({
                finalInvoiceId: invoice.id,
                productId:      item.productId,
                description:    item.description,
                hsnCode:        item.hsnCode,
                quantity:       item.quantity,
                unit:           item.unit,
                unitPrice:      item.unitPrice,
                gstRate:        item.gstRate,
                cgstAmount:     item.cgstAmount,   // same name dono taraf
                sgst:           item.sgstAmount,   // PI: sgstAmount → Final: sgst
                igst:           item.igstAmount,   // PI: igstAmount → Final: igst
                totalPrice:     item.totalPrice,
                sortOrder:      i,
            }));
            await FinalInvoiceItem.bulkCreate(itemsData, { transaction: t });
        }

        await pi.update({ status: 'converted', convertedAt: new Date() }, { transaction: t });

        await t.commit();

        res.json({
            success: true,
            message: `PI converted to Final Invoice ${invoiceNumber}`,
            data: invoice
        });

    } catch (error) {
        await t.rollback();
        next(error);
    }
};
// ─── Download PDF ─────────────────────────────────────────────────
export const downloadPdf = async (req, res, next) => {
    try {
        const pi = await ProformaInvoice.findByPk(req.params.id, {
            include: [
                { model: Client,              as: 'client' },
                { model: ProformaInvoiceItem, as: 'items'  },
            ]
        });

        if (!pi) {
            return res.status(404).json({
                success: false,
                message: 'PI not found'
            });
        }

        const { generateProformaPdf } = await import('../services/pdf.service.mjs');
        const pdfBuffer = await generateProformaPdf(pi);

        res.set({ 'Content-Type': 'application/pdf' });
        res.send(pdfBuffer);

    } catch (error) {
        next(error);
    }
};


// ─── Email PI ─────────────────────────────────────────────────────
export const emailPI = async (req, res, next) => {
    try {
        const pi = await ProformaInvoice.findByPk(req.params.id, {
            include: [
                { model: Client,              as: 'client' },
                { model: ProformaInvoiceItem, as: 'items'  },
            ]
        });

        if (!pi) {
            return res.status(404).json({ success: false, message: 'PI not found' });
        }
        if (!pi.client?.email) {
            return res.status(400).json({ success: false, message: 'Client has no email on file' });
        }

        const { generateProformaPdf } = await import('../services/pdf.service.mjs');
        const { sendEmail, emailTemplates } = await import('../services/email.service.js');

        const pdf = await generateProformaPdf(pi);
        const { subject, html } = emailTemplates.proformaInvoice(
            pi,
            process.env.COMPANY_NAME || 'BillFlow Pro'
        );

        const result = await sendEmail({
            to: pi.client.email,
            subject,
            html,
            attachments: [{ filename: `${pi.piNumber}.pdf`, content: pdf }]
        });

        if (result.skipped || result.failed) {
            return res.status(502).json({
                success: false,
                message: result.skipped
                    ? 'SMTP not configured — check SMTP_USER/SMTP_PASS in .env'
                    : `Email failed: ${result.error}`
            });
        }

        res.json({ success: true, message: 'Email sent successfully' });

    } catch (error) {
        next(error);
    }
};