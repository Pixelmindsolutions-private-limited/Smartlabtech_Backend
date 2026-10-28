import mongoose from 'mongoose';

const openRoleSchema = new mongoose.Schema({
  roleName: { type: String, required: true },          // e.g., "SERVICE EXECUTIVE"
  category: { type: String, required: true },          // e.g., "SERVICE", "SALES EXECUTIVE"
  locations: [{ type: String, required: true }],       // e.g., ["Hyderabad", "Bangalore"]
  postedOn: { type: Date, default: Date.now },         // e.g., "Posted 4 years ago" (calculated on frontend)
  tags: [{ type: String }],                            // e.g., ["Instrument Servicing", "Field Support"]
  noOfPositions: { type: Number, required: true },     // e.g., 2
  roleDescription: { type: String, required: true },   // The paragraph text
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const OpenRole = mongoose.model('OpenRole', openRoleSchema);
export default OpenRole;