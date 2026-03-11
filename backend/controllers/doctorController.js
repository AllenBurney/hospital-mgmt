const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');

// @GET /api/doctors - list doctors with filters
exports.getDoctors = async (req, res) => {
  try {
    const { hospital, specialization, available, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };
    if (hospital) query.hospital = hospital;
    if (specialization) query.specialization = { $regex: specialization, $options: 'i' };
    if (available === 'true') query.isAvailable = true;

    const doctors = await Doctor.find(query)
      .populate('hospital', 'name location.city location.address')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ 'rating.average': -1 });

    const total = await Doctor.countDocuments(query);
    res.json({ success: true, count: doctors.length, total, data: doctors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/doctors/:id
exports.getDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('hospital', 'name location contact');
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, data: doctor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/doctors - add doctor to hospital
exports.createDoctor = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.body.hospital);
    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found' });

    // Only the hospital admin or super_admin
    if (req.user.role !== 'super_admin' && hospital.admin.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const doctor = await Doctor.create(req.body);
    res.status(201).json({ success: true, data: doctor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/doctors/:id
exports.updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, data: doctor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/doctors/:id/slots - available appointment slots for a date
exports.getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query;
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    const Appointment = require('../models/Appointment');
    const targetDate = new Date(date);
    const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][targetDate.getDay()];

    const daySchedule = doctor.schedule.find((s) => s.day === dayName && s.isWorking);
    if (!daySchedule) {
      return res.json({ success: true, data: [], message: 'Doctor not available on this day' });
    }

    // Build all time slots
    const slots = [];
    const [startH, startM] = daySchedule.startTime.split(':').map(Number);
    const [endH, endM] = daySchedule.endTime.split(':').map(Number);
    let current = startH * 60 + startM;
    const end = endH * 60 + endM;

    while (current + daySchedule.slotDuration <= end) {
      const h = Math.floor(current / 60).toString().padStart(2, '0');
      const m = (current % 60).toString().padStart(2, '0');
      slots.push(`${h}:${m}`);
      current += daySchedule.slotDuration;
    }

    // Remove already-booked slots
    const booked = await Appointment.find({
      doctor: req.params.id,
      appointmentDate: {
        $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        $lt: new Date(targetDate.setHours(23, 59, 59, 999)),
      },
      status: { $in: ['pending', 'confirmed', 'in-progress'] },
    }).select('slotTime');

    const bookedTimes = new Set(booked.map((a) => a.slotTime));
    const available = slots.filter((s) => !bookedTimes.has(s));

    res.json({ success: true, data: available, total: slots.length, available: available.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
