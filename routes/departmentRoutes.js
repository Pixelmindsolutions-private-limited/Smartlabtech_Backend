import express from 'express';
import * as departmentController from '../../controllers/admin/departemntController.js';
import { verifyAdminToken } from "../../middleware/verifyAdminToken.js";

const router = express.Router();


// ============================================================
// ADD DEPARTMENT
// ============================================================
router.post(
    '/adddepartment',
    verifyAdminToken,
    departmentController.createDepartment
);


// ============================================================
// GET ALL DEPARTMENTS
// ============================================================
router.post(
    '/getall-departments',
    verifyAdminToken,
    departmentController.getAllDepartments
);


// ============================================================
// GET ALL ACTIVE DEPARTMENTS
// ============================================================
router.post(
    '/getall-activedepartments',
    verifyAdminToken,
    departmentController.getAllActiveDepartments
);


// ============================================================
// GET DEPARTMENT BY ID
// ============================================================
router.post(
    '/getdepartmentbyid',
    verifyAdminToken,
    departmentController.getSingleDepartment
);


// ============================================================
// UPDATE DEPARTMENT
// ============================================================
router.put(
    '/updatedepartment/:id',
    verifyAdminToken,
    departmentController.updateDepartment
);


// ============================================================
// DELETE DEPARTMENT
// ============================================================
router.delete(
    '/deletedepartment/:id',
    verifyAdminToken,
    departmentController.deleteDepartment
);


export default router;