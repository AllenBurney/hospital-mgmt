const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');

// @POST /api/appointments - book appointment
exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, hospitalId, appointmentDate, slotTime, type, symptoms } = req.body;

    const [doctor, hospital] = await Promise.all([
      Doctor.findById(doctorId),
      Hospital.findById(hospitalId),
    ]);

    if (!doctor || !hospital) {
      return res.status(404).json({ success: false, message: 'Doctor or hospital not found' });
    }

    // Check slot not already taken
    const conflict = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: new Date(appointmentDate),
      slotTime,
      status: { $in: ['pending', 'confirmed'] },
    });
    if (conflict) {
      return res.status(400).json({ success: false, message: 'Slot already booked' });
    }

    const appointment = await Appointment.create({
      patient: req.user.id,
      doctor: doctorId,
      hospital: hospitalId,
      appointmentDate: new Date(appointmentDate),
      slotTime,
      type: type || 'opd',
      symptoms,
      fee: doctor.fees.consultation,
    });

    await appointment.populate([
      { path: 'doctor', select: 'name specialization' },
      { path: 'hospital', select: 'name location.city location.address' },
    ]);

    res.status(201).json({ success: true, data: appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/appointments/my - patient's appointments
exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user.id })
      .populate('doctor', 'name specialization photo')
      .populate('hospital', 'name location.city location.address contact.phone')
      .sort({ appointmentDate: -1 });
    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/appointments/hospital/:hospitalId - hospital admin view
exports.getHospitalAppointments = async (req, res) => {
  try {
    const { date, status } = req.query;
    const query = { hospital: req.params.hospitalId };
    if (status) query.status = status;
    if (date) {
      const d = new Date(date);
      query.appointmentDate = {
        $gte: new Date(d.setHours(0, 0, 0, 0)),
        $lt: new Date(d.setHours(23, 59, 59, 999)),
      };
    }
    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .sort({ appointmentDate: 1, slotTime: 1 });
    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/appointments/:id/status - update appointment status
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status, notes, diagnosis, prescription } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status, notes, diagnosis, prescription },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @DELETE /api/appointments/:id - cancel appointment
exports.cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, patient: req.user.id },
      { status: 'cancelled', cancellationReason: req.body.reason },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
