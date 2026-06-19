import { Op } from "sequelize";
import {
    FinalInvoice,
    FinalInvoiceItem,
    Client,
    Payment,
    sequelize
} from '../models/index.js';
import { paginateResponse } from '../middleware/paginate.js';
import { generateFinalInvoicePdf } from '../services/pdf.service.mjs';
import { sendEmail } from '../services/email.service.js';
import { generateDocNumber } from '../utils/numberGenrate.js';    // FIX 1: wrong filename

// Get All Invoices
export const getInvoices = async (req, res, next) => {             // FIX 2: renamed from getAllInvoice
    try {
        const { page, limit, offset, sortBy, sortOrder, search } = req.pagination;

        const where = {};

        if (search) {
            where[Op.or] = [
                { invoiceNumber: { [Op.like]: `%${search}%` } }   // FIX 3: missing closing %
            ];
        }

        if (req.query.status)   where.status   = req.query.status;
        if (req.query.clientId) where.clientId = req.query.clientId;

        const { rows, count } = await FinalInvoice.findAndCountAll({
            where,
            include: [
                {
                    model: Client,
                    as: 'client',                                  // FIX 4: 'clients' -> 'client'
                    attributes: ['id', 'name', 'company']
                },
            ],
            limit,
            offset,
            order: [[sortBy, sortOrder]]
        });

        res.json({
            success: true,
            ...paginateResponse(rows, count, req.pagination)     // FIX 5: was paginateResponse(rows, count, ...)
        });

    } catch (error) {
        next(error);
    }
};

// Get Single Invoice
export const getInvoice = async (req, res, next) => {             // FIX 6: renamed from getSingleInvoice
    try {
        const invoice = await FinalInvoice.findByPk(req.params.id, {
            include: [
                { model: Client,           as: 'client'   },      // FIX 7: 'clients' -> 'client'
                { model: FinalInvoiceItem, as: 'items'    },
                { model: Payment,          as: 'payments' }
            ]
        });

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        res.json({ success: true, data: invoice });

    } catch (error) {
        next(error);
    }
};

// Create Invoice
export const createInvoice = async (req, res, next) => {          // FIX 8: renamed from createInovice
    const t = await sequelize.transaction();
    try {
        const { items, ...invoiceData } = req.body;

        invoiceData.invoiceNumber = await generateDocNumber('INV'); // FIX 9: genrateDocNumber -> generateDocNumber

        const invoice = await FinalInvoice.create(invoiceData, { transaction: t });

        if (items && items.length > 0) {
            const itemsData = items.map((item, i) => ({
                ...item,
                finalInvoiceId: invoice.id,
                sortOrder: i
            }));
            await FinalInvoiceItem.bulkCreate(itemsData, { transaction: t });
        }

        await t.commit();

        res.status(201).json({
            success: true,
            message: 'Invoice created',
            data: invoice
        });

    } catch (error) {
        await t.rollback();
        next(error);
    }
};

// Update Invoice
export const updateInvoice = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const invoice = await FinalInvoice.findByPk(req.params.id);

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        const { items, ...invoiceData } = req.body;

        await invoice.update(invoiceData, { transaction: t });

        if (items) {
            await FinalInvoiceItem.destroy({
                where: { finalInvoiceId: invoice.id },
                transaction: t
            });

            const itemsData = items.map((item, i) => ({
                ...item,
                finalInvoiceId: invoice.id,
                sortOrder: i
            }));

            await FinalInvoiceItem.bulkCreate(itemsData, { transaction: t });
        }

        await t.commit();

        res.json({
            success: true,
            message: 'Invoice updated',
            data: invoice                                          // FIX 10: added missing data field
        });

    } catch (error) {
        await t.rollback();
        next(error);
    }
};

// Delete Invoice
export const deleteInvoice = async (req, res, next) => {
    try {
        const invoice = await FinalInvoice.findByPk(req.params.id);

        if (!invoice) {
            return res.status(404).json({                         // FIX 11: 401 -> 404
                success: false,                                   // FIX 12: was `success: true`
                message: 'Invoice not found'
            });
        }

        await invoice.destroy();                                  // FIX 13: FinalInvoice.destroy(invoice) -> invoice.destroy()

        res.json({
            success: true,
            message: 'Invoice deleted successfully'
        });

    } catch (error) {                                             // FIX 14: was `catch { error }` 
        next(error);
    }
};

// Update Invoice Status
export const updateStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        const invoice = await FinalInvoice.findByPk(req.params.id);

        if (!invoice) {
            return res.status(404).json({                         // FIX 15: 401 -> 404
                success: false,
                message: 'Invoice not found'
            });
        }

        await invoice.update({
            status,
            ...(status === 'sent' ? { sentAt: new Date() } : {}),
            ...(status === 'paid' ? { paidAt: new Date() } : {}),
        });

        res.json({
            success: true,
            message: 'Invoice status updated',
            data: invoice
        });

    } catch (error) {
        next(error);
    }
};

// Download PDF
export const downloadPdf = async (req, res, next) => {
    try {
        const invoice = await FinalInvoice.findByPk(req.params.id, {
            include: [
                { model: Client,           as: 'client' },        // FIX 16: 'clients' -> 'client'
                { model: FinalInvoiceItem, as: 'items'  }
            ]
        });

        if (!invoice) {
            return res.status(404).json({                         // FIX 17: 401 -> 404
                success: false,
                message: 'Invoice not found'
            });
        }

        const pdfBuffer = await generateFinalInvoicePdf(invoice); // FIX 18: genrateFinalInvoicePdf -> generateFinalInvoicePdf

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
        });

        res.send(pdfBuffer);

    } catch (error) {
        next(error);
    }
};

// Email Invoice
export const emailInvoice = async (req, res, next) => {
    try {
        const invoice = await FinalInvoice.findByPk(req.params.id, {
            include: [
                { model: Client,           as: 'client' },
                { model: FinalInvoiceItem, as: 'items'  }
            ]
        });

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found.'
            });
        }

        const pdfBuffer = await generateFinalInvoicePdf(invoice);

        await sendEmail({
            to: invoice.client.email,
            subject: `Invoice ${invoice.invoiceNumber}`,
            html: `<p>Dear ${invoice.client.name},</p>
                   <p>Please find attached Invoice ${invoice.invoiceNumber}.
                   Total Due: ₹${invoice.dueAmount}</p>`,
            attachments: [{
                filename: `invoice-${invoice.invoiceNumber}.pdf`,
                content: pdfBuffer,
            }],
        });

        await invoice.update({ status: 'sent', sentAt: new Date() });

        res.json({
            success: true,
            message: 'Invoice emailed successfully.'
        });

    } catch (error) {
        next(error);
    }
};