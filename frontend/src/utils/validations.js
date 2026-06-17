// src/utils/validations.js
import { z } from 'zod';

const phoneRegex = /^[6-9]\d{9}$/;
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export const clientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().regex(phoneRegex, 'Enter a valid 10-digit mobile number'),
  company: z.string().optional(),
  gstNumber: z.string().regex(gstRegex, 'Enter a valid GST number').optional().or(z.literal('')),
  panNumber: z.string().optional(),
  billingAddress: z.string().optional(),
  shippingAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().default('India'),
  notes: z.string().optional(),
});

export const productSchema = z.object({
  name: z.string().min(2, 'Product name required'),
  description: z.string().optional(),
  sku: z.string().optional(),
  unit: z.string().default('Nos'),
  price: z.coerce.number().min(0, 'Price must be positive'),
  gstRate: z.coerce.number().min(0).max(28, 'GST rate cannot exceed 28%'),
  hsnCode: z.string().optional(),
});

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description required'),
  hsnCode: z.string().optional(),
  quantity: z.coerce.number().min(0.01, 'Quantity must be > 0'),
  unit: z.string().default('Nos'),
  unitPrice: z.coerce.number().min(0, 'Price must be positive'),
  gstRate: z.coerce.number().min(0).max(28),
  discount: z.coerce.number().min(0).optional().default(0),
  productId: z.string().optional(),
});

export const quotationSchema = z.object({
  clientId: z.string().min(1, 'Select a client'),
  quotationDate: z.string().min(1, 'Date required'),
  validUntil: z.string().optional(),
  currency: z.string().default('INR'),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  items: z.array(lineItemSchema).min(1, 'Add at least one item'),
});

export const purchaseOrderSchema = z.object({
  clientId: z.string().min(1, 'Select a client'),
  poNumber: z.string().min(1, 'PO Number required'),
  poDate: z.string().min(1, 'Date required'),
  deliveryDate: z.string().optional(),
  notes: z.string().optional(),
  isManual: z.boolean().default(true),
  items: z.array(lineItemSchema).optional(),
});

export const proformaSchema = z.object({
  clientId: z.string().min(1, 'Select a client'),
  piDate: z.string().min(1, 'Date required'),
  validUntil: z.string().optional(),
  currency: z.string().default('INR'),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  items: z.array(lineItemSchema).min(1, 'Add at least one item'),
});

export const invoiceSchema = z.object({
  clientId: z.string().min(1, 'Select a client'),
  invoiceDate: z.string().min(1, 'Date required'),
  dueDate: z.string().optional(),
  currency: z.string().default('INR'),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  items: z.array(lineItemSchema).min(1, 'Add at least one item'),
});

export const paymentSchema = z.object({
  clientId: z.string().min(1, 'Select a client'),
  finalInvoiceId: z.string().optional(),
  amount: z.coerce.number().min(0.01, 'Amount must be > 0'),
  paymentDate: z.string().min(1, 'Date required'),
  paymentMode: z.enum(['cash', 'upi', 'bank_transfer', 'credit_card', 'cheque', 'other']),
  referenceNumber: z.string().optional(),
  bankName: z.string().optional(),
  notes: z.string().optional(),
  isAdvance: z.boolean().default(false),
});

export const settingsSchema = z.object({
  company_name: z.string().min(1, 'Company name required'),
  company_gst: z.string().regex(gstRegex, 'Invalid GST').optional().or(z.literal('')),
  company_address: z.string().optional(),
  company_phone: z.string().optional(),
  company_email: z.string().email('Invalid email').optional().or(z.literal('')),
  invoice_terms: z.string().optional(),
  currency: z.string().default('INR'),
});
