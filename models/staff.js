import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },

    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    roleId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    phone: {
        type: String,
        trim: true
    },
    image: {
        type: String,
        trim: true
    },
    password: {
        type: String,
        trim: true
    },

    email: {
        type: String,
        trim: true
    },

    address: {
        type: String,
        trim: true
    },

    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
     activeSessionId: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

const Staff = mongoose.model('Staff', staffSchema);

export default Staff;