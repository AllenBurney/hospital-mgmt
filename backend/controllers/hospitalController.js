const Hospital = require('../models/Hospital');
const HospitalGraph = require('../models/HospitalGraph');
const Doctor = require('../models/Doctor');
const Bed = require('../models/Bed');
const { findNearestHospitals } = require('../utils/graphAlgorithm');

// @GET /api/hospitals - list all hospitals (with optional filters)
exports.getHospitals = async (req, res) => {
  try {
    const { city, type, specialty, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };
    if (city) query['location.city'] = { $regex: city, $options: 'i' };
    if (type) query.type = type;
    if (specialty) query.specialties = { $regex: specialty, $options: 'i' };

    const hospitals = await Hospital.find(query)
      .select('-__v')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ 'rating.average': -1 });

    const total = await Hospital.countDocuments(query);
    res.json({ success: true, count: hospitals.length, total, data: hospitals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/hospitals/:id - single hospital with doctors & bed stats
exports.getHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id).populate('admin', 'name email');
    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found' });

    const doctors = await Doctor.find({ hospital: req.params.id, isActive: true })
      .select('name specialization fees.consultation availableSlotsToday rating isAvailable photo');

    const bedStats = await Bed.aggregate([
      { $match: { hospital: hospital._id } },
      { $group: { _id: { type: '$type', status: '$status' }, count: { $sum: 1 } } },
    ]);

    res.json({ success: true, data: { hospital, doctors, bedStats } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/hospitals - create hospital (hospital_admin, super_admin)
exports.createHospital = async (req, res) => {
  try {
    const nodeId = `H-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const hospital = await Hospital.create({ ...req.body, nodeId, admin: req.user.id });

    // Link admin user to hospital
    await require('../models/User').findByIdAndUpdate(req.user.id, {
      hospital: hospital._id,
      role: 'hospital_admin',
    });

    res.status(201).json({ success: true, data: hospital });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/hospitals/:id - update hospital
exports.updateHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found' });

    // Only admin of the hospital or super_admin can update
    if (
      req.user.role !== 'super_admin' &&
      hospital.admin.toString() !== req.user.id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updated = await Hospital.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdated: Date.now() },
      { new: true, runValidators: true }
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/hospitals/:id/beds - update bed availability
exports.updateBedAvailability = async (req, res) => {
  try {
    const { beds } = req.body;
    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { beds, lastUpdated: Date.now() },
      { new: true }
    );
    res.json({ success: true, data: hospital.beds });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/hospitals/nearby/graph - GRAPH-BASED nearest hospital search
// Query params: lng, lat, bedType, specialty, maxOpdFee, maxIpdFee, requireICU, topN, weightKey
exports.getNearbyHospitalsGraph = async (req, res) => {
  try {
    const {
      lng, lat,
      bedType,
      specialty,
      maxOpdFee,
      maxIpdFee,
      requireICU,
      topN = 10,
      weightKey = 'distanceKm',
    } = req.query;

    if (!lng || !lat) {
      return res.status(400).json({ success: false, message: 'lng and lat are required' });
    }

    // Step 1: Find patient's nearest hospital node using MongoDB geo query
    const patientNearestHospital = await Hospital.findOne({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: 50000, // 50 km radius
        },
      },
      isActive: true,
    });

    if (!patientNearestHospital) {
      return res.status(404).json({ success: false, message: 'No hospitals found within 50km' });
    }

    // Step 2: Load all graph edges + all hospitals
    const [edges, allHospitals] = await Promise.all([
      HospitalGraph.find({ isActive: true }),
      Hospital.find({ isActive: true, isVerified: true }),
    ]);

    // Step 3: Run Dijkstra from patient's nearest hospital
    const results = findNearestHospitals({
      sourceNodeId: patientNearestHospital.nodeId,
      allHospitals,
      edges,
      filters: {
        bedType: bedType || null,
        specialty: specialty || null,
        maxOpdFee: maxOpdFee ? parseFloat(maxOpdFee) : null,
        maxIpdFee: maxIpdFee ? parseFloat(maxIpdFee) : null,
        requireICU: requireICU === 'true',
      },
      topN: parseInt(topN),
      weightKey,
    });

    // Step 4: Attach doctors for each result hospital
    const enriched = await Promise.all(
      results.map(async (r) => {
        const doctors = await Doctor.find({
          hospital: r.hospital._id,
          isActive: true,
          isAvailable: true,
        }).select('name specialization fees.consultation availableSlotsToday rating');
        return { ...r, hospital: r.hospital.toJSON(), doctors };
      })
    );

    res.json({
      success: true,
      patientNearestNode: patientNearestHospital.nodeId,
      count: enriched.length,
      data: enriched,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/hospitals/nearby/geo - simple MongoDB geo search (no graph)
exports.getNearbyHospitalsGeo = async (req, res) => {
  try {
    const { lng, lat, maxDistance = 20000 } = req.query;
    const hospitals = await Hospital.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(maxDistance),
        },
      },
      isActive: true,
    }).limit(20);
    res.json({ success: true, count: hospitals.length, data: hospitals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/hospitals/graph/edges - get graph edges for visualization
exports.getGraphEdges = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 1000;
    const [edges, total] = await Promise.all([
      HospitalGraph.find({ isActive: true })
        .populate('fromHospital', 'name location.city nodeId')
        .populate('toHospital',   'name location.city nodeId')
        .limit(limit),
      HospitalGraph.countDocuments({ isActive: true }),
    ]);
    res.json({ success: true, count: total, data: edges });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/hospitals/graph/edge - add an edge between two hospitals
exports.addGraphEdge = async (req, res) => {
  try {
    const { fromHospital, toHospital, distanceKm, travelTimeMinutes, roadType } = req.body;

    const [from, to] = await Promise.all([
      Hospital.findById(fromHospital),
      Hospital.findById(toHospital),
    ]);
    if (!from || !to) return res.status(404).json({ success: false, message: 'Hospital not found' });

    // Create bidirectional edges
    const edges = await HospitalGraph.create([
      {
        fromHospital: from._id, fromNodeId: from.nodeId,
        toHospital: to._id, toNodeId: to.nodeId,
        distanceKm, travelTimeMinutes, roadType,
      },
      {
        fromHospital: to._id, fromNodeId: to.nodeId,
        toHospital: from._id, toNodeId: from.nodeId,
        distanceKm, travelTimeMinutes, roadType,
      },
    ]);

    res.status(201).json({ success: true, data: edges });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};