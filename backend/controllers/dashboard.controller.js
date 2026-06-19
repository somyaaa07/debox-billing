// controllers/dashboard.controller.mjs

import { Op, fn, col, literal } from 'sequelize';
import {
  Client,
  FinalInvoice,
  Payment,
  Quotation,
  PurchaseOrder,
  ProformaInvoice,
  sequelize,
} from '../models/index.js';

export const getDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Summary cards
 const [totalRevenue] = await sequelize.query(`
  SELECT COALESCE(SUM(paidAmount), 0) AS total
  FROM final_invoices
  WHERE deletedAt IS NULL
`);
const [totalDue] = await sequelize.query(`
  SELECT COALESCE(SUM(dueAmount), 0) AS total
  FROM final_invoices
  WHERE deletedAt IS NULL
`);

const [monthRevenue] = await sequelize.query(`
  SELECT COALESCE(SUM(paidAmount), 0) AS total
  FROM final_invoices
  WHERE invoiceDate >= '${startOfMonth.toISOString().split('T')[0]}'
  AND deletedAt IS NULL
`);
    const totalClients = await Client.count();

    const overdueInvoices = await FinalInvoice.count({
      where: { status: 'overdue' },
    });

const [monthlyRevenue] = await sequelize.query(`
  SELECT 
    DATE_FORMAT(invoiceDate, '%Y-%m') AS month,
    COALESCE(SUM(paidAmount), 0) AS revenue,
    COALESCE(SUM(totalAmount), 0) AS billed
  FROM final_invoices
  WHERE invoiceDate >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
  AND deletedAt IS NULL
  GROUP BY DATE_FORMAT(invoiceDate, '%Y-%m')
  ORDER BY month ASC
`);

    // Recent documents
    const recentQuotations = await Quotation.findAll({
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['name', 'company'],
        },
      ],
      limit: 5,
      order: [['createdAt', 'DESC']],
    });

    const recentInvoices = await FinalInvoice.findAll({
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['name', 'company'],
        },
      ],
      limit: 5,
      order: [['createdAt', 'DESC']],
    });

    const recentPayments = await Payment.findAll({
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['name', 'company'],
        },
      ],
      limit: 5,
      order: [['createdAt', 'DESC']],
    });

    // Pending items
    const pendingPOs = await PurchaseOrder.count({
      where: { status: 'pending' },
    });

    const draftPIs = await ProformaInvoice.count({
      where: { status: 'draft' },
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue: parseFloat(totalRevenue[0]?.total || 0),
          totalDue: parseFloat(totalDue[0]?.total || 0),
          monthRevenue: parseFloat(monthRevenue[0]?.total || 0),
          totalClients,
          overdueInvoices,
          pendingPOs,
          draftPIs,
        },
        monthlyRevenue,
        recentQuotations,
        recentInvoices,
        recentPayments,
      },
    });
  } catch (error) {
    next(error);
  }
};