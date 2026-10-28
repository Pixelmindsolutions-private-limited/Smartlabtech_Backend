import express from 'express';
import {
  getCareerPage, createCareerPage, updateCareerPage,
  createOpenRole, getAllOpenRoles, getOpenRoleById, updateOpenRole, deleteOpenRole,
  submitApplication, getAllApplications, getApplicationById,
  getCta, createCta, updateCta, deleteCta
} from '../controllers/career.controller.js';
import { uploadCareerHeroImage } from '../config/multer.config.js';

const router = express.Router();

// Page Settings
router.get('/page', getCareerPage);
router.post('/page', uploadCareerHeroImage, createCareerPage);
router.put('/page', uploadCareerHeroImage, updateCareerPage);

// Open Roles (Public + Admin)
router.get('/roles', getAllOpenRoles);         // Get all roles (supports ?category=&location=)
router.get('/roles/:id', getOpenRoleById);     // Get single role details
router.post('/roles', createOpenRole);         // Admin: create role
router.put('/roles/:id', updateOpenRole);      // Admin: edit role
router.delete('/roles/:id', deleteOpenRole);   // Admin: delete role

// Applications
router.post('/apply', submitApplication);      // Public: submit form
router.get('/applications', getAllApplications); // Admin: view all submissions
router.get('/applications/:id', getApplicationById);

router.get('/cta', getCta);           
router.post('/cta', createCta);       
router.put('/cta', updateCta);      
router.delete('/cta', deleteCta);

export default router;