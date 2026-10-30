import express from 'express';
import * as staffController from '../controllers/staffController.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { uploadStaffImage } from '../config/multer.config.js';

const router = express.Router();



// ============================================================
// ADD STAFF
// ============================================================
router.post(
    '/addstaff',
    protect,
    authorize('admin', 'staff'),
    uploadStaffImage,
    staffController.addStaff
);



// ============================================================
// GET ALL STAFF
// ============================================================
router.post(
    '/getall-staff',
    protect,
    authorize('admin', 'staff'),
    staffController.getAllStaff
);



// ============================================================
// GET STAFF BY ID
// ============================================================
router.post(
    '/getstaffbyid',
    protect,
    authorize('admin', 'staff'),
    staffController.getStaffById
);



// ============================================================
// UPDATE STAFF
// ============================================================
router.put(
    '/updatestaff/:id',
    protect,
    authorize('admin', 'staff'),
    uploadStaffImage,
    staffController.editStaff
);



// ============================================================
// DELETE STAFF
// ============================================================
router.delete(
    '/deletestaff/:id',
    protect,
    authorize('admin', 'staff'),
    staffController.deleteStaff
);

router.post(
    '/getall-active-staff',
    protect,
    authorize('admin', 'staff'),
    staffController.getAllActiveStaff
);

router.put(
    '/changepassword/:id',
    protect,
    authorize('admin', 'staff'),
    staffController.changeStaffPassword
);

router.post(
    '/login',
    staffController.staffLogin
);

router.post(
    '/getprofile', protect, authorize('admin', 'staff'),
    staffController.getStaffProfile
);

router.post(
    '/getrolesandpermissions', protect, authorize('admin', 'staff'),
    staffController.getrolesandpermissions
);

export default router;