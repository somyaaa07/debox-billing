// routes/auth.routes.mjs

import express from 'express';

import {
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';

import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/me', protect, getMe);

router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

export default router;