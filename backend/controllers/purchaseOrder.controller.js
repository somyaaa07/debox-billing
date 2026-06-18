// controllers/purchaseOrder.controller.js
import { Op } from 'sequelize';
import {
    PurchaseOrder,
    PurchaseOrderItem,
    Client,
    ProformaInvoice,
    ProformaInvoiceItem,
    sequelize
} from '../models/index.js';
import { paginateResponse } from '../middleware/paginate.js';
import { logActivity } from '../services/activity.service.js';
import { generateDocNumber } from '../utils/numberGenrate.js';


// ─── Helper: Valid UUID check ─────────────────────────────────────
const isValidUUID = (val) =>
    typeof val === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);


// ─── Get All Purchase Orders ──────────────────────────────────────
export const getPOs = async (req, res, next) => {
    try {
        const { page, limit, offset, search, sortBy, sortOrder } = req.pagination;

        const where = {};

        if (search) {
            where[Op.or] = [
                { poNumber:         { [Op.like]: `%${search}%` } },
                { internalPoNumber: { [Op.like]: `%${search}%` } },
            ];
        }

        if (req.query.status)   where.status   = req.query.status;
        if (req.query.clientId) where.clientId = req.query.clientId;

        const { count, rows } = await PurchaseOrder.findAndCountAll({
            where,
            include: [{
                model: Client,
                as: 'client',
                attributes: ['id', 'name', 'company'],
            },
          {
            model: PurchaseOrderItem,  // ← yeh add karo
            as: 'items',
            attributes: ['unitPrice', 'quantity', 'gstAmount', 'totalPrice'],
        }],
            limit,
            offset,
            order: [[sortBy, sortOrder]],
        });

        res.json({
            success: true,
            ...paginateResponse(rows, count, req.pagination),
        });

    } catch (error) {
        next(error);
    }
};


// ─── Get Single PO ────────────────────────────────────────────────
export const getPO = async (req, res, next) => {
    try {
        const po = await PurchaseOrder.findByPk(req.params.id, {
            include: [
                { model: Client,            as: 'client' },
                { model: PurchaseOrderItem, as: 'items'  },
            ],
        });

        if (!po) {
            return res.status(404).json({
                success: false,
                message: 'Purchase order not found',
            });
        }

        res.json({ success: true, data: po });

    } catch (error) {
        next(error);
    }
};


// ─── Create Purchase Order ────────────────────────────────────────
export const createPO = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { items, ...poData } = req.body;

        const client = await Client.findByPk(poData.clientId);
        if (!client) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: `Client not found with id: ${poData.clientId}`,
            });
        }

        poData.internalPoNumber = await generateDocNumber('PO');

        if (req.file) {
            poData.attachmentPath = req.file.path;
        }

        const po = await PurchaseOrder.create(poData, { transaction: t });

        if (items && items.length > 0) {
            const itemsData = items.map((item, i) => {
                const clean = {
                    purchaseOrderId: po.id,
                    sortOrder:       i,
                    description:     item.description        || '',
                    hsnCode:         item.hsnCode            || null,
                    quantity:        parseFloat(item.quantity)   || 1,
                    unit:            item.unit               || 'Nos',
                    unitPrice:       parseFloat(item.unitPrice)  || 0,
                    gstRate:         parseFloat(item.gstRate)    || 0,
                    gstAmount:       parseFloat(item.gstAmount)  || 0,
                    totalPrice:      parseFloat(item.totalPrice) || 0,
                };

                // ✅ FIX: sirf valid UUID ho tabhi include karo
                if (isValidUUID(item.productId)) {
                    clean.productId = item.productId;
                }

                return clean;
            });

            console.log('Items to insert:', JSON.stringify(itemsData, null, 2)); // debug — baad mein hata dena
            await PurchaseOrderItem.bulkCreate(itemsData, { transaction: t });
        }

        await t.commit();

        await logActivity({
            userId:      req.user.id,
            action:      'CREATE',
            module:      'purchase_orders',
            moduleId:    po.id,
            description: `Created PO: ${po.poNumber}`,
        });

        const created = await PurchaseOrder.findByPk(po.id, {
            include: [
                { model: Client,            as: 'client' },
                { model: PurchaseOrderItem, as: 'items'  },
            ],
        });

        res.status(201).json({
            success: true,
            message: 'Purchase order created successfully',
            data: created,
        });

    } catch (error) {
        await t.rollback();
        next(error);
    }
};


// ─── Update Purchase Order ────────────────────────────────────────
export const updatePO = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const po = await PurchaseOrder.findByPk(req.params.id);

        if (!po) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Purchase order not found',
            });
        }

        const { items, ...poData } = req.body;

        if (req.file) {
            poData.attachmentPath = req.file.path;
        }

        await po.update(poData, { transaction: t });

        if (items && items.length > 0) {
            await PurchaseOrderItem.destroy({
                where: { purchaseOrderId: po.id },
                transaction: t,
            });

            const itemsData = items.map((item, i) => {
                const clean = {
                    purchaseOrderId: po.id,
                    sortOrder:       i,
                    description:     item.description        || '',
                    hsnCode:         item.hsnCode            || null,
                    quantity:        parseFloat(item.quantity)   || 1,
                    unit:            item.unit               || 'Nos',
                    unitPrice:       parseFloat(item.unitPrice)  || 0,
                    gstRate:         parseFloat(item.gstRate)    || 0,
                    gstAmount:       parseFloat(item.gstAmount)  || 0,
                    totalPrice:      parseFloat(item.totalPrice) || 0,
                };

                // ✅ FIX: sirf valid UUID ho tabhi include karo
                if (isValidUUID(item.productId)) {
                    clean.productId = item.productId;
                }

                return clean;
            });

            await PurchaseOrderItem.bulkCreate(itemsData, { transaction: t });
        }

        await t.commit();

        const updated = await PurchaseOrder.findByPk(po.id, {
            include: [
                { model: Client,            as: 'client' },
                { model: PurchaseOrderItem, as: 'items'  },
            ],
        });

        res.json({
            success: true,
            message: 'Purchase order updated successfully',
            data: updated,
        });

    } catch (error) {
        await t.rollback();
        next(error);
    }
};


// ─── Delete Purchase Order ────────────────────────────────────────
export const deletePO = async (req, res, next) => {
    try {
        const po = await PurchaseOrder.findByPk(req.params.id);

        if (!po) {
            return res.status(404).json({
                success: false,
                message: 'Purchase order not found',
            });
        }

        await po.destroy();

        res.json({
            success: true,
            message: 'Purchase order deleted successfully',
        });

    } catch (error) {
        next(error);
    }
};


// ─── Update Status ────────────────────────────────────────────────
export const updateStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        const validStatuses = ['pending', 'approved', 'rejected', 'converted', 'completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
            });
        }

        const po = await PurchaseOrder.findByPk(req.params.id);

        if (!po) {
            return res.status(404).json({
                success: false,
                message: 'Purchase order not found',
            });
        }

        const updates = { status };
        if (status === 'approved') updates.approvedAt = new Date();

        await po.update(updates);

        res.json({
            success: true,
            message: `PO status updated to ${status}`,
            data: po,
        });

    } catch (error) {
        next(error);
    }
};


// ─── Convert PO → Proforma Invoice ───────────────────────────────
export const convertToPI = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const po = await PurchaseOrder.findByPk(req.params.id, {
            include: [{ model: PurchaseOrderItem, as: 'items' }],
        });

        if (!po) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Purchase order not found',
            });
        }

        if (po.status === 'converted') {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Purchase order is already converted to a Proforma Invoice',
            });
        }

        const subtotal = (po.items || []).reduce(
            (sum, item) => sum + parseFloat(item.unitPrice) * parseFloat(item.quantity), 0
        );
        const gstAmount = (po.items || []).reduce(
            (sum, item) => sum + parseFloat(item.gstAmount || 0), 0
        );
        const totalAmount = subtotal + gstAmount;

        const piNumber = await generateDocNumber('PI');

       const pi = await ProformaInvoice.create({
    piNumber,
    clientId:        po.clientId,
    purchaseOrderId: po.id,
    piDate:          new Date(),
    validUntil:      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // ✅ 30 din baad
    subtotal,
    gstAmount,
    totalAmount,
    dueAmount:       totalAmount,
    status:          'draft',
}, { transaction: t });

        if (po.items && po.items.length > 0) {
            const itemsData = po.items.map((item, i) => {
                const clean = {
                    proformaInvoiceId: pi.id,
                    sortOrder:         i,
                    description:       item.description        || '',
                    hsnCode:           item.hsnCode            || null,
                    quantity:          parseFloat(item.quantity)   || 1,
                    unit:              item.unit               || 'Nos',
                    unitPrice:         parseFloat(item.unitPrice)  || 0,
                    gstRate:           parseFloat(item.gstRate)    || 0,
                    cgstAmount:        parseFloat(item.gstAmount || 0) / 2,
                    sgstAmount:        parseFloat(item.gstAmount || 0) / 2,
                    igstAmount:        0,
                    totalPrice:        parseFloat(item.totalPrice) || 0,
                };

                // ✅ FIX: sirf valid UUID ho tabhi include karo
                if (isValidUUID(item.productId)) {
                    clean.productId = item.productId;
                }

                return clean;
            });

            await ProformaInvoiceItem.bulkCreate(itemsData, { transaction: t });
        }

        await po.update({
            status:      'converted',
            convertedAt: new Date(),
        }, { transaction: t });

        await t.commit();

        await logActivity({
            userId:      req.user.id,
            action:      'CONVERT',
            module:      'purchase_orders',
            moduleId:    po.id,
            description: `Converted PO ${po.poNumber} → PI ${piNumber}`,
        });

        res.json({
            success: true,
            message: `Purchase order converted to Proforma Invoice ${piNumber}`,
            data: pi,
        });

    } catch (error) {
        await t.rollback();
        next(error);
    }
};