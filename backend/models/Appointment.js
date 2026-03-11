const mongoose = require('mongoose');

/**
 * APPOINTMENT MODEL
 * Tracks all patient–doctor appointments.
 * status flow: pending → confirmed → completed | cancelled
 */
const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
    },
    appointmentDate: { type: Date, required: true },
    slotTime: { type: String, required: true },   // "10:30"
    type: {
      type: String,
      enum: ['opd', 'emergency', 'followup', 'teleconsult'],
      default: 'opd',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
      default: 'pending',
    },
    symptoms: { type: String },
    notes: { type: String },           // doctor's notes post-appointment
    diagnosis: { type: String },
    prescription: [
      {
        medicine: String,
        dosage: String,
        duration: String,
        notes: String,
      },
    ],
    fee: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
    },
    referredFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      default: null,
    },
    cancellationReason: { type: String },
  },
  { timestamps: true }
);

appointmentSchema.index({ patient: 1, appointmentDate: -1 });
appointmentSchema.index({ doctor: 1, appointmentDate: 1 });
appointmentSchema.index({ hospital: 1, status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
