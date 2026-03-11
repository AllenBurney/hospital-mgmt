const mongoose = require('mongoose');

/**
 * HOSPITAL MODEL
 * Core entity. Stores hospital details, bed stats, fees, geolocation.
 * Graph edges are stored in HospitalGraph model.
 */
const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Hospital name is required'],
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['government', 'private', 'trust', 'clinic'],
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String },
    },
    contact: {
      phone: { type: String },
      email: { type: String },
      website: { type: String },
      emergencyPhone: { type: String },
    },
    // Bed availability stats
    beds: {
      total: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
      icu: {
        total: { type: Number, default: 0 },
        available: { type: Number, default: 0 },
      },
      emergency: {
        total: { type: Number, default: 0 },
        available: { type: Number, default: 0 },
      },
      general: {
        total: { type: Number, default: 0 },
        available: { type: Number, default: 0 },
      },
      private: {
        total: { type: Number, default: 0 },
        available: { type: Number, default: 0 },
      },
    },
    // Fee structure
    fees: {
      opd: { type: Number, default: 0 },            // outpatient consultation
      ipd: { type: Number, default: 0 },            // inpatient per day (general)
      ipdPrivate: { type: Number, default: 0 },     // inpatient per day (private)
      icu: { type: Number, default: 0 },            // ICU per day
      emergency: { type: Number, default: 0 },      // emergency admission
      surgery: {
        minor: { type: Number, default: 0 },
        major: { type: Number, default: 0 },
      },
    },
    specialties: [{ type: String }],  // e.g. ['Cardiology', 'Neurology']
    facilities: [{ type: String }],   // e.g. ['MRI', 'ICU', 'Blood Bank']
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Graph node ID (used in HospitalGraph)
    nodeId: {
      type: String,
      unique: true,
    },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Geospatial index for "hospitals near me" queries
hospitalSchema.index({ location: '2dsphere' });
hospitalSchema.index({ 'beds.available': 1 });
hospitalSchema.index({ isActive: 1, isVerified: 1 });

// Virtual: bed occupancy %
hospitalSchema.virtual('occupancyRate').get(function () {
  if (this.beds.total === 0) return 0;
  return (((this.beds.total - this.beds.available) / this.beds.total) * 100).toFixed(1);
});

hospitalSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Hospital', hospitalSchema);
