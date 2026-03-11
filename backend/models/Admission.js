const mongoose = require('mongoose');

/**
 * ADMISSION MODEL
 * Tracks inpatient stays, bed assignments, and billing.
 */
const admissionSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
    },
    bed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bed',
      required: true,
    },
    admittingDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
    },
    admissionDate: { type: Date, required: true, default: Date.now },
    dischargeDate: { type: Date, default: null },
    admissionType: {
      type: String,
      enum: ['emergency', 'planned', 'transfer'],
      default: 'planned',
    },
    status: {
      type: String,
      enum: ['admitted', 'discharged', 'transferred', 'deceased'],
      default: 'admitted',
    },
    diagnosis: { type: String },
    // Billing breakdown
    billing: {
      bedCharges: { type: Number, default: 0 },
      doctorCharges: { type: Number, default: 0 },
      medicineCharges: { type: Number, default: 0 },
      testCharges: { type: Number, default: 0 },
      otherCharges: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      paid: { type: Number, default: 0 },
      due: { type: Number, default: 0 },
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid'],
      default: 'pending',
    },
    transferredTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      default: null,
    },
    notes: [
      {
        note: String,
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

admissionSchema.index({ patient: 1, status: 1 });
admissionSchema.index({ hospital: 1, status: 1 });
admissionSchema.index({ admissionDate: -1 });

module.exports = mongoose.model('Admission', admissionSchema);
