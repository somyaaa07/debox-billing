// routes/proformaInvoice.routes.mjs

import express from 'express';

import * as ctrl from '../controllers/ProformaInvoice.controller.js';

import { protect } from '../middleware/auth.js';
import { paginate } from '../middleware/paginate.js';

const router = express.Router();

router.use(protect);

router.get('/', paginate, ctrl.getPIs);

router.post('/', ctrl.createPI);

router.get('/:id', ctrl.getPI);

router.put('/:id', ctrl.updatePI);

router.delete('/:id', ctrl.deletePI);

router.patch('/:id/status', ctrl.updateStatus);

router.get('/:id/pdf', ctrl.downloadPdf);

router.post('/:id/email', ctrl.emailPI);

router.post('/:id/convert-to-invoice', ctrl.convertToFinalInvoice);

export default router;