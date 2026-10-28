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
    authorize('admin'),
    departmentController.createDepartment
);


// ============================================================
// GET ALL DEPARTMENTS
// ============================================================
router.post(
    '/getall-departments',
    protect,
    authorize('admin'),
    departmentController.getAllDepartments
);


// ============================================================
// GET ALL ACTIVE DEPARTMENTS
// ============================================================
router.post(
    '/getall-activedepartments',
    protect,
    authorize('admin'),
    departmentController.getAllActiveDepartments
);


// ============================================================
// GET DEPARTMENT BY ID
// ============================================================
router.post(
    '/getdepartmentbyid',
    protect,
    authorize('admin'),
    departmentController.getSingleDepartment
);


// ============================================================
// UPDATE DEPARTMENT
// ============================================================
router.put(
    '/updatedepartment/:id',
    protect,
    authorize('admin'),
    departmentController.updateDepartment
);


// ============================================================
// DELETE DEPARTMENT
// ============================================================
router.delete(
    '/deletedepartment/:id',
    protect,
    authorize('admin'),
    departmentController.deleteDepartment
);


export default router;