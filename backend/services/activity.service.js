// services/activity.service.mjs

import { ActivityLog } from '../models/index.js';

export const logActivity = async ({
  userId,
  action,
  module,
  moduleId,
  description,
  ipAddress,
  userAgent,
  metadata,
}) => {
  try {
    await ActivityLog.create({
      userId,
      action,
      module,
      moduleId,
      description,
      ipAddress,
      userAgent,
      metadata,
    });
  } catch (err) {
    // Never let logging break the main flow
    console.error('Activity log error:', err.message);
  }
};