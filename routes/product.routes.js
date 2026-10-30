import express from 'express';
import {
  createProduct, getAllProducts, getProductById, getProductBySlug, getProductByName,
  getFeaturedProducts, getProductsByBrand, getProductsByCategory, updateProduct, deleteProduct,
  toggleProductStatus, searchProducts, getSearchFilters, searchAllContent,
  getProductSuggestions, addProductSuggestion, removeProductSuggestion, toggleSuggestionStatus,getAllProductsAdmin, bulkAddProductSuggestions
} from '../controllers/product.controller.js';
import { uploadProductImages } from '../config/multer.config.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllProducts);
router.get('/admin', getAllProductsAdmin);
router.get('/search', searchProducts);
router.get('/search/filters', getSearchFilters);
router.get('/search/all', searchAllContent);
router.get('/featured', getFeaturedProducts);
router.get('/suggestions', getProductSuggestions);
router.get('/slug/:slug', getProductBySlug);
router.get('/name/:name', getProductByName);
router.get('/brand/:brandId', getProductsByBrand);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/:id', getProductById);

// Admin routes
router.post('/', protect, authorize('admin', 'staff'), uploadProductImages, createProduct);
router.put('/:id', protect, authorize('admin', 'staff'), uploadProductImages, updateProduct);
router.delete('/:id', protect, authorize('admin', 'staff'), deleteProduct);
router.patch('/:id/toggle', protect, authorize('admin', 'staff'), toggleProductStatus);

// Suggestions routes (Admin)
router.post('/suggestions', protect, authorize('admin', 'staff'), addProductSuggestion);
router.post('/suggestions/bulk', protect, authorize('admin', 'staff'), bulkAddProductSuggestions);
router.delete('/suggestions/:productId', protect, authorize('admin', 'staff'), removeProductSuggestion);
router.patch('/suggestions/:productId/toggle', protect, authorize('admin', 'staff'), toggleSuggestionStatus);

export default router;