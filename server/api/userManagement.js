import express from 'express';
import userManagementController from './../../controllers/userManagementController.js';
import { requireAdministrator, requireRoleA, requireAuth } from './../../middleware/auth.js';

const router = express.Router();

// Serve user management page
router.get('/user-management', requireRoleA, (req, res) => {
    res.render('userManagement');
});

// Administrator routes
router.get('/api/users', requireAdministrator, userManagementController.getAllUsers);
router.post('/api/users/create', requireAdministrator, userManagementController.createUser);
router.put('/api/users/role', requireAdministrator, userManagementController.updateUserRole);
router.put('/api/users/status', requireAdministrator, userManagementController.toggleUserStatus);
router.post('/api/users/assign-manager', requireAdministrator, userManagementController.assignUsersToManager);

// Role A manager routes
router.get('/api/users/managed', requireRoleA, userManagementController.getManagedUsers);

export default router; 