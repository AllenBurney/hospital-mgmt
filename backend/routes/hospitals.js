const express = require('express');
const router = express.Router();
const {
  getHospitals, getHospital, createHospital, updateHospital,
  updateBedAvailability, getNearbyHospitalsGraph, getNearbyHospitalsGeo,
  getGraphEdges, addGraphEdge,
} = require('../controllers/hospitalController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getHospitals);
router.get('/nearby/graph', getNearbyHospitalsGraph);   // graph-based search
router.get('/nearby/geo', getNearbyHospitalsGeo);       // simple geo search
router.get('/graph/edges', getGraphEdges);              // graph visualization

router.post('/', protect, authorize('hospital_admin', 'super_admin'), createHospital);
router.post('/graph/edge', protect, authorize('super_admin'), addGraphEdge);

router.get('/:id', getHospital);
router.put('/:id', protect, authorize('hospital_admin', 'super_admin'), updateHospital);
router.put('/:id/beds', protect, authorize('hospital_admin', 'super_admin'), updateBedAvailability);

module.exports = router;
