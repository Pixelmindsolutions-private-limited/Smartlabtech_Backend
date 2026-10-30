import express from 'express';
import {
  createBrand,
  getAllBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
  getBrandOptions
} from '../controllers/brand.controller.js';
import { uploadBrandLogo } from '../config/multer.config.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllBrands);
router.get('/options', getBrandOptions);
router.get('/:id', getBrandById);

// Admin routes
router.post('/', protect, authorize('admin', 'staff'), uploadBrandLogo, createBrand);
router.put('/:id', protect, authorize('admin', 'staff'), uploadBrandLogo, updateBrand);
router.delete('/:id', protect, authorize('admin', 'staff'), deleteBrand);

export default router;