// routes/purchaseOrder.routes.mjs

import express from 'express';

import * as ctrl from '../controllers/purchaseOrder.controller.js';

import { protect } from '../middleware/auth.js';
import { paginate } from '../middleware/paginate.js';
import { upload, setUploadFolder } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.get('/', paginate, ctrl.getPOs);

router.post(
  '/',
  setUploadFolder('purchase-orders'),
  upload.single('attachment'),
  ctrl.createPO
);

router.get('/:id', ctrl.getPO);

router.put(
  '/:id',
  setUploadFolder('purchase-orders'),
  upload.single('attachment'),
  ctrl.updatePO
);

router.delete('/:id', ctrl.deletePO);

router.patch('/:id/status', ctrl.updateStatus);

router.post('/:id/convert-to-pi', ctrl.convertToPI);

export default router;