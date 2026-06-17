// routes/settings.routes.mjs

import express from 'express';

import * as ctrl from '../controllers/settings.controller.js';

import { protect } from '../middleware/auth.js';
import { upload, setUploadFolder } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.get('/', ctrl.getSettings);

router.put('/', ctrl.updateSettings);

router.post(
  '/logo',
  setUploadFolder('logos'),
  upload.single('logo'),
  ctrl.uploadLogo
);

export default router;