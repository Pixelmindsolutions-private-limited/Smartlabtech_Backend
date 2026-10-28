import Department from '../models/department.js';

// ============================================================
// 1. CREATE DEPARTMENT
// ============================================================
export const createDepartment = async (req, res) => {
    try {
        const {
            departmentName,
            status
        } = req.body;

        // Check if department already exists
        const existingDepartment = await Department.findOne({
            departmentName: {
                $regex: new RegExp(`^${departmentName}$`, 'i')
            }
        });

        if (existingDepartment) {
            return res.status(400).json({
                error: 'Department already exists'
            });
        }

        // Create new department
        const department = new Department({
            departmentName,
            createdBy: req.userId,
            status
        });

        await department.save();

        return res.status(201).json({
            success: true,
            message: 'Department created successfully',
            department
        });

    } catch (error) {
        console.log(error);

        return res.status(400).json({
            error: error.message
        });
    }
};


// ============================================================
// 2. GET ALL DEPARTMENTS
// ============================================================
export const getAllDepartments = async (req, res) => {
    try {
        let condition = {};

        if (req.query.searchQuery && req.query.searchQuery !== "") {
            const regex = new RegExp(req.query.searchQuery, "i");

            condition = {
                departmentName: regex
            };
        }

        const departments = await Department
            .find(condition)
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Departments fetched successfully",
            departments
        });

    } catch (error) {
        console.log(error);

        return res.status(400).json({
            error: error.message
        });
    }
};


// ============================================================
// 3. GET SINGLE DEPARTMENT
// ============================================================
export const getSingleDepartment = async (req, res) => {
    try {
        const department = await Department.findOne({
            _id: req.body.id
        });

        return res.status(200).json({
            success: true,
            department: department || {}
        });

    } catch (error) {
        console.log(error);

        return res.status(400).json({
            error: error.message
        });
    }
};


// ============================================================
// 4. UPDATE DEPARTMENT
// ============================================================
export const updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            departmentName,
            status
        } = req.body;

        // Check if another department has the same name
        const existingDepartment = await Department.findOne({
            departmentName: {
                $regex: new RegExp(`^${departmentName}$`, 'i')
            },
            _id: { $ne: id }
        });

        if (existingDepartment) {
            return res.status(400).json({
                error: 'Department already exists'
            });
        }

        const department = await Department.findOneAndUpdate(
            { _id: id },
            {
                departmentName,
                status,
                updatedAt: new Date()
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!department) {
            return res.status(404).json({
                error: 'Department not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Department updated successfully',
            department
        });

    } catch (error) {
        console.log(error);

        return res.status(400).json({
            error: error.message
        });
    }
};


// ============================================================
// 5. DELETE DEPARTMENT
// ============================================================
export const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;

        const department = await Department.findOneAndDelete({
            _id: id
        });

        if (!department) {
            return res.status(404).json({
                error: 'Department not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Department deleted successfully'
        });

    } catch (error) {
        console.log(error);

        return res.status(400).json({
            error: error.message
        });
    }
};


// ============================================================
// 6. GET ALL ACTIVE DEPARTMENTS
// ============================================================
export const getAllActiveDepartments = async (req, res) => {
    try {
        let condition = {
            status: "active"
        };

        if (req.query.searchQuery && req.query.searchQuery !== "") {
            const regex = new RegExp(req.query.searchQuery, "i");

            condition.departmentName = regex;
        }

        const departments = await Department
            .find(condition)
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Active departments fetched successfully",
            activeDepartments: departments
        });

    } catch (error) {
        console.log(error);

        return res.status(400).json({
            error: error.message
        });
    }
};