// controllers/report.controller.mjs

import { Op } from 'sequelize';
import {
  FinalInvoice,
  Payment,
  Client,
  Quotation,
  ProformaInvoice,
  sequelize,
} from '../models/index.js';

export const getRevenueReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {
      deletedAt: null,
    };

    if (startDate && endDate) {
      where.invoiceDate = {
        [Op.between]: [startDate, endDate],
      };
    }

    const invoices = await FinalInvoice.findAll({
      where,
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['name', 'company'],
        },
      ],
      order: [['invoiceDate', 'DESC']],
    });

    const summary = invoices.reduce(
      (acc, inv) => ({
        totalBilled: acc.totalBilled + parseFloat(inv.totalAmount),
        totalPaid: acc.totalPaid + parseFloat(inv.paidAmount),
        totalDue: acc.totalDue + parseFloat(inv.dueAmount),
      }),
      {
        totalBilled: 0,
        totalPaid: 0,
        totalDue: 0,
      }
    );

    res.json({
      success: true,
      data: {
        invoices,
        summary,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getGSTReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};

    if (startDate && endDate) {
      where.invoiceDate = {
        [Op.between]: [startDate, endDate],
      };
    }

    const [gstData] = await sequelize.query(`
      SELECT 
        DATE_FORMAT(invoiceDate, '%Y-%m') AS period,
        COALESCE(SUM(cgst), 0) AS totalCGST,
        COALESCE(SUM(sgst), 0) AS totalSGST,
        COALESCE(SUM(igst), 0) AS totalIGST,
        COALESCE(SUM(gstAmount), 0) AS totalGST,
        COALESCE(SUM(subtotal), 0) AS taxableAmount
      FROM final_invoices
      WHERE deletedAt IS NULL
      ${startDate ? `AND invoiceDate >= '${startDate}'` : ''}
      ${endDate ? `AND invoiceDate <= '${endDate}'` : ''}
      GROUP BY DATE_FORMAT(invoiceDate, '%Y-%m')
      ORDER BY period DESC
    `);

    res.json({
      success: true,
      data: gstData,
    });
  } catch (error) {
    next(error);
  }
};

export const getOutstandingReport = async (req, res, next) => {
  try {
    const overdueInvoices = await FinalInvoice.findAll({
      where: {
        dueAmount: {
          [Op.gt]: 0,
        },
        status: {
          [Op.in]: ['sent', 'partially_paid', 'overdue'],
        },
      },
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['name', 'company', 'email', 'phone'],
        },
      ],
      order: [['dueDate', 'ASC']],
    });

    res.json({
      success: true,
      data: overdueInvoices,
    });
  } catch (error) {
    next(error);
  }
};