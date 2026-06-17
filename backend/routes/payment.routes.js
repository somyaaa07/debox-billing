// routes/payment.routes.mjs

import express from 'express';

import * as ctrl from '../controllers/payment.controller.js';

import { protect } from '../middleware/auth.js';
import { paginate } from '../middleware/paginate.js';

const router = express.Router();

router.use(protect);

router.get('/', paginate, ctrl.getPayments);

router.post('/', ctrl.createPayment);

router.get('/:id', ctrl.getPayment);

router.delete('/:id', ctrl.deletePayment);

router.get('/:id/receipt', ctrl.downloadReceipt);

export default router;