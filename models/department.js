
import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
    departmentName: {
        type: String,
        trim: true,
        index: true,
        unique: true,
        required: true,
    },
   
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        trim: true,
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const department = mongoose.model('departments', departmentSchema);
export default department;