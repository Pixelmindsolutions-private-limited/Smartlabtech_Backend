import mongoose from 'mongoose';

const careerPageSchema = new mongoose.Schema({
  hero: {
    title: { type: String, required: true },
    description: { type: String, required: true },
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const CareerPage = mongoose.model('CareerPage', careerPageSchema);
export default CareerPage;