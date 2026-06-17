// utils/numberGenerator.mjs

import  sequelize  from '../config/database.js';

/**
 * Generates sequential document numbers like:
 * QT-2024-0001, PI-2024-0042, INV-2024-0123
 * Uses DB to ensure uniqueness across concurrent requests
 */
export const generateDocNumber = async (prefix) => {
  const year = new Date().getFullYear();

 const tableMap = {
    QT:  'quotations',
    PO:  'purchase_orders',
    PI:  'proforma_invoices',
    INV: 'final_invoices',   // ✅ plural — renamed table se match karega
    PAY: 'payments',
};

  const table = tableMap[prefix];
  if (!table) throw new Error(`Unknown prefix: ${prefix}`);

  const columnMap = {
    QT: 'quotationNumber',
    PO: 'internalPoNumber',
    PI: 'piNumber',
    INV: 'invoiceNumber',
    PAY: 'paymentNumber',
  };

  const column = columnMap[prefix];

  const [results] = await sequelize.query(`
    SELECT COUNT(*) as count
    FROM ${table}
    WHERE ${column} LIKE '${prefix}-${year}-%'
  `);

  const count = parseInt(results[0]?.count || 0) + 1;

  return `${prefix}-${year}-${String(count).padStart(4, '0')}`;
};