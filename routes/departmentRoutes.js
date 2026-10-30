import express from 'express';
import * as departmentController from '../controllers/departemntController.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
const router = express.Router();


// ============================================================
// ADD DEPARTMENT
// ============================================================
router.post(
    '/adddepartment',
    protect,
    authorize('admin', 'staff'),
    departmentController.createDepartment
);


// ============================================================
// GET ALL DEPARTMENTS
// ============================================================
router.post(
    '/getall-departments',
    protect,
    authorize('admin', 'staff'),
    departmentController.getAllDepartments
);


// ============================================================
// GET ALL ACTIVE DEPARTMENTS
// ============================================================
router.post(
    '/getall-activedepartments',
    protect,
    authorize('admin', 'staff'),
    departmentController.getAllActiveDepartments
);


// ============================================================
// GET DEPARTMENT BY ID
// ============================================================
router.post(
    '/getdepartmentbyid',
    protect,
    authorize('admin', 'staff'),
    departmentController.getSingleDepartment
);


// ============================================================
// UPDATE DEPARTMENT
// ============================================================
router.put(
    '/updatedepartment/:id',
    protect,
    authorize('admin', 'staff'),
    departmentController.updateDepartment
);


// ============================================================
// DELETE DEPARTMENT
// ============================================================
router.delete(
    '/deletedepartment/:id',
    protect,
    authorize('admin', 'staff'),
    departmentController.deleteDepartment
);


export default router;