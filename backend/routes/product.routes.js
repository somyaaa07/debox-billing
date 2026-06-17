// routes/product.routes.mjs

import express from 'express';

import * as ctrl from '../controllers/product.controller.js';

import { protect } from '../middleware/auth.js';
import { paginate } from '../middleware/paginate.js';

const router = express.Router();

router.use(protect);

router.get('/', paginate, ctrl.getProducts);

router.post('/', ctrl.createProduct);

router.put('/:id', ctrl.updateProduct);

router.delete('/:id', ctrl.deleteProduct);

export default router;