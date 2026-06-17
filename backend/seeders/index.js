// seeders/index.mjs

import 'dotenv/config';
import bcrypt from 'bcryptjs';

import {
  sequelize,
  User,
  Client,
  Product,
  Quotation,
  QuotationItem,
  PurchaseOrder,
  PurchaseOrderItem,
  ProformaInvoice,
  ProformaInvoiceItem,
  FinalInvoice,
  FinalInvoiceItem,
  Payment,
  Setting,
} from '../models/index.js';

const seed = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true }); // ⚠️ Drops all tables - only for dev
    console.log('🌱 Starting seed...');

    // ── Admin User ──
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@billflow.com',
      password: 'admin123',
      isActive: true,
    });

    console.log(
      '✅ Admin user created → admin@billflow.com / admin123'
    );

    // ── Settings ──
    const defaultSettings = [
      { key: 'company_name', value: 'TechVentures Pvt Ltd', group: 'company', label: 'Company Name' },
      { key: 'company_gst', value: '27AADCT1234A1Z5', group: 'company', label: 'GST Number' },
      { key: 'company_pan', value: 'AADCT1234A', group: 'company', label: 'PAN Number' },
      { key: 'company_address', value: '101, Techno Park, Pune, Maharashtra - 411001', group: 'company', label: 'Address' },
      { key: 'company_phone', value: '+91 98765 43210', group: 'company', label: 'Phone' },
      { key: 'company_email', value: 'billing@techventures.com', group: 'company', label: 'Email' },
      { key: 'currency', value: 'INR', group: 'general', label: 'Currency' },
      { key: 'invoice_prefix', value: 'INV', group: 'invoice', label: 'Invoice Prefix' },
      { key: 'invoice_terms', value: 'Payment due within 30 days of invoice date.', group: 'invoice', label: 'Default Terms' },
      { key: 'gst_type', value: 'CGST_SGST', group: 'gst', label: 'GST Type' },
      { key: 'default_gst_rate', value: '18', group: 'gst', label: 'Default GST Rate' },
    ];

    await Setting.bulkCreate(defaultSettings);
    console.log('✅ Settings seeded');

    // ── Products ──
    const products = await Product.bulkCreate([
      { name: 'Website Development', description: 'Full-stack web application development', sku: 'SRV-WEB-001', unit: 'Project', price: 150000, gstRate: 18, hsnCode: '998314' },
      { name: 'Mobile App Development', description: 'iOS & Android app development', sku: 'SRV-MOB-001', unit: 'Project', price: 200000, gstRate: 18, hsnCode: '998314' },
      { name: 'SEO Services', description: 'Search engine optimization monthly retainer', sku: 'SRV-SEO-001', unit: 'Month', price: 15000, gstRate: 18, hsnCode: '998361' },
      { name: 'Cloud Hosting', description: 'AWS/GCP managed hosting services', sku: 'SRV-HST-001', unit: 'Month', price: 8000, gstRate: 18, hsnCode: '998315' },
      { name: 'UI/UX Design', description: 'User interface & experience design', sku: 'SRV-DES-001', unit: 'Project', price: 50000, gstRate: 18, hsnCode: '998311' },
      { name: 'Digital Marketing', description: 'Social media & PPC campaign management', sku: 'SRV-MKT-001', unit: 'Month', price: 25000, gstRate: 18, hsnCode: '998361' },
      { name: 'Technical Support', description: 'Annual maintenance & support contract', sku: 'SRV-SUP-001', unit: 'Year', price: 60000, gstRate: 18, hsnCode: '998314' },
    ]);

    console.log('✅ Products seeded');

    // ── Clients ──
    const clients = await Client.bulkCreate([
      { name: 'Rajesh Sharma', email: 'rajesh@alphacorp.in', phone: '9876543210', company: 'Alpha Corporation', gstNumber: '27AAACH1234A1Z5', billingAddress: '45, MG Road, Mumbai, Maharashtra - 400001', city: 'Mumbai', state: 'Maharashtra', totalDue: 85000, totalPaid: 265000 },
      { name: 'Priya Mehta', email: 'priya@betasolutions.com', phone: '9765432109', company: 'Beta Solutions Pvt Ltd', gstNumber: '29AABCB5678B1Z3', billingAddress: '12, Brigade Road, Bangalore, Karnataka - 560001', city: 'Bangalore', state: 'Karnataka', totalDue: 118000, totalPaid: 182000 },
      { name: 'Suresh Patel', email: 'suresh@gammainfotech.com', phone: '9654321098', company: 'Gamma InfoTech', gstNumber: '24AAACG9012C1Z1', billingAddress: '7, CG Road, Ahmedabad, Gujarat - 380009', city: 'Ahmedabad', state: 'Gujarat', totalDue: 0, totalPaid: 350000 },
      { name: 'Anita Gupta', email: 'anita@deltaservices.in', phone: '9543210987', company: 'Delta Services', gstNumber: '07AAACD3456D1Z9', billingAddress: '23, Connaught Place, New Delhi - 110001', city: 'New Delhi', state: 'Delhi', totalDue: 236000, totalPaid: 64000 },
      { name: 'Vikram Singh', email: 'vikram@epsilontech.com', phone: '9432109876', company: 'Epsilon Technologies', gstNumber: '33AAACE7890E1Z7', billingAddress: '55, Anna Salai, Chennai, Tamil Nadu - 600002', city: 'Chennai', state: 'Tamil Nadu', totalDue: 45000, totalPaid: 155000 },
    ]);

    console.log('✅ Clients seeded');

    // (rest unchanged — Sequelize models are already ES modules)

    // ── Quotations ──
    const q1 = await Quotation.create({
      quotationNumber: 'QT-2024-0001',
      clientId: clients[0].id,
      status: 'approved',
      quotationDate: '2024-01-10',
      validUntil: '2024-02-10',
      subtotal: 208000,
      gstAmount: 37440,
      totalAmount: 245440,
      currency: 'INR',
      notes: 'Includes 3 months post-launch support.',
      termsAndConditions: '30% advance, 40% on milestone, 30% on delivery.',
      approvedAt: new Date('2024-01-15'),
    });

    await QuotationItem.bulkCreate([
      { quotationId: q1.id, productId: products[0].id, description: 'Website Development - E-commerce Portal', hsnCode: '998314', quantity: 1, unit: 'Project', unitPrice: 150000, gstRate: 18, gstAmount: 27000, totalPrice: 177000 },
      { quotationId: q1.id, productId: products[4].id, description: 'UI/UX Design for E-commerce Portal', hsnCode: '998311', quantity: 1, unit: 'Project', unitPrice: 50000, gstRate: 18, gstAmount: 9000, totalPrice: 59000 },
      { quotationId: q1.id, productId: products[3].id, description: 'Cloud Hosting Setup - 6 Months', hsnCode: '998315', quantity: 6, unit: 'Month', unitPrice: 8000, gstRate: 18, gstAmount: 8640, totalPrice: 56480 },
    ]);

    console.log('🎉 Seed completed successfully');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seed();