import express from 'express';
import * as rolesController from '../../controllers/admin/rolesController.js';
import { verifyAdminToken } from "../../middleware/verifyAdminToken.js";


const router = express.Router();

//add plans
router.post('/addrole', verifyAdminToken, rolesController.createRole);

//get all roles
router.post('/getall-roles', verifyAdminToken, rolesController.getAllRoles);

//get all active roles
router.post('/getall-activeroles', verifyAdminToken, rolesController.getAllActiveRoles);

//get role
router.post('/getrolebyid', verifyAdminToken, rolesController.getSingleRole);

//update role
router.put('/updaterole/:id', verifyAdminToken, rolesController.updateRole);

//delete role
router.delete('/deleterole/:id', verifyAdminToken, rolesController.deleteRole);


export default router;