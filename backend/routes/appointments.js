const express = require('express');
const router = express.Router();
const {
  bookAppointment, getMyAppointments, getHospitalAppointments,
  updateAppointmentStatus, cancelAppointment,
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, bookAppointment);
router.get('/my', protect, getMyAppointments);
router.get('/hospital/:hospitalId', protect, authorize('hospital_admin', 'super_admin'), getHospitalAppointments);
router.put('/:id/status', protect, authorize('hospital_admin', 'super_admin'), updateAppointmentStatus);
router.delete('/:id', protect, cancelAppointment);

module.exports = router;
