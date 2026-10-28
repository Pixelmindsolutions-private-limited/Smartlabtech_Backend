
import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
    roleName: {
        type: String,
        trim: true,
        index: true,
        unique: true,
        required: true,
    },
    rolesAndPermission: {
        type: Array,
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

const role = mongoose.model('roles', roleSchema);
export default role;