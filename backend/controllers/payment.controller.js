// controllers/payment.controller.js
import { Op } from 'sequelize';
import { Payment, FinalInvoice, Client, sequelize } from '../models/index.js';
import { paginateResponse } from '../middleware/paginate.js';
import { logActivity } from '../services/activity.service.js';
import { generateDocNumber } from '../utils/numberGenrate.js';
import { generateReceiptPdf } from '../services/pdf.service.mjs';

export const getPayments = async (req, res, next) => {
    try {
        const { page, limit, offset, search, sortBy, sortOrder } = req.pagination;

        const where = {};

        if (search) {
            where[Op.or] = [
                { paymentNumber:   { [Op.like]: `%${search}%` } },
                { referenceNumber: { [Op.like]: `%${search}%` } }
            ];
        }

        if (req.query.clientId)    where.clientId    = req.query.clientId;
        if (req.query.paymentMode) where.paymentMode = req.query.paymentMode;

        const { count, rows } = await Payment.findAndCountAll({
            where,
            include: [
                { model: Client,       as: 'client',       attributes: ['id', 'name', 'company'] },
                { model: FinalInvoice, as: 'finalInvoice', attributes: ['id', 'invoiceNumber']   }
            ],
            limit,
            offset,
            order: [[sortBy, sortOrder]],
        });

        res.json({
            success: true,
            ...paginateResponse(rows, count, req.pagination)  // FIX: was paginateResponse(rows, count, ...)
        });

    } catch (error) {
        next(error);
    }
};

export const getPayment = async (req, res, next) => {
    try {
        const payment = await Payment.findByPk(req.params.id, {
            include: [
                { model: Client,       as: 'client'       },
                { model: FinalInvoice, as: 'finalInvoice' }
            ],
        });

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found.' });
        }

        res.json({ success: true, data: payment });

    } catch (error) {
        next(error);
    }
};

export const createPayment = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const paymentData = { ...req.body };
        paymentData.paymentNumber = await generateDocNumber('PAY');

        const payment = await Payment.create(paymentData, { transaction: t });

        if (payment.finalInvoiceId) {
            const invoice = await FinalInvoice.findByPk(payment.finalInvoiceId, { transaction: t });

            if (invoice) {
                const newPaid = parseFloat(invoice.paidAmount) + parseFloat(payment.amount);
                const newDue  = parseFloat(invoice.totalAmount) - newPaid;
                let status    = invoice.status;

                if (newDue <= 0)    status = 'paid';
                else if (newPaid > 0) status = 'partially_paid';

                await invoice.update({
                    paidAmount: newPaid,
                    dueAmount:  Math.max(0, newDue),
                    status,
                    ...(status === 'paid' ? { paidAt: new Date() } : {})
                }, { transaction: t });

                await Client.increment(
                    { totalPaid: parseFloat(payment.amount), totalDue: -parseFloat(payment.amount) },
                    { where: { id: payment.clientId }, transaction: t }
                );
            }
        }

        await t.commit();

        await logActivity({
            userId:      req.user.id,
            action:      'CREATE',
            module:      'payment',
            moduleId:    payment.id,
            description: `Recorded payment: ${payment.paymentNumber} - ₹${payment.amount}`
        });

        res.status(201).json({
            success: true,
            message: 'Payment recorded successfully.',
            data:    payment
        });

    } catch (error) {
        await t.rollback();
        next(error);
    }
};

export const deletePayment = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const payment = await Payment.findByPk(req.params.id);

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found.' });
        }

        if (payment.finalInvoiceId) {
            const invoice = await FinalInvoice.findByPk(payment.finalInvoiceId, { transaction: t });

            if (invoice) {
                const newPaid = Math.max(0, parseFloat(invoice.paidAmount) - parseFloat(payment.amount));
                const newDue  = parseFloat(invoice.totalAmount) - newPaid;

                await invoice.update({
                    paidAmount: newPaid,
                    dueAmount:  newDue,
                    status:     newPaid > 0 ? 'partially_paid' : 'sent'
                }, { transaction: t });

                await Client.increment(
                    { totalPaid: -parseFloat(payment.amount), totalDue: parseFloat(payment.amount) },
                    { where: { id: payment.clientId }, transaction: t }
                );
            }
        }

        await payment.destroy({ transaction: t });
        await t.commit();

        res.json({ success: true, message: 'Payment deleted.' });

    } catch (error) {
        await t.rollback();
        next(error);
    }
};

export const downloadReceipt = async (req, res, next) => {
    try {
        const payment = await Payment.findByPk(req.params.id, {
            include: [
                { model: Client,       as: 'client'       },
                { model: FinalInvoice, as: 'finalInvoice' }
            ],
        });

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found.' });
        }

        const pdfBuffer = await generateReceiptPdf(payment);

        res.set({
            'Content-Type':        'application/pdf',
            'Content-Disposition': `attachment; filename="receipt-${payment.paymentNumber}.pdf"`
        });

        res.send(pdfBuffer);

    } catch (error) {
        next(error);
    }
};