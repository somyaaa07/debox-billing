import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import { User } from '../models/index.js';
import { logActivity } from '../services/activity.service.js';
import { sendEmail } from '../services/email.service.js';

// ─── Generate JWT ─────────────────────────────
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY_IN || '7d',
  });
};

// ─── LOGIN ─────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email, isActive: true },
    });

    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    user.lastLogin = new Date();
    await user.save();

    await logActivity({
      userId: user.id,
      action: 'LOGIN',
      module: 'auth',
      description: 'User logged in',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'Logged in successfully',
      token: generateToken(user.id),
      user: user.toSafeObject?.() || user,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET ME ────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    res.json({
      success: true,
      user: req.user.toSafeObject?.() || req.user,
    });
  } catch (error) {
    next(error);
  }
};

// ─── UPDATE PROFILE ────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    await req.user.update({ name, email });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: req.user.toSafeObject?.() || req.user,
    });
  } catch (error) {
    next(error);
  }
};

// ─── CHANGE PASSWORD ───────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!(await req.user.validatePassword(currentPassword))) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    await req.user.update({ password: newPassword });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ─── FORGOT PASSWORD ───────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.json({
        success: true,
        message: 'If email exists, reset link will be sent',
      });
    }

    const token = crypto.randomBytes(20).toString('hex');

    const hashed = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    user.resetPasswordToken = hashed;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);

    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <p>Hi ${user.name},</p>
        <p>Click <a href="${resetUrl}">here</a> to reset your password.</p>
      `,
    });

    res.json({
      success: true,
      message: 'Reset link sent if email exists',
    });
  } catch (error) {
    next(error);
  }
};

// ─── RESET PASSWORD ────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const hashed = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      where: { resetPasswordToken: hashed },
    });

    if (!user || new Date() > user.resetPasswordExpires) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    next(error);
  }
};

// ─── EXPORTS ───────────────────────────────────
export {
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};