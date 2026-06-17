// app.mjs - Express App Configuration

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

import { fileURLToPath } from 'url';

import { errorHandler, notFound } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import clientRoutes from './routes/client.routes.js';
import quotationRoutes from './routes/quotation.routes.js';
import purchaseOrderRoutes from './routes/purchaseOrder.routes.js';
import proformaInvoiceRoutes from './routes/proformaInvoice.routes.js';
import finalInvoiceRoutes from './routes/finalInvoice.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import productRoutes from './routes/product.routes.js';
import reportRoutes from './routes/report.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

const app = express();

// Needed because __dirname is not available in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS
app.use(
  cors({
    origin:    'http://localhost:5173' || 'http://192.168.1.55:5173'  , 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    app: 'BillFlow Pro',
  });
});

// API Routes
const API = '/api/v1';

app.use(`${API}/auth`, authRoutes);
app.use(`${API}/dashboard`, dashboardRoutes);
app.use(`${API}/clients`, clientRoutes);
app.use(`${API}/quotations`, quotationRoutes);
app.use(`${API}/purchase-orders`, purchaseOrderRoutes);
app.use(`${API}/proforma-invoices`, proformaInvoiceRoutes);
app.use(`${API}/final-invoices`, finalInvoiceRoutes);
app.use(`${API}/payments`, paymentRoutes);
app.use(`${API}/products`, productRoutes);
app.use(`${API}/reports`, reportRoutes);
app.use(`${API}/settings`, settingsRoutes);

// 404 & Error handlers
app.use(notFound);
app.use(errorHandler);

export default app;