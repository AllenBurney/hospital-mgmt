const mongoose = require('mongoose');

/**
 * HOSPITAL GRAPH MODEL
 * Stores the adjacency list for the hospital network graph.
 * Each document represents a directed edge:
 *   from hospital A → to hospital B
 * with weight = road distance in km (not straight-line).
 *
 * Dijkstra's / BFS is run on the backend using these edges
 * to find the nearest hospital with available beds/doctors.
 *
 * This is the "graph" collection.
 */
const hospitalGraphSchema = new mongoose.Schema(
  {
    // Source hospital node
    fromHospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
    },
    fromNodeId: { type: String, required: true },

    // Destination hospital node
    toHospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
    },
    toNodeId: { type: String, required: true },

    // Edge weight = road distance in km
    distanceKm: { type: Number, required: true },

    // Estimated travel time in minutes (by road)
    travelTimeMinutes: { type: Number, required: true },

    // Road quality / type (affects routing priority)
    roadType: {
      type: String,
      enum: ['highway', 'arterial', 'local', 'express'],
      default: 'arterial',
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

hospitalGraphSchema.index({ fromHospital: 1 });
hospitalGraphSchema.index({ toHospital: 1 });
hospitalGraphSchema.index({ fromNodeId: 1, toNodeId: 1 }, { unique: true });

module.exports = mongoose.model('HospitalGraph', hospitalGraphSchema);
