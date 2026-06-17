// server.mjs - BillFlow Pro Entry Point

import 'dotenv/config';
import app from './app.js';
import { sequelize } from './models/index.js';

const PORT = process.env.PORT || 5000;

// Sync database and start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    // Sync models (use { force: true } to reset in dev, never in prod)
    await sequelize.sync();
    console.log('✅ Database synced.');

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 BillFlow Pro API running on http://localhost:${PORT}`);
      console.log(`📄 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

startServer();