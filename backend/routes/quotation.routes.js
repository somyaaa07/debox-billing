// routes/quotation.routes.mjs

import express from 'express';

import * as ctrl from '../controllers/quotation.controller.js';

import { protect } from '../middleware/auth.js';
import { paginate } from '../middleware/paginate.js';

const router = express.Router();

router.use(protect);

router.get('/', paginate, ctrl.getQuotations);

router.post('/', ctrl.createQuotation);

router.get('/:id', ctrl.getQuotation);

router.put('/:id', ctrl.updateQuotation);

router.delete('/:id', ctrl.deleteQuotation);

router.patch('/:id/status', ctrl.updateStatus);

router.get('/:id/pdf', ctrl.downloadPdf);

router.post('/:id/email', ctrl.emailQuotation);

export default router;