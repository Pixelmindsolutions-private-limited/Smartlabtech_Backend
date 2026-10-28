import Role from '../models/roles.js';

// ============================================================
// 1. CREATE ROLE
// ============================================================
export const createRole = async (req, res) => {
    try {
        const {
            roleName,
            rolesAndPermission,
            createdBy,
            status
        } = req.body;

        // Check if role already exists (case-insensitive exact match)
        const existingRole = await Role.findOne({
            roleName: {
                $regex: new RegExp(`^${roleName}$`, 'i')
            }
        });

        if (existingRole) {
            return res.status(400).json({
                error: 'Role already exists'
            });
        }

        // Create new role
        const role = new Role({
            roleName,
            rolesAndPermission,
            createdBy,
            status
        });

        await role.save();

        return res.status(201).json({
            success: true,
            message: 'Role created successfully',
            role
        });

    } catch (error) {
        console.log(error);

        return res.status(400).json({
            error: error.message
        });
    }
};


// ============================================================
// 2. GET ALL ROLES
// ============================================================
export const getAllRoles = async (req, res) => {
    try {
        let condition = {};

        if (req.query.searchQuery && req.query.searchQuery !== "") {
            const regex = new RegExp(req.query.searchQuery, "i");

            condition = {
                roleName: regex
            };
        }

        const roles = await Role
            .find(condition)
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Roles fetched successfully",
            roles
        });

    } catch (error) {
        console.log(error);

        return res.status(400).json({
            error: error.message
        });
    }
};


// ============================================================
// 3. GET SINGLE ROLE
// ============================================================
export const getSingleRole = async (req, res) => {
    try {
        const role = await Role.findOne({
            _id: req.body.id
        });

        return res.status(200).json({
            success: true,
            role: role || {}
        });

    } catch (error) {
        console.log(error);

        return res.status(400).json({
            error: error.message
        });
    }
};


// ============================================================
// 4. UPDATE ROLE
// ============================================================
export const updateRole = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            roleName,
            rolesAndPermission,
            createdBy,
            status
        } = req.body;

        // Check if another role already has the same name
        const existingRole = await Role.findOne({
            roleName: {
                $regex: new RegExp(`^${roleName}$`, 'i')
            },
            _id: { $ne: id }
        });

        if (existingRole) {
            return res.status(400).json({
                error: 'Role already exists'
            });
        }

        const role = await Role.findOneAndUpdate(
            { _id: id },
            {
                roleName,
                rolesAndPermission,
                createdBy,
                status,
                updatedAt: new Date()
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!role) {
            return res.status(404).json({
                error: 'Role not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Role updated successfully',
            role
        });

    } catch (error) {
        console.log(error);

        return res.status(400).json({
            error: error.message
        });
    }
};


// ============================================================
// 5. DELETE ROLE
// ============================================================
export const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;

        const role = await Role.findOneAndDelete({
            _id: id
        });

        if (!role) {
            return res.status(404).json({
                error: 'Role not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Role deleted successfully'
        });

    } catch (error) {
        console.log(error);

        return res.status(400).json({
            error: error.message
        });
    }
};


// ============================================================
// 6. GET ALL ACTIVE ROLES
// ============================================================
export const getAllActiveRoles = async (req, res) => {
    try {
        let condition = {
            status: "active"
        };

        if (req.query.searchQuery && req.query.searchQuery !== "") {
            const regex = new RegExp(req.query.searchQuery, "i");

            condition.roleName = regex;
        }

        const roles = await Role
            .find(condition)
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Active roles fetched successfully",
            activeRoles: roles
        });

    } catch (error) {
        console.log(error);

        return res.status(400).json({
            error: error.message
        });
    }
};