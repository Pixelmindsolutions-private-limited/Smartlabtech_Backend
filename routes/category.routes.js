import express from 'express';
import {
  createCategory,
  getAllCategories,
  getCategoryOptions,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoriesWithProducts,
  getCategoryWithProducts
} from '../controllers/category.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllCategories);
router.get('/options', getCategoryOptions);
router.get('/with-products', getCategoriesWithProducts);
router.get('/:id/with-products', getCategoryWithProducts);
router.get('/:id', getCategoryById);

// Admin routes
router.post('/', protect, authorize('admin', 'staff'), createCategory);
router.put('/:id', protect, authorize('admin', 'staff'), updateCategory);
router.delete('/:id', protect, authorize('admin', 'staff'), deleteCategory);

export default router;