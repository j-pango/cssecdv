import express from 'express';
import adminController from './../../controllers/adminController.js';
const router = express.Router();

// Go to admin page
router.get('/', adminController.getAdmin);
router.post('/edit-product', adminController.editProduct);
router.post('/delete-product', adminController.deleteProduct);
router.post('/create-product', adminController.createProduct);
export default router;