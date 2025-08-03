import express from 'express';
import passwordController from './../../controllers/passwordController.js';
import { requireAuth, requireAdministrator } from './../../middleware/auth.js';

const router = express.Router();

// Password change for any authenticated user
router.post('/api/password/change', requireAuth, passwordController.changePassword);

// Password reset by administrator
router.post('/api/password/reset', requireAdministrator, passwordController.resetUserPassword);

export default router; 