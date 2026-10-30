import express from 'express';
import multer from 'multer';
import {
  getBlogsPage, createBlogHero, updateBlogHero, getBlogHero, deleteBlogHero,
  createBlog, getAllBlogs, getBlogBySlug, getBlogById, updateBlog, deleteBlog,
  getFeaturedBlogs, getAllCategories, getAllTags
} from '../controllers/blogspage.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });
const blogUploadFields = upload.fields([{ name: 'bgImage', maxCount: 1 }, { name: 'mainImage', maxCount: 1 }, { name: 'authorImage', maxCount: 1 }]);

// Public routes
router.get('/', getBlogsPage);
router.get('/all', getAllBlogs);
router.get('/categories', getAllCategories);
router.get('/tags', getAllTags);
router.get('/featured', getFeaturedBlogs);
router.get('/slug/:slug', getBlogBySlug);
router.get('/:id', getBlogById);

// Blog Hero (Admin)
router.route('/hero')
  .get(getBlogHero)
  .post(protect, authorize('admin', 'staff'), upload.single('image'), createBlogHero)
  .put(protect, authorize('admin', 'staff'), upload.single('image'), updateBlogHero)
  .delete(protect, authorize('admin', 'staff'), deleteBlogHero);

// Blogs (Admin)
router.post('/', protect, authorize('admin', 'staff'), blogUploadFields, createBlog);
router.put('/:id', protect, authorize('admin', 'staff'), blogUploadFields, updateBlog);
router.delete('/:id', protect, authorize('admin', 'staff'), deleteBlog);

export default router;