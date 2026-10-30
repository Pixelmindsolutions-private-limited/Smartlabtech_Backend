import express from 'express';
import multer from 'multer';
import {
  getHomePage,
  addHero,
  getAllHero,
  getHeroById,
  updateHero,
  deleteHero,
  createAbout, getAbout, updateAbout, deleteAbout,
  addAboutPoint, updateAboutPoint, deleteAboutPoint,
  createAchievements, getAchievements, updateAchievements, deleteAchievements,
  addAchievementImage, updateAchievementImage, deleteAchievementImage,
  createTestimonials, getTestimonials, updateTestimonials, deleteTestimonials,
  addTestimonial, updateTestimonial, deleteTestimonial
} from '../controllers/homepage.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });

// ==================== PUBLIC ====================
router.get('/', getHomePage);

// ==================== HERO SECTION CRUD (ADMIN ONLY) ====================
router.post('/hero', protect, authorize('admin', 'staff'), upload.single('image'), addHero);
router.get('/hero',  getAllHero);
router.get('/hero/:index', protect, authorize('admin', 'staff'), getHeroById);
router.put('/hero/:index', protect, authorize('admin', 'staff'), upload.single('image'), updateHero);
router.delete('/hero/:index', protect, authorize('admin', 'staff'), deleteHero);

// ==================== ABOUT SECTION CRUD (ADMIN ONLY) ====================
router.post('/about', protect, authorize('admin', 'staff'), upload.single('image'), createAbout);
router.get('/about',  getAbout);
router.put('/about', protect, authorize('admin', 'staff'), upload.single('image'), updateAbout);
router.delete('/about', protect, authorize('admin', 'staff'), deleteAbout);

// About Points CRUD (ADMIN ONLY)
router.post('/about/points', protect, authorize('admin', 'staff'), addAboutPoint);
router.put('/about/points/:index', protect, authorize('admin', 'staff'), updateAboutPoint);
router.delete('/about/points/:index', protect, authorize('admin', 'staff'), deleteAboutPoint);

// ==================== ACHIEVEMENTS SECTION CRUD (ADMIN ONLY) ====================
router.post('/achievements', protect, authorize('admin', 'staff'), upload.array('images', 20), createAchievements);
router.get('/achievements',  getAchievements);
router.put('/achievements', protect, authorize('admin', 'staff'), upload.array('images', 20), updateAchievements);
router.delete('/achievements', protect, authorize('admin', 'staff'), deleteAchievements);

// Achievement Images CRUD (ADMIN ONLY)
router.post('/achievements/images', protect, authorize('admin', 'staff'), upload.single('image'), addAchievementImage);
router.put('/achievements/images/:index', protect, authorize('admin', 'staff'), upload.single('image'), updateAchievementImage);
router.delete('/achievements/images/:index', protect, authorize('admin', 'staff'), deleteAchievementImage);

// ==================== TESTIMONIALS SECTION CRUD (ADMIN ONLY) ====================
router.post('/testimonials', protect, authorize('admin', 'staff'), createTestimonials);
router.get('/testimonials',  getTestimonials);
router.put('/testimonials', protect, authorize('admin', 'staff'), updateTestimonials);
router.delete('/testimonials', protect, authorize('admin', 'staff'), deleteTestimonials);

// Testimonial Items CRUD (ADMIN ONLY)
router.post('/testimonials/add', protect, authorize('admin', 'staff'), upload.single('image'), addTestimonial);
router.put('/testimonials/:index', protect, authorize('admin', 'staff'), upload.single('image'), updateTestimonial);
router.delete('/testimonials/:index', protect, authorize('admin', 'staff'), deleteTestimonial);

export default router;