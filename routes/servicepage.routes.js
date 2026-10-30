import express from 'express';
import multer from 'multer';
import {
  getServicesPage,
  createServicesPage,
  updateServicesPage,
  deleteServicesPage,
  createServiceHome,
  updateServiceHome,
  getServiceHome,
  deleteServiceHome,
  createServiceHero,
  updateServiceHero,
  getServiceHero,
  addServiceHeroPoint,
  updateServiceHeroPoint,
  deleteServiceHeroPoint,
  deleteServiceHero,
  createServiceCatalogue,
  updateServiceCatalogue,
  getServiceCatalogue,
  addCatalogueCard,
  getAllCatalogueCards,
  getCatalogueCardById,
  updateCatalogueCard,
  deleteCatalogueCard,
  deleteServiceCatalogue,
  createServiceSupport,
  updateServiceSupport,
  getServiceSupport,
  addServiceSupportPoint,
  updateServiceSupportPoint,
  deleteServiceSupportPoint,
  deleteServiceSupport,
  submitServiceRequest,
  getAllServiceRequests,
  getServiceRequestById,
  getServiceRequestsByStatus,
  updateServiceStatus,
  updateServiceRequest,
  deleteServiceRequest,
  permanentDeleteServiceRequest,
  getServiceStats,
  // Popup functions
  createPopup,
  updatePopup,
  getPopup,
  deletePopup
} from '../controllers/servicePage.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });

// ==================== PUBLIC ROUTES ====================
router.get('/', getServicesPage);
router.get('/popup', getPopup);  
router.post('/submit', submitServiceRequest);

// ==================== FULL PAGE CRUD (ADMIN ONLY) ====================
router.post('/', protect, authorize('admin', 'staff'), createServicesPage);
router.put('/', protect, authorize('admin', 'staff'), updateServicesPage);
router.delete('/', protect, authorize('admin', 'staff'), deleteServicesPage);

// ==================== POPUP CRUD (ADMIN ONLY) ====================
router.post('/popup', protect, authorize('admin', 'staff'), upload.single('image'), createPopup);
router.put('/popup', protect, authorize('admin', 'staff'), upload.single('image'), updatePopup);
router.delete('/popup', protect, authorize('admin', 'staff'), deletePopup);

// ==================== SERVICE HOME CRUD (ADMIN ONLY) ====================
router.post('/service-home', protect, authorize('admin', 'staff'), upload.single('image'), createServiceHome);
router.put('/service-home', protect, authorize('admin', 'staff'), upload.single('image'), updateServiceHome);
router.get('/service-home', protect, authorize('admin', 'staff'), getServiceHome);
router.delete('/service-home', protect, authorize('admin', 'staff'), deleteServiceHome);

// ==================== SERVICE HERO CRUD (ADMIN ONLY) ====================
router.post('/service-hero', protect, authorize('admin', 'staff'), createServiceHero);
router.put('/service-hero', protect, authorize('admin', 'staff'), updateServiceHero);
router.get('/service-hero', protect, authorize('admin', 'staff'), getServiceHero);
router.post('/service-hero/points', protect, authorize('admin', 'staff'), addServiceHeroPoint);
router.put('/service-hero/points/:index', protect, authorize('admin', 'staff'), updateServiceHeroPoint);
router.delete('/service-hero/points/:index', protect, authorize('admin', 'staff'), deleteServiceHeroPoint);
router.delete('/service-hero', protect, authorize('admin', 'staff'), deleteServiceHero);

// ==================== SERVICE CATALOGUE CRUD (ADMIN ONLY) ====================
router.post('/service-catalogue', protect, authorize('admin', 'staff'), createServiceCatalogue);
router.put('/service-catalogue', protect, authorize('admin', 'staff'), updateServiceCatalogue);
router.get('/service-catalogue', protect, authorize('admin', 'staff'), getServiceCatalogue);
router.post('/service-catalogue/cards', protect, authorize('admin', 'staff'), addCatalogueCard);
router.get('/service-catalogue/cards', protect, authorize('admin', 'staff'), getAllCatalogueCards);
router.get('/service-catalogue/cards/:index', protect, authorize('admin', 'staff'), getCatalogueCardById);
router.put('/service-catalogue/cards/:index', protect, authorize('admin', 'staff'), updateCatalogueCard);
router.delete('/service-catalogue/cards/:index', protect, authorize('admin', 'staff'), deleteCatalogueCard);
router.delete('/service-catalogue', protect, authorize('admin', 'staff'), deleteServiceCatalogue);

// ==================== SERVICE SUPPORT CRUD (ADMIN ONLY) ====================
router.post('/service-support', protect, authorize('admin', 'staff'), createServiceSupport);
router.put('/service-support', protect, authorize('admin', 'staff'), updateServiceSupport);
router.get('/service-support', protect, authorize('admin', 'staff'), getServiceSupport);
router.post('/service-support/points', protect, authorize('admin', 'staff'), addServiceSupportPoint);
router.put('/service-support/points/:index', protect, authorize('admin', 'staff'), updateServiceSupportPoint);
router.delete('/service-support/points/:index', protect, authorize('admin', 'staff'), deleteServiceSupportPoint);
router.delete('/service-support', protect, authorize('admin', 'staff'), deleteServiceSupport);

// ==================== SERVICE REQUESTS (ADMIN ONLY) ====================
router.get('/admin', protect, authorize('admin', 'staff'), getAllServiceRequests);
router.get('/admin/stats', protect, authorize('admin', 'staff'), getServiceStats);
router.get('/admin/status/:status', protect, authorize('admin', 'staff'), getServiceRequestsByStatus);
router.get('/admin/:id', protect, authorize('admin', 'staff'), getServiceRequestById);
router.put('/admin/:id/status', protect, authorize('admin', 'staff'), updateServiceStatus);
router.put('/admin/:id', protect, authorize('admin', 'staff'), updateServiceRequest);
router.delete('/admin/:id', protect, authorize('admin', 'staff'), deleteServiceRequest);
router.delete('/admin/:id/permanent', protect, authorize('admin', 'staff'), permanentDeleteServiceRequest);

export default router;