import mongoose from 'mongoose';

const calculationToolSchema = new mongoose.Schema({
  toolId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  title: {
    tr: { type: String, required: true },
    en: { type: String, required: true },
  },
  category: {
    type: String,
    default: 'SIMULATOR',
  },
  type: {
    type: String,
    default: 'INTERACTIVE SIMULATOR',
  },
  image: {
    type: String,
    required: true,
  },
  excerpt: {
    tr: { type: String },
    en: { type: String },
  },
  slug: {
    type: String,
    required: true,
  },
  accentColor: {
    type: String,
    default: '#6366f1',
  },
}, { timestamps: true });

const CalculationTool = mongoose.models.CalculationTool || mongoose.model('CalculationTool', calculationToolSchema);

export default CalculationTool;
