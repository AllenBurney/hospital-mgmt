const mongoose = require('mongoose');

/**
 * REVIEW MODEL
 * Patient reviews for hospitals and doctors.
 */
const reviewSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetType: {
      type: String,
      enum: ['hospital', 'doctor'],
      required: true,
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      default: null,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      default: null,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: { type: String, maxlength: 1000 },
    isVerified: { type: Boolean, default: false }, // verified = patient actually visited
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ hospital: 1 });
reviewSchema.index({ doctor: 1 });
reviewSchema.index({ patient: 1 });

module.exports = mongoose.model('Review', reviewSchema);
