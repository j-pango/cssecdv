import express from 'express';
import userManagementController from './../../controllers/userManagementController.js';
import { requireAdministrator, requireRoleA, requireAuth } from './../../middleware/auth.js';

const router = express.Router();

// Serve user management page 
router.get('/', requireRoleA, (req, res) => {
    res.render('userManagement');
});

// Unified User Management Routes
router.get('/api/users', requireRoleA, userManagementController.getManagedUsers);
router.post('/api/users/create', requireAdministrator, userManagementController.createUser);
router.put('/api/users/role', requireAdministrator, userManagementController.updateUserRole);
router.put('/api/users/status', requireAdministrator, userManagementController.toggleUserStatus);
router.post('/api/users/assign-manager', requireAdministrator, userManagementController.assignUsersToManager);

export default router; 