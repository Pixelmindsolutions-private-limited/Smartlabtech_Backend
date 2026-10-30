import express from 'express';
import multer from 'multer';
import {
  createContactHero, updateContactHero, getContactHero, deleteContactHero,
  createSubject, getAllSubjects, getActiveSubjects, getSubjectById,
  updateSubject, deleteSubject, toggleSubjectStatus,
  submitContactForm, getAllContacts, getContactById, updateContactStatus, deleteContact, getContactStats
} from '../controllers/contact.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });

// Public routes
router.get('/hero', getContactHero);
router.get('/subjects/active', getActiveSubjects);
router.post('/submit', submitContactForm);

// Contact Hero (Admin)
router.route('/hero')
  .post(protect, authorize('admin', 'staff'), upload.single('image'), createContactHero)
  .put(protect, authorize('admin', 'staff'), upload.single('image'), updateContactHero)
  .delete(protect, authorize('admin', 'staff'), deleteContactHero);

// Subjects (Admin)
router.route('/subjects')
  .get(getAllSubjects)
  .post(protect, authorize('admin', 'staff'), createSubject);
router.route('/subjects/:id')
  .get(protect, authorize('admin', 'staff'), getSubjectById)
  .put(protect, authorize('admin', 'staff'), updateSubject)
  .delete(protect, authorize('admin', 'staff'), deleteSubject);
router.patch('/subjects/:id/toggle', protect, authorize('admin', 'staff'), toggleSubjectStatus);

// Contact Submissions (Admin)
router.get('/all', getAllContacts);
router.get('/stats', getContactStats);
router.route('/:id/status')
  .get(protect, authorize('admin', 'staff'), getContactById)
  .put(protect, authorize('admin', 'staff'), updateContactStatus);
  
router.delete('/:id', protect, authorize('admin', 'staff'), deleteContact);

export default router;