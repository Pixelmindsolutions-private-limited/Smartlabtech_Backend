import express from 'express';
import {
  getContactInfo,
  createContactInfo,
  updateContactInfo,
  deleteContactInfo
} from '../controllers/contactinfo.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public route - get contact info
router.get('/', getContactInfo);

// Admin routes
router.post('/', protect, authorize('admin', 'staff'),  createContactInfo);
router.put('/', protect, authorize('admin', 'staff'),  updateContactInfo);
router.delete('/', protect, authorize('admin', 'staff'), deleteContactInfo);

export default router;