const mongoose = require('mongoose');

/**
 * BED MODEL
 * Individual bed tracking within a hospital ward.
 * status: 'available' | 'occupied' | 'maintenance' | 'reserved'
 */
const bedSchema = new mongoose.Schema(
  {
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
    },
    bedNumber: { type: String, required: true },
    ward: { type: String, required: true },   // e.g. 'Ward-A', 'ICU-1'
    type: {
      type: String,
      enum: ['general', 'private', 'icu', 'emergency', 'pediatric', 'maternity'],
      required: true,
    },
    floor: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['available', 'occupied', 'maintenance', 'reserved'],
      default: 'available',
    },
    currentPatient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    admissionDate: { type: Date, default: null },
    expectedDischarge: { type: Date, default: null },
    features: [{ type: String }],   // e.g. ['oxygen', 'ventilator', 'monitor']
    pricePerDay: { type: Number, default: 0 },
    notes: { type: String },
  },
  { timestamps: true }
);

bedSchema.index({ hospital: 1, status: 1, type: 1 });
bedSchema.index({ hospital: 1, bedNumber: 1 }, { unique: true });

module.exports = mongoose.model('Bed', bedSchema);
