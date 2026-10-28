import mongoose from 'mongoose';

const jobApplicationSchema = new mongoose.Schema({
  roleId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'OpenRole', 
    required: true 
  },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  currentCity: { type: String, required: true },
  coverNote: { type: String, required: true },
  resumeUrl: { 
    type: String, 
  }, 
  status: { 
    type: String, 
    enum: ['Pending', 'Reviewed', 'Shortlisted', 'Rejected'], 
    default: 'Pending' 
  }
}, { timestamps: true });

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);
export default JobApplication;