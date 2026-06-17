// routes/finalInvoice.routes.mjs

import express from 'express';

import * as ctrl from '../controllers/final.controller.js';

import { protect } from '../middleware/auth.js';
import { paginate } from '../middleware/paginate.js';

const router = express.Router();

router.use(protect);

router.get('/', paginate, ctrl.getInvoices);

router.post('/', ctrl.createInvoice);

router.get('/:id', ctrl.getInvoice);

router.put('/:id', ctrl.updateInvoice);

router.delete('/:id', ctrl.deleteInvoice);

router.patch('/:id/status', ctrl.updateStatus);

router.get('/:id/pdf', ctrl.downloadPdf);

router.post('/:id/email', ctrl.emailInvoice);

export default router;