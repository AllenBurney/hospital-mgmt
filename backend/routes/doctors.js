const express = require('express');
const router = express.Router();
const {
  getDoctors, getDoctor, createDoctor, updateDoctor, getAvailableSlots
} = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getDoctors);
router.get('/:id', getDoctor);
router.get('/:id/slots', getAvailableSlots);
router.post('/', protect, authorize('hospital_admin', 'super_admin'), createDoctor);
router.put('/:id', protect, authorize('hospital_admin', 'super_admin'), updateDoctor);

module.exports = router;
