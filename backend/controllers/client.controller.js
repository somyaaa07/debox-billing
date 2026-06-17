import { Op } from "sequelize";
import { Client, FinalInvoice, Payment, Quotation } from '../models/index.js';
import { paginate as paginateHelper, paginateResponse } from '../middleware/paginate.js';
import { logActivity } from '../services/activity.service.js';

// Get Clients
export const getClients = async (req, res, next) => {
    try {
        const { page, limit, offset, search, sortBy, sortOrder } = req.pagination;

        const where = {};

        if (search) {
            where[Op.or] = [
                { name:      { [Op.like]: `%${search}%` } },
                { email:     { [Op.like]: `%${search}%` } },
                { company:   { [Op.like]: `%${search}%` } },
                { gstNumber: { [Op.like]: `%${search}%` } },
            ];
        }

        const { count, rows } = await Client.findAndCountAll({
            where,
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

// Get Client By Id
export const getClient = async (req, res, next) => {
    try {
        const client = await Client.findByPk(req.params.id, {
            include: [
                {
                    model: FinalInvoice,
                    as: 'finalInvoices',
                    limit: 5,
                    order: [['createdAt', 'DESC']]
                },
                {
                    model: Payment,
                    as: 'payments',
                    limit: 5,
                    order: [['paymentDate', 'DESC']]
                }
            ]
        });

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found.'
            });
        }

        res.json({ success: true, data: client });

    } catch (error) {
        next(error);
    }
};

// Create Client
export const createClient = async (req, res, next) => {
    try {
        const client = await Client.create(req.body);

        await logActivity({
            userId: req.user.id,
            action: 'CREATE',
            module: 'client',
            moduleId: client.id,
            description: `Created client: ${client.name}`
        });

        res.status(201).json({
            success: true,
            message: 'Client created successfully',
            data: client
        });

    } catch (error) {
        next(error);
    }
};

// Update Client
export const updateClient = async (req, res, next) => {
    try {
        const client = await Client.findByPk(req.params.id);

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        await client.update(req.body);

        await logActivity({
            userId: req.user.id,
            action: 'UPDATE',
            module: 'client',
            moduleId: client.id,
            description: `Updated client: ${client.name}`
        });

        res.json({
            success: true,
            message: 'Client updated successfully',
            data: client
        });

    } catch (error) {
        next(error);
    }
};

// Delete Client
export const deleteClient = async (req, res, next) => {
    try {
        const client = await Client.findByPk(req.params.id);

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        await client.destroy();

        await logActivity({
            userId: req.user.id,
            action: 'DELETE',
            module: 'client',
            moduleId: client.id,
            description: `Deleted client: ${client.name}`
        });

        res.json({
            success: true,
            message: 'Client deleted successfully'
        });

    } catch (error) {
        next(error);
    }
};

// Client Ledger
export const getClientLedger = async (req, res, next) => {
    try {
        const client = await Client.findByPk(req.params.id);

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        const invoices = await FinalInvoice.findAll({
            where: { clientId: req.params.id },
            order: [['invoiceDate', 'DESC']]
        });

        const payments = await Payment.findAll({
            where: { clientId: req.params.id },
            order: [['paymentDate', 'DESC']]
        });

        res.json({
            success: true,
            data: { client, invoices, payments }
        });

    } catch (error) {
        next(error);
    }
};