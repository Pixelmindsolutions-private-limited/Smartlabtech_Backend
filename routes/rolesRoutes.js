import express from 'express';
import * as rolesController from '../controllers/rolesController.js';
import { protect, authorize } from '../middleware/auth.middleware.js';


const router = express.Router();

//add plans
router.post('/addrole', protect, authorize('admin', 'staff'), rolesController.createRole);

//get all roles
router.post('/getall-roles', protect, authorize('admin', 'staff'), rolesController.getAllRoles);

//get all active roles
router.post('/getall-activeroles', protect, authorize('admin', 'staff'), rolesController.getAllActiveRoles);

//get role
router.post('/getrolebyid', protect, authorize('admin', 'staff'), rolesController.getSingleRole);

//update role
router.put('/updaterole/:id', protect, authorize('admin', 'staff'), rolesController.updateRole);

//delete role
router.delete('/deleterole/:id', protect, authorize('admin', 'staff'), rolesController.deleteRole);


export default router;