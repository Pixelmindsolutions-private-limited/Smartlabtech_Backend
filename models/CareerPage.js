import mongoose from 'mongoose';

const careerPageSchema = new mongoose.Schema({
  hero: {
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    tag: { type: String, default: 'JOB ARCHIVES' }
  },
  cta: {
    title: { type: String, required: true },
    tag: { type: String, required: true },
    description: { type: String, required: true }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const CareerPage = mongoose.model('CareerPage', careerPageSchema);
export default CareerPage;