import express from 'express';
import auditController from './../../controllers/auditController.js';
import { requireAdministrator } from './../../middleware/auth.js';

const router = express.Router();

// All audit routes require Administrator role
router.get('/api/audit/logs', requireAdministrator, auditController.getAllLogs);
router.get('/api/audit/logs/user/:userId', requireAdministrator, auditController.getLogsByUser);
router.get('/api/audit/logs/action/:action', requireAdministrator, auditController.getLogsByAction);
router.get('/api/audit/stats', requireAdministrator, auditController.getSystemStats);
router.get('/api/audit/export', requireAdministrator, auditController.exportLogs);

export default router; 