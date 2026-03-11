const mongoose = require('mongoose');

/**
 * DOCTOR MODEL
 * Each doctor belongs to one hospital (or multiple via scheduling).
 * Availability slots are tracked for appointment booking.
 */
const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
    },
    specialization: {
      type: String,
      required: true,
    },
    subSpecialization: String,
    qualifications: [{ type: String }],   // e.g. ['MBBS', 'MD', 'DM']
    experience: {
      type: Number,   // years
      default: 0,
    },
    contact: {
      phone: String,
      email: String,
    },
    // Consultation fee
    fees: {
      consultation: { type: Number, default: 0 },
      followUp: { type: Number, default: 0 },
    },
    // Weekly schedule: each day has slots
    schedule: [
      {
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        },
        startTime: String,   // "09:00"
        endTime: String,     // "17:00"
        slotDuration: { type: Number, default: 30 }, // minutes
        isWorking: { type: Boolean, default: true },
        maxPatients: { type: Number, default: 20 },
      },
    ],
    // Today's available slot count (updated dynamically)
    availableSlotsToday: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    photo: { type: String },
  },
  { timestamps: true }
);

doctorSchema.index({ hospital: 1, specialization: 1 });
doctorSchema.index({ isAvailable: 1, isActive: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
