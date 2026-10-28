import express from 'express';
import * as rolesController from '../controllers/rolesController.js';
import { protect, authorize } from '../middleware/auth.middleware.js';


const router = express.Router();

//add plans
router.post('/addrole', protect, authorize('admin'), rolesController.createRole);

//get all roles
router.post('/getall-roles', protect, authorize('admin'), rolesController.getAllRoles);

//get all active roles
router.post('/getall-activeroles', protect, authorize('admin'), rolesController.getAllActiveRoles);

//get role
router.post('/getrolebyid', protect, authorize('admin'), rolesController.getSingleRole);

//update role
router.put('/updaterole/:id', protect, authorize('admin'), rolesController.updateRole);

//delete role
router.delete('/deleterole/:id', protect, authorize('admin'), rolesController.deleteRole);


export default router;