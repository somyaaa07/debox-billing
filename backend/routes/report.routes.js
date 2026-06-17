// routes/report.routes.mjs

import express from 'express';

import * as ctrl from '../controllers/report.controller.js';

import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/revenue', ctrl.getRevenueReport);

router.get('/gst', ctrl.getGSTReport);

router.get('/outstanding', ctrl.getOutstandingReport);

export default router;