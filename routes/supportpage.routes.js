import express from 'express';
import multer from 'multer';
import {
  getSupportPage,
  createSupportPage,
  updateSupportPage,
  deleteSupportPage,
  createSupportHero,
  updateSupportHero,
  getSupportHero,
  deleteSupportHero,
  addSupportCard,
  getAllSupportCards,
  getSupportCardById,
  updateSupportCard,
  deleteSupportCard,
  createSupportSolutions,
  updateSupportSolutions,
  getSupportSolutions,
  addSolutionCard,
  updateSolutionCard,
  deleteSolutionCard,
  deleteSupportSolutions,
  createSupportLifeCycle,
  updateSupportLifeCycle,
  getSupportLifeCycle,
  addLifeCyclePoint,
  updateLifeCyclePoint,
  deleteLifeCyclePoint,
  deleteSupportLifeCycle,
  createSupportFaq,
  updateSupportFaq,
  getSupportFaq,
  addFaq,
  updateFaq,
  deleteFaq,
  deleteSupportFaq,
  createSupportCta,
  updateSupportCta,
  getSupportCta,
  deleteSupportCta
} from '../controllers/supportpage.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });

// ==================== PUBLIC ====================
router.get('/', getSupportPage);

// ==================== FULL PAGE CRUD (ADMIN ONLY) ====================
router.post('/', protect, authorize('admin', 'staff'), createSupportPage);
router.put('/', protect, authorize('admin', 'staff'), updateSupportPage);
router.delete('/', protect, authorize('admin', 'staff'), deleteSupportPage);

// ==================== SUPPORT HERO CRUD (ADMIN ONLY) ====================
router.post('/hero', protect, authorize('admin', 'staff'), upload.single('image'), createSupportHero);
router.put('/hero', protect, authorize('admin', 'staff'), upload.single('image'), updateSupportHero);
router.get('/hero', protect, authorize('admin', 'staff'), getSupportHero);
router.delete('/hero', protect, authorize('admin', 'staff'), deleteSupportHero);

// ==================== SUPPORT CARDS CRUD (ADMIN ONLY) ====================
router.post('/cards', protect, authorize('admin', 'staff'), addSupportCard);
router.get('/cards', protect, authorize('admin', 'staff'), getAllSupportCards);
router.get('/cards/:index', protect, authorize('admin', 'staff'), getSupportCardById);
router.put('/cards/:index', protect, authorize('admin', 'staff'), updateSupportCard);
router.delete('/cards/:index', protect, authorize('admin', 'staff'), deleteSupportCard);

// ==================== SUPPORT SOLUTIONS CRUD (ADMIN ONLY) ====================
router.post('/solutions', protect, authorize('admin', 'staff'), createSupportSolutions);
router.put('/solutions', protect, authorize('admin', 'staff'), updateSupportSolutions);
router.get('/solutions', protect, authorize('admin', 'staff'), getSupportSolutions);
router.post('/solutions/cards', protect, authorize('admin', 'staff'), addSolutionCard);
router.put('/solutions/cards/:index', protect, authorize('admin', 'staff'), updateSolutionCard);
router.delete('/solutions/cards/:index', protect, authorize('admin', 'staff'), deleteSolutionCard);
router.delete('/solutions', protect, authorize('admin', 'staff'), deleteSupportSolutions);

// ==================== SUPPORT LIFE CYCLE CRUD (ADMIN ONLY) ====================
router.post('/life-cycle', protect, authorize('admin', 'staff'), createSupportLifeCycle);
router.put('/life-cycle', protect, authorize('admin', 'staff'), updateSupportLifeCycle);
router.get('/life-cycle', protect, authorize('admin', 'staff'), getSupportLifeCycle);
router.post('/life-cycle/points', protect, authorize('admin', 'staff'), addLifeCyclePoint);
router.put('/life-cycle/points/:index', protect, authorize('admin', 'staff'), updateLifeCyclePoint);
router.delete('/life-cycle/points/:index', protect, authorize('admin', 'staff'), deleteLifeCyclePoint);
router.delete('/life-cycle', protect, authorize('admin', 'staff'), deleteSupportLifeCycle);

// ==================== SUPPORT FAQ CRUD (ADMIN ONLY) ====================
router.post('/faq', protect, authorize('admin', 'staff'), createSupportFaq);
router.put('/faq', protect, authorize('admin', 'staff'), updateSupportFaq);
router.get('/faq', protect, authorize('admin', 'staff'), getSupportFaq);
router.post('/faq/add', protect, authorize('admin', 'staff'), addFaq);
router.put('/faq/:index', protect, authorize('admin', 'staff'), updateFaq);
router.delete('/faq/:index', protect, authorize('admin', 'staff'), deleteFaq);
router.delete('/faq', protect, authorize('admin', 'staff'), deleteSupportFaq);

// ==================== SUPPORT CTA CRUD (ADMIN ONLY) ====================
router.post('/cta', protect, authorize('admin', 'staff'), createSupportCta);
router.put('/cta', protect, authorize('admin', 'staff'), updateSupportCta);
router.get('/cta', protect, authorize('admin', 'staff'), getSupportCta);
router.delete('/cta', protect, authorize('admin', 'staff'), deleteSupportCta);

export default router;