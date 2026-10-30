import express from 'express';
import multer from 'multer';
import {
  getResourcePage,
  createResourcePage,
  updateResourcePage,
  deleteResourcePage,
  createHero,
  updateHero,
  getHero,
  deleteHero,
  updateArticlesSection,
  getArticlesSection,
  addArticle,
  updateArticle,
  deleteArticle,
  updatePdfsSection,
  getPdfsSection,
  addPdf,
  deletePdf,
  updateCaseStudiesSection,
  getCaseStudiesSection,
  addCaseStudy,
  updateCaseStudy,
  deleteCaseStudy,
  updateFaqsSection,
  getFaqsSection,
  addFaq,
  updateFaq,
  deleteFaq,
  updateAchievementsSection,
  getAchievementsSection,
  addAchievement,
  updateAchievement,
  deleteAchievement,
  updateCtaSection,
  getCtaSection,
  deleteCtaSection
} from '../controllers/resourcePage.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });

// ==================== PUBLIC ROUTES ====================
router.get('/', getResourcePage);

// ==================== FULL PAGE CRUD (ADMIN) ====================
router.post('/', protect, authorize('admin', 'staff'), createResourcePage);
router.put('/', protect, authorize('admin', 'staff'), updateResourcePage);
router.delete('/', protect, authorize('admin', 'staff'), deleteResourcePage);

// ==================== HERO CRUD (ADMIN) ====================
router.post('/hero', protect, authorize('admin', 'staff'), upload.single('image'), createHero);
router.put('/hero', protect, authorize('admin', 'staff'), upload.single('image'), updateHero);
router.get('/hero', getHero);
router.delete('/hero', protect, authorize('admin', 'staff'), deleteHero);

// ==================== ARTICLES CRUD (ADMIN) ====================
router.put('/articles', protect, authorize('admin', 'staff'), updateArticlesSection);
router.get('/articles', getArticlesSection);
router.post('/articles/add', protect, authorize('admin', 'staff'), upload.single('image'), addArticle);
router.put('/articles/:index', protect, authorize('admin', 'staff'), upload.single('image'), updateArticle);
router.delete('/articles/:index', protect, authorize('admin', 'staff'), deleteArticle);

// ==================== PDFs CRUD (ADMIN) ====================
router.put('/pdfs', protect, authorize('admin', 'staff'), updatePdfsSection);
router.get('/pdfs', getPdfsSection);
router.post('/pdfs/add', protect, authorize('admin', 'staff'), upload.single('file'), addPdf);
router.delete('/pdfs/:index', protect, authorize('admin', 'staff'), deletePdf);

// ==================== CASE STUDIES CRUD (ADMIN) ====================
router.put('/case-studies', protect, authorize('admin', 'staff'), updateCaseStudiesSection);
router.get('/case-studies', getCaseStudiesSection);
router.post('/case-studies/add', protect, authorize('admin', 'staff'), upload.single('image'), addCaseStudy);
router.put('/case-studies/:index', protect, authorize('admin', 'staff'), upload.single('image'), updateCaseStudy);
router.delete('/case-studies/:index', protect, authorize('admin', 'staff'), deleteCaseStudy);

// ==================== FAQS CRUD (ADMIN) ====================
router.put('/faqs', protect, authorize('admin', 'staff'), updateFaqsSection);
router.get('/faqs', getFaqsSection);
router.post('/faqs/add', protect, authorize('admin', 'staff'), addFaq);
router.put('/faqs/:index', protect, authorize('admin', 'staff'), updateFaq);
router.delete('/faqs/:index', protect, authorize('admin', 'staff'), deleteFaq);

// ==================== ACHIEVEMENTS CRUD (ADMIN) ====================
router.put('/achievements', protect, authorize('admin', 'staff'), updateAchievementsSection);
router.get('/achievements', getAchievementsSection);
router.post('/achievements/add', protect, authorize('admin', 'staff'), addAchievement);
router.put('/achievements/:index', protect, authorize('admin', 'staff'), updateAchievement);
router.delete('/achievements/:index', protect, authorize('admin', 'staff'), deleteAchievement);

// ==================== CTA CRUD (ADMIN) ====================
router.put('/cta', protect, authorize('admin', 'staff'), updateCtaSection);
router.get('/cta', getCtaSection);
router.delete('/cta', protect, authorize('admin', 'staff'), deleteCtaSection);

export default router;