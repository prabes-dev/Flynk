// server.js
import express from 'express';
import { setupCleanupAPI } from './setupCleanup.js';

const app = express();
const cleanupManager = setupCleanupAPI(app);

// Your cleanup will run automatically!
// API endpoints available at:
// POST /api/admin/cleanup - Manual cleanup
// GET /api/admin/cleanup/stats - Get statistics