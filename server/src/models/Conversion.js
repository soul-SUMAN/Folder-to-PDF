import mongoose from 'mongoose';

const conversionSchema = new mongoose.Schema(
  {
    fileCount: { type: Number, required: true },
    totalBytes: { type: Number, required: true },
    skippedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Conversion', conversionSchema);