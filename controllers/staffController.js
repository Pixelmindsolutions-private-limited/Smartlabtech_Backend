import staffModel from "../models/staff.js";
import roleModel from "../models/roles.js";
import departmentModel from "../models/department.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import jwt from 'jsonwebtoken';
import { DateTime } from "luxon";
import crypto from "crypto";


dotenv.config();

// ==========================================
// ADD STAFF
// ==========================================
export const addStaff = async function (req, res) {
    try {


        const staff = await staffModel.findOne({
            $or: [
                { email: req.body.email },
                { phone: req.body.phone }
            ]
        });

        if (staff) {
            return res.status(400).json({
                success: false,
                message: "Staff already exist!"
            });
        }

        const bcryptedpassword = bcrypt.hashSync(req.body.password, 10);

        // ==========================================
        // DEPARTMENT
        // ==========================================
        const department = await departmentModel.findOne(
            { _id: req.body.departmentId },

        );

        if (!department) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        // ==========================================
        // ROLE
        // ==========================================
        const role = await roleModel.findOne(
            { _id: req.body.roleId },

        );

        if (!role) {
            return res.status(404).json({
                success: false,
                message: "Role not found"
            });
        }
        let imageUrl = "";
        if (req.file) {
            // Extracts just the relative path: /uploads/staff/staffImage-12345.jpg
            // This is crucial for the frontend to load the image correctly
            const relativePath = req.file.path.split('uploads')[1].replace(/\\/g, '/');
            imageUrl = `/uploads${relativePath}`;
        }


        const staffObj = new staffModel({
            name: req.body.name,
            phone: req.body.phone,
            email: req.body.email,
            password: bcryptedpassword,

            departmentId: req.body.departmentId,


            roleId: req.body.roleId,
            image: imageUrl,
            address: req.body.address,


        });

        const saveStaff = await staffObj.save();

        if (saveStaff) {
            return res.status(200).json({
                success: true,
                message: "Staff has been added"
            });
        }

        return res.status(400).json({
            success: false,
            message: "Bad request"
        });

    } catch (err) {
        console.log(err);

        return res.status(400).json({
            success: false,
            message: "Something went wrong"
        });
    }
};


// ==========================================
// GET ALL STAFF
// ==========================================
export const getAllStaff = async function (req, res) {
    try {
        let matchCondition = {
            // status: "active"
        };

        if (
            req.query.searchQuery &&
            req.query.searchQuery !== ""
        ) {
            const regex = new RegExp(req.query.searchQuery, "i");

            matchCondition = {
                $or: [
                    { name: regex },
                    { email: regex },
                    { phone: regex }
                ]
            };
        }

        const staff = await staffModel.aggregate([
            {
                $match: matchCondition
            },

            // ==========================================
            // LOOKUP ROLE
            // ==========================================
            {
                $lookup: {
                    from: "roles",
                    localField: "roleId",
                    foreignField: "_id",
                    as: "roleData"
                }
            },

            // ==========================================
            // UNWIND ROLE
            // ==========================================
            {
                $unwind: {
                    path: "$roleData",
                    preserveNullAndEmptyArrays: true
                }
            },

            // ==========================================
            // LOOKUP DEPARTMENT
            // ==========================================
            {
                $lookup: {
                    from: "departments",
                    localField: "departmentId",
                    foreignField: "_id",
                    as: "departmentData"
                }
            },

            {
                $unwind: {
                    path: "$departmentData",
                    preserveNullAndEmptyArrays: true
                }
            },

            // ==========================================
            // ADD DYNAMIC FIELDS
            // ==========================================
            {
                $addFields: {
                    roleName: "$roleData.roleName",
                    departmentName: "$departmentData.departmentName"
                }
            },

            // ==========================================
            // REMOVE LOOKUP DATA
            // ==========================================
            {
                $project: {
                    roleData: 0
                    // departmentData: 0
                }
            },

            {
                $sort: {
                    createdAt: -1
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            message: "Staff details has been retrieved",
            staff: staff
        });

    } catch (err) {
        console.log(err);

        return res.status(400).json({
            success: false,
            message: "Something went wrong"
        });
    }
};


// ==========================================
// UPDATE STAFF
// ==========================================
export const editStaff = async function (req, res) {
    try {


        // ==========================================
        // DEPARTMENT
        // ==========================================
        const department = await departmentModel.findOne(
            { _id: req.body.departmentId },

        );
        if (!department) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        // ==========================================
        // ROLE
        // ==========================================
        const role = await roleModel.findOne(
            { _id: req.body.roleId },

        );

        if (!role) {
            return res.status(404).json({
                success: false,
                message: "Role not found"
            });
        }

        // ==========================================
        // UPDATE DATA
        // ==========================================
        const updateData = {
            name: req.body.name,
            phone: req.body.phone,
            email: req.body.email,

            departmentId: req.body.departmentId,

            roleId: req.body.roleId,
            status: req.body.status,

            address: req.body.address,

        };
        if (req.file) {
            // Extracts just the relative path
            const relativePath = req.file.path.split('uploads')[1].replace(/\\/g, '/');
            updateData.image = `/uploads${relativePath}`; // ✅ Now saving the correct web URL
        }

        const staff = await staffModel.findByIdAndUpdate(
            req.params.id,
            {
                $set: updateData
            },
            {
                new: true
            }
        );

        if (staff) {
            return res.status(200).json({
                success: true,
                message: "Staff has been updated"
            });
        }

        return res.status(400).json({
            success: false,
            message: "Bad request"
        });

    } catch (err) {
        console.log(err);

        return res.status(400).json({
            success: false,
            message: "Something went wrong"
        });
    }
};


// ==========================================
// DELETE STAFF
// ==========================================
export const deleteStaff = async function (req, res) {
    try {
        const staff = await staffModel.findOneAndDelete({
            _id: req.params.id
        });

        if (staff) {
            return res.status(200).json({
                success: true,
                message: "Staff has been deleted"
            });
        }

        return res.status(400).json({
            success: false,
            message: "Staff could not be deleted"
        });

    } catch (err) {
        console.log(err);

        return res.status(400).json({
            success: false,
            message: "Something went wrong"
        });
    }
};


// ==========================================
// GET STAFF BY ID
// ==========================================
export const getStaffById = async function (req, res) {
    try {
        const { staffId } = req.body;

        // ==========================================
        // VALIDATE STAFF ID
        // ==========================================
        if (
            !staffId ||
            !mongoose.Types.ObjectId.isValid(staffId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid staffId is required",
                staff: {}
            });
        }

        const staffData = await staffModel.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(staffId)
                }
            },

            // ==========================================
            // LOOKUP ROLE
            // ==========================================
            {
                $lookup: {
                    from: "roles",
                    localField: "roleId",
                    foreignField: "_id",
                    as: "roleData"
                }
            },

            // ==========================================
            // LOOKUP DEPARTMENT
            // ==========================================
            {
                $lookup: {
                    from: "departments",
                    localField: "departmentId",
                    foreignField: "_id",
                    as: "departmentData"
                }
            },

            // ==========================================
            // UNWIND ROLE
            // ==========================================
            {
                $unwind: {
                    path: "$roleData",
                    preserveNullAndEmptyArrays: true
                }
            },

            {
                $unwind: {
                    path: "$departmentData",
                    preserveNullAndEmptyArrays: true
                }
            },

            // ==========================================
            // ADD DYNAMIC FIELDS
            // ==========================================
            {
                $addFields: {
                    roleName: "$roleData.roleName",
                    departmentName: "$departmentData.departmentName"
                }
            },

            // ==========================================
            // REMOVE LOOKUP DATA
            // ==========================================
            {
                $project: {
                    roleData: 0,
                    departmentData: 0
                }
            }
        ]);

        // ==========================================
        // STAFF NOT FOUND
        // ==========================================
        if (!staffData || staffData.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No staff found",
                staff: {}
            });
        }

        // ==========================================
        // RETURN STAFF
        // ==========================================
        return res.status(200).json({
            success: true,
            message: "Staff details retrieved successfully",
            staff: staffData[0]
        });

    } catch (err) {
        console.log(err);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            staff: {}
        });
    }
};



export const getAllActiveStaff = async function (req, res) {
    try {
        let matchCondition = {
            status: "active"
        };

        if (
            req.query.searchQuery &&
            req.query.searchQuery !== ""
        ) {
            const regex = new RegExp(req.query.searchQuery, "i");

            matchCondition = {
                $or: [
                    { name: regex },
                    { email: regex },
                    { phone: regex }
                ]
            };
        }

        const staff = await staffModel.aggregate([
            {
                $match: matchCondition
            },

            // ==========================================
            // LOOKUP ROLE
            // ==========================================
            {
                $lookup: {
                    from: "roles",
                    localField: "roleId",
                    foreignField: "_id",
                    as: "roleData"
                }
            },

            // ==========================================
            // UNWIND ROLE
            // ==========================================
            {
                $unwind: {
                    path: "$roleData",
                    preserveNullAndEmptyArrays: true
                }
            },

            // ==========================================
            // LOOKUP DEPARTMENT
            // ==========================================
            {
                $lookup: {
                    from: "departments",
                    localField: "departmentId",
                    foreignField: "_id",
                    as: "departmentData"
                }
            },

            {
                $unwind: {
                    path: "$departmentData",
                    preserveNullAndEmptyArrays: true
                }
            },

            // ==========================================
            // ADD DYNAMIC FIELDS
            // ==========================================
            {
                $addFields: {
                    roleName: "$roleData.roleName",
                    departmentName: "$departmentData.departmentName"
                }
            },

            // ==========================================
            // REMOVE LOOKUP DATA
            // ==========================================
            {
                $project: {
                    roleData: 0
                    // departmentData: 0
                }
            },

            {
                $sort: {
                    createdAt: -1
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            message: "Staff details has been retrieved",
            staff: staff
        });

    } catch (err) {
        console.log(err);

        return res.status(400).json({
            success: false,
            message: "Something went wrong"
        });
    }
};


// ============================================================
// CHANGE STAFF PASSWORD
// ============================================================
export const changeStaffPassword = async function (req, res) {
    try {
        const { id } = req.params;
        const { newPassword, confirmPassword } = req.body;

        // ============================================================
        // VALIDATE PASSWORD FIELDS
        // ============================================================
        if (!newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'New password and confirm password are required'
            });
        }

        // ============================================================
        // CHECK PASSWORD MATCH
        // ============================================================
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'New password and confirm password do not match'
            });
        }

        // ============================================================
        // FIND STAFF
        // ============================================================
        const staff = await staffModel.findById(id);

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff not found'
            });
        }

        // ============================================================
        // BCRYPT NEW PASSWORD
        // ============================================================
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // ============================================================
        // UPDATE PASSWORD
        // ============================================================
        staff.password = hashedPassword;

        await staff.save();

        return res.status(200).json({
            success: true,
            message: 'Staff password has been changed successfully'
        });

    } catch (err) {
        console.log(err);

        return res.status(500).json({
            success: false,
            message: 'Something went wrong'
        });
    }
};



// ============================================================
// STAFF LOGIN
// ============================================================
export const staffLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // ============================================================
        // VALIDATE REQUEST
        // ============================================================
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email/Phone and password are required"
            });
        }

        // ============================================================
        // FIND STAFF
        // ============================================================
        const staff = await staffModel.findOne({
            $or: [
                { email: email },
                { phone: email }
            ]
        });

        if (!staff) {
            return res.status(401).json({
                success: false,
                message: "Invalid email/phone or password"
            });
        }

        // ============================================================
        // CHECK STAFF STATUS
        // ============================================================
        if (staff.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Your staff account is inactive"
            });
        }

        // ============================================================
        // CHECK PASSWORD
        // ============================================================
        const isPasswordValid = await bcrypt.compare(
            password,
            staff.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email/phone or password"
            });
        }
          // Generate new session ID
                const sessionId = crypto.randomUUID();
        
                // Replace previous active session
                staff.activeSessionId = sessionId;
                await staff.save();
        // ============================================================
        // GET ROLE + DEPARTMENT DETAILS
        // ============================================================
        const staffData = await staffModel.aggregate([
            {
                $match: {
                    _id: staff._id
                }
            },

            // ========================================================
            // ROLE LOOKUP
            // ========================================================
            {
                $lookup: {
                    from: "roles",
                    localField: "roleId",
                    foreignField: "_id",
                    as: "roleData"
                }
            },

            // ========================================================
            // DEPARTMENT LOOKUP
            // ========================================================
            {
                $lookup: {
                    from: "departments",
                    localField: "departmentId",
                    foreignField: "_id",
                    as: "departmentData"
                }
            },

            // ========================================================
            // UNWIND ROLE
            // ========================================================
            {
                $unwind: {
                    path: "$roleData",
                    preserveNullAndEmptyArrays: true
                }
            },

            // ========================================================
            // UNWIND DEPARTMENT
            // ========================================================
            {
                $unwind: {
                    path: "$departmentData",
                    preserveNullAndEmptyArrays: true
                }
            },

            // ========================================================
            // ADD DYNAMIC NAMES
            // ========================================================
            {
                $addFields: {
                    roleName: "$roleData.roleName",
                    departmentName: "$departmentData.departmentName"
                }
            },

            // ========================================================
            // REMOVE LOOKUP DATA
            // ========================================================
            {
                $project: {
                    roleData: 0,
                    departmentData: 0
                }
            }
        ]);

        // ============================================================
        // GENERATE JWT TOKEN
        // ============================================================
        const token = jwt.sign(
            {
                staffId: staff._id,
                role: "staff"
            },
            process.env.JWT_SECRET
        );

        // ============================================================
        // FINAL STAFF DATA
        // ============================================================
        const loggedInStaff = staffData[0] || staff.toObject();

        // ============================================================
        // SUCCESS RESPONSE
        // ============================================================
        return res.status(200).json({
            success: true,
            message: "Staff login successful",
            token,
            staff: loggedInStaff
        });

    } catch (error) {
        console.log("❌ Staff Login Error:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
};


export const getStaffProfile = async (req, res) => {
    try {
        // ============================================================
        // GET STAFF ID FROM TOKEN
        // ============================================================
        const staffId = req.userId;

        if (!staffId) {
            return res.status(401).json({
                success: false,
                message: "Staff authentication required"
            });
        }

        // ============================================================
        // GET STAFF + ROLE + DEPARTMENT
        // ============================================================
        const staffData = await staffModel.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(staffId)
                }
            },

            // ========================================================
            // ROLE LOOKUP
            // ========================================================
            {
                $lookup: {
                    from: "roles",
                    localField: "roleId",
                    foreignField: "_id",
                    as: "roleData"
                }
            },

            // ========================================================
            // DEPARTMENT LOOKUP
            // ========================================================
            {
                $lookup: {
                    from: "departments",
                    localField: "departmentId",
                    foreignField: "_id",
                    as: "departmentData"
                }
            },

            // ========================================================
            // UNWIND ROLE
            // ========================================================
            {
                $unwind: {
                    path: "$roleData",
                    preserveNullAndEmptyArrays: true
                }
            },

            // ========================================================
            // UNWIND DEPARTMENT
            // ========================================================
            {
                $unwind: {
                    path: "$departmentData",
                    preserveNullAndEmptyArrays: true
                }
            },

            // ========================================================
            // DYNAMIC ROLE + DEPARTMENT NAME
            // ========================================================
            {
                $addFields: {
                    roleName: "$roleData.roleName",
                    departmentName: "$departmentData.departmentName"
                }
            },

            // ========================================================
            // REMOVE LOOKUP DATA
            // ========================================================
            {
                $project: {
                    roleData: 0,
                    departmentData: 0
                }
            }
        ]);

        // ============================================================
        // STAFF NOT FOUND
        // ============================================================
        if (!staffData || staffData.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Staff not found",
                staff: {}
            });
        }

        // ============================================================
        // SUCCESS RESPONSE
        // ============================================================
        return res.status(200).json({
            success: true,
            message: "Staff details retrieved successfully",
            staff: staffData[0]
        });

    } catch (error) {
        console.log("❌ Get Staff Profile Error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            staff: {}
        });
    }
};


// Get roles and permissions
export const getrolesandpermissions = async (req, res) => {
    try {
        // ============================================================
        // GET STAFF ID FROM TOKEN
        // ============================================================
        const staffId = new mongoose.Types.ObjectId(req.userId);

        if (!staffId) {
            return res.status(401).json({
                success: false,
                message: "Staff authentication required"
            });
        }

        // ============================================================
        // GET STAFF
        // ============================================================
        const staff = await staffModel.findById(staffId);

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: "Staff not found",
                roleName: null,
                rolesAndPermission: []
            });
        }

        // ============================================================
        // CHECK ROLE ID
        // ============================================================
        if (!staff.roleId) {
            return res.status(404).json({
                success: false,
                message: "Role not assigned to this staff",
                roleName: null,
                rolesAndPermission: []
            });
        }

        // ============================================================
        // GET ROLE USING STAFF roleId
        // ============================================================
        const role = await roleModel.findById(staff.roleId);

        if (!role) {
            return res.status(404).json({
                success: false,
                message: "Role not found",
                roleName: null,
                rolesAndPermission: []
            });
        }

        // ============================================================
        // RESPONSE
        // ============================================================
        return res.status(200).json({
            success: true,
            message: "Roles and permissions retrieved successfully",
            roleName: role.roleName,
            rolesAndPermission: role.rolesAndPermission
        });

    } catch (error) {
        console.log("❌ Get Roles and Permissions Error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            roleName: null,
            rolesAndPermission: []
        });
    }
};
