import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../utils/api';
import { format } from 'date-fns';

const statusColors = { pending: '#f59e0b', confirmed: '#10b981', completed: '#6366f1', cancelled: '#ef4444' };

// ── Section header helper ─────────────────────────────────────────
const Section = ({ title }) => (
  <div style={{
    fontSize: 12, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase',
    letterSpacing: 1, margin: '20px 0 12px', borderBottom: '1px solid var(--border)',
    paddingBottom: 6, gridColumn: 'span 2',
  }}>{title}</div>
);

// ── Create Hospital Form ──────────────────────────────────────────
const CreateHospitalForm = ({ onCreated }) => {
  const [form, setForm] = useState({
    name: '', registrationNumber: '', type: 'private',
    address: '', city: '', state: '', pincode: '',
    lng: '', lat: '',
    phone: '', email: '', emergencyPhone: '',
    totalBeds: '', availableBeds: '',
    icuTotal: '', icuAvailable: '',
    emergencyTotal: '', emergencyAvailable: '',
    generalTotal: '', generalAvailable: '',
    privateTotal: '', privateAvailable: '',
    opdFee: '', ipdFee: '', ipdPrivateFee: '', icuFee: '', emergencyFee: '',
    minorSurgery: '', majorSurgery: '',
    specialties: '', facilities: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const set = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    setLoading(true); setError(null);
    try {
      const payload = {
        name: form.name,
        registrationNumber: form.registrationNumber,
        type: form.type,
        location: {
          type: 'Point',
          coordinates: [parseFloat(form.lng), parseFloat(form.lat)],
          address: form.address, city: form.city, state: form.state, pincode: form.pincode,
        },
        contact: { phone: form.phone, email: form.email, emergencyPhone: form.emergencyPhone },
        beds: {
          total: +form.totalBeds, available: +form.availableBeds,
          icu:       { total: +form.icuTotal,       available: +form.icuAvailable },
          emergency: { total: +form.emergencyTotal, available: +form.emergencyAvailable },
          general:   { total: +form.generalTotal,   available: +form.generalAvailable },
          private:   { total: +form.privateTotal,   available: +form.privateAvailable },
        },
        fees: {
          opd: +form.opdFee, ipd: +form.ipdFee, ipdPrivate: +form.ipdPrivateFee,
          icu: +form.icuFee, emergency: +form.emergencyFee,
          surgery: { minor: +form.minorSurgery, major: +form.majorSurgery },
        },
        specialties: form.specialties.split(',').map(s => s.trim()).filter(Boolean),
        facilities:  form.facilities.split(',').map(s => s.trim()).filter(Boolean),
      };
      const res = await api.createHospital(payload);
      onCreated(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create hospital');
    }
    setLoading(false);
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: 4, fontSize: 22 }}>🏥 Register Your Hospital</h3>
      <p style={{ color: 'var(--slate)', fontSize: 13, marginBottom: 20 }}>Fill in the details to add your hospital to the MediGraph network.</p>
      {error && <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', borderRadius: 8, color: 'var(--red)', marginBottom: 16, fontSize: 14 }}>⚠ {error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <Section title="Basic Info" />
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label className="label">Hospital Name *</label>
          <input className="input" name="name" value={form.name} onChange={set} placeholder="e.g. City Care Hospital" />
        </div>
        <div className="form-group">
          <label className="label">Registration Number *</label>
          <input className="input" name="registrationNumber" value={form.registrationNumber} onChange={set} placeholder="e.g. REG-DL-099" />
        </div>
        <div className="form-group">
          <label className="label">Hospital Type *</label>
          <select className="input" name="type" value={form.type} onChange={set}>
            <option value="government">Government</option>
            <option value="private">Private</option>
            <option value="trust">Trust</option>
            <option value="clinic">Clinic</option>
          </select>
        </div>

        <Section title="Location" />
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label className="label">Street Address *</label>
          <input className="input" name="address" value={form.address} onChange={set} placeholder="e.g. 123 MG Road, Sector 5" />
        </div>
        <div className="form-group">
          <label className="label">City *</label>
          <input className="input" name="city" value={form.city} onChange={set} placeholder="e.g. Delhi" />
        </div>
        <div className="form-group">
          <label className="label">State *</label>
          <input className="input" name="state" value={form.state} onChange={set} placeholder="e.g. Delhi" />
        </div>
        <div className="form-group">
          <label className="label">Pincode</label>
          <input className="input" name="pincode" value={form.pincode} onChange={set} placeholder="110001" />
        </div>
        <div style={{ gridColumn: 'span 2', padding: '12px 14px', background: 'rgba(0,196,180,0.05)', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--slate)', marginBottom: 10 }}>
            📍 GPS Coordinates — find yours at <a href="https://www.latlong.net" target="_blank" rel="noreferrer" style={{ color: 'var(--teal)' }}>latlong.net</a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">Latitude *</label>
              <input className="input" name="lat" value={form.lat} onChange={set} placeholder="e.g. 28.6139" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">Longitude *</label>
              <input className="input" name="lng" value={form.lng} onChange={set} placeholder="e.g. 77.2090" />
            </div>
          </div>
        </div>

        <Section title="Contact" />
        <div className="form-group">
          <label className="label">Phone</label>
          <input className="input" name="phone" value={form.phone} onChange={set} placeholder="011-12345678" />
        </div>
        <div className="form-group">
          <label className="label">Emergency Phone</label>
          <input className="input" name="emergencyPhone" value={form.emergencyPhone} onChange={set} placeholder="011-12345999" />
        </div>
        <div className="form-group">
          <label className="label">Email</label>
          <input className="input" name="email" value={form.email} onChange={set} placeholder="info@hospital.com" />
        </div>

        <Section title="Bed Availability" />
        <div className="form-group">
          <label className="label">Total Beds</label>
          <input className="input" name="totalBeds" type="number" value={form.totalBeds} onChange={set} placeholder="200" />
        </div>
        <div className="form-group">
          <label className="label">Available Beds (overall)</label>
          <input className="input" name="availableBeds" type="number" value={form.availableBeds} onChange={set} placeholder="80" />
        </div>
        {[
          { label: 'General Ward', tKey: 'generalTotal', aKey: 'generalAvailable' },
          { label: 'Private Room',  tKey: 'privateTotal', aKey: 'privateAvailable' },
          { label: 'ICU',           tKey: 'icuTotal',     aKey: 'icuAvailable' },
          { label: 'Emergency',     tKey: 'emergencyTotal', aKey: 'emergencyAvailable' },
        ].map(({ label, tKey, aKey }) => (
          <React.Fragment key={label}>
            <div className="form-group">
              <label className="label">{label} — Total</label>
              <input className="input" name={tKey} type="number" value={form[tKey]} onChange={set} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="label">{label} — Available</label>
              <input className="input" name={aKey} type="number" value={form[aKey]} onChange={set} placeholder="0" />
            </div>
          </React.Fragment>
        ))}

        <Section title="Fee Structure (₹)" />
        {[
          { label: 'OPD Consultation',   key: 'opdFee',       placeholder: '500' },
          { label: 'IPD General / day',  key: 'ipdFee',       placeholder: '3000' },
          { label: 'IPD Private / day',  key: 'ipdPrivateFee',placeholder: '8000' },
          { label: 'ICU / day',          key: 'icuFee',       placeholder: '15000' },
          { label: 'Emergency Admission',key: 'emergencyFee', placeholder: '2000' },
          { label: 'Minor Surgery',      key: 'minorSurgery', placeholder: '20000' },
          { label: 'Major Surgery',      key: 'majorSurgery', placeholder: '150000' },
        ].map(({ label, key, placeholder }) => (
          <div key={key} className="form-group">
            <label className="label">{label}</label>
            <input className="input" name={key} type="number" value={form[key]} onChange={set} placeholder={placeholder} />
          </div>
        ))}

        <Section title="Specialties & Facilities" />
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label className="label">Specialties (comma separated)</label>
          <input className="input" name="specialties" value={form.specialties} onChange={set} placeholder="Cardiology, Neurology, Orthopedics" />
        </div>
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label className="label">Facilities (comma separated)</label>
          <input className="input" name="facilities" value={form.facilities} onChange={set} placeholder="ICU, MRI, CT Scan, Blood Bank" />
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}
        style={{ marginTop: 12, fontSize: 15, padding: '13px 32px' }}>
        {loading ? '⏳ Creating...' : '🏥 Register Hospital'}
      </button>
    </div>
  );
};

// ── Add Doctor Form ───────────────────────────────────────────────
const AddDoctorForm = ({ hospitalId, onAdded }) => {
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const [form, setForm] = useState({
    name: '', registrationNumber: '', specialization: '', subSpecialization: '',
    qualifications: '', experience: '',
    phone: '', email: '',
    consultationFee: '', followUpFee: '',
    slotDuration: '30',
  });
  const [schedule, setSchedule] = useState(
    DAYS.map(day => ({ day, isWorking: ['Monday','Tuesday','Wednesday','Thursday','Friday'].includes(day), startTime: '09:00', endTime: '17:00', slotDuration: 30, maxPatients: 20 }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const [success, setSuccess] = useState(false);

  const set = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const toggleDay = (idx) => setSchedule(s => s.map((d, i) => i === idx ? { ...d, isWorking: !d.isWorking } : d));
  const setDayField = (idx, field, value) => setSchedule(s => s.map((d, i) => i === idx ? { ...d, [field]: value } : d));

  const handleSubmit = async () => {
    setLoading(true); setError(null); setSuccess(false);
    try {
      const payload = {
        hospital: hospitalId,
        name: form.name,
        registrationNumber: form.registrationNumber,
        specialization: form.specialization,
        subSpecialization: form.subSpecialization,
        qualifications: form.qualifications.split(',').map(q => q.trim()).filter(Boolean),
        experience: +form.experience,
        contact: { phone: form.phone, email: form.email },
        fees: { consultation: +form.consultationFee, followUp: +form.followUpFee },
        schedule: schedule.map(d => ({ ...d, slotDuration: +form.slotDuration })),
        isAvailable: true,
        availableSlotsToday: schedule.find(d => d.isWorking)
          ? Math.floor((9 * 60) / +form.slotDuration)
          : 0,
      };
      await api.createDoctor(payload);
      setSuccess(true);
      onAdded();
      // Reset form
      setForm({ name: '', registrationNumber: '', specialization: '', subSpecialization: '', qualifications: '', experience: '', phone: '', email: '', consultationFee: '', followUpFee: '', slotDuration: '30' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add doctor');
    }
    setLoading(false);
  };

  const specializations = [
    'Cardiology', 'Neurology', 'Oncology', 'Orthopedics', 'Nephrology',
    'Gastroenterology', 'Pediatrics', 'General Surgery', 'Gynecology',
    'Dermatology', 'Psychiatry', 'Ophthalmology', 'ENT', 'Pulmonology',
    'Endocrinology', 'Urology', 'Radiology', 'Anesthesiology', 'Dentistry',
  ];

  return (
    <div className="card">
      <h3 style={{ marginBottom: 4, fontSize: 20 }}>👨‍⚕️ Add a Doctor</h3>
      <p style={{ color: 'var(--slate)', fontSize: 13, marginBottom: 20 }}>Add a doctor to your hospital and set their weekly schedule.</p>

      {error   && <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)',    borderRadius: 8, color: 'var(--red)',   marginBottom: 16, fontSize: 14 }}>⚠ {error}</div>}
      {success && <div style={{ padding: 12, background: 'rgba(16,185,129,0.1)',   borderRadius: 8, color: 'var(--green)', marginBottom: 16, fontSize: 14 }}>✅ Doctor added successfully!</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <Section title="Personal Info" />
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label className="label">Full Name *</label>
          <input className="input" name="name" value={form.name} onChange={set} placeholder="e.g. Dr. Priya Sharma" />
        </div>
        <div className="form-group">
          <label className="label">Medical Registration No. *</label>
          <input className="input" name="registrationNumber" value={form.registrationNumber} onChange={set} placeholder="e.g. MCI-2024-001" />
        </div>
        <div className="form-group">
          <label className="label">Experience (years)</label>
          <input className="input" name="experience" type="number" value={form.experience} onChange={set} placeholder="e.g. 10" />
        </div>
        <div className="form-group">
          <label className="label">Qualifications (comma separated)</label>
          <input className="input" name="qualifications" value={form.qualifications} onChange={set} placeholder="MBBS, MD, DM Cardiology" />
        </div>

        <Section title="Specialization" />
        <div className="form-group">
          <label className="label">Specialization *</label>
          <select className="input" name="specialization" value={form.specialization} onChange={set}>
            <option value="">Select specialization</option>
            {specializations.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="label">Sub-specialization</label>
          <input className="input" name="subSpecialization" value={form.subSpecialization} onChange={set} placeholder="e.g. Interventional Cardiology" />
        </div>

        <Section title="Contact" />
        <div className="form-group">
          <label className="label">Phone</label>
          <input className="input" name="phone" value={form.phone} onChange={set} placeholder="9876543210" />
        </div>
        <div className="form-group">
          <label className="label">Email</label>
          <input className="input" name="email" value={form.email} onChange={set} placeholder="doctor@hospital.com" />
        </div>

        <Section title="Consultation Fees (₹)" />
        <div className="form-group">
          <label className="label">Consultation Fee</label>
          <input className="input" name="consultationFee" type="number" value={form.consultationFee} onChange={set} placeholder="800" />
        </div>
        <div className="form-group">
          <label className="label">Follow-up Fee</label>
          <input className="input" name="followUpFee" type="number" value={form.followUpFee} onChange={set} placeholder="400" />
        </div>

        <Section title="Appointment Slot Duration" />
        <div className="form-group">
          <label className="label">Slot Duration (minutes)</label>
          <select className="input" name="slotDuration" value={form.slotDuration} onChange={set}>
            <option value="15">15 minutes</option>
            <option value="20">20 minutes</option>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">60 minutes</option>
          </select>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
          Weekly Schedule
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {schedule.map((day, idx) => (
            <div key={day.day} style={{
              display: 'grid', gridTemplateColumns: '120px 1fr 1fr 80px',
              gap: 12, alignItems: 'center',
              padding: '10px 14px', borderRadius: 8,
              background: day.isWorking ? 'rgba(0,196,180,0.05)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${day.isWorking ? 'rgba(0,196,180,0.2)' : 'rgba(255,255,255,0.06)'}`,
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={day.isWorking} onChange={() => toggleDay(idx)}
                  style={{ accentColor: 'var(--teal)', width: 15, height: 15 }} />
                <span style={{ color: day.isWorking ? 'var(--white)' : 'var(--slate)', fontWeight: day.isWorking ? 600 : 400 }}>
                  {day.day}
                </span>
              </label>
              <div>
                <label className="label" style={{ marginBottom: 3 }}>Start</label>
                <input type="time" className="input" value={day.startTime} disabled={!day.isWorking}
                  onChange={e => setDayField(idx, 'startTime', e.target.value)}
                  style={{ opacity: day.isWorking ? 1 : 0.4 }} />
              </div>
              <div>
                <label className="label" style={{ marginBottom: 3 }}>End</label>
                <input type="time" className="input" value={day.endTime} disabled={!day.isWorking}
                  onChange={e => setDayField(idx, 'endTime', e.target.value)}
                  style={{ opacity: day.isWorking ? 1 : 0.4 }} />
              </div>
              <div>
                <label className="label" style={{ marginBottom: 3 }}>Max Pts</label>
                <input type="number" className="input" value={day.maxPatients} disabled={!day.isWorking}
                  onChange={e => setDayField(idx, 'maxPatients', +e.target.value)}
                  style={{ opacity: day.isWorking ? 1 : 0.4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}
        style={{ marginTop: 20, fontSize: 15, padding: '13px 32px' }}>
        {loading ? '⏳ Adding...' : '👨‍⚕️ Add Doctor'}
      </button>
    </div>
  );
};

// ── Doctors List ──────────────────────────────────────────────────
const DoctorsList = ({ hospitalId }) => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.getDoctors({ hospital: hospitalId })
      .then(res => setDoctors(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [hospitalId]);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <AddDoctorForm hospitalId={hospitalId} onAdded={load} />
      <div style={{ marginTop: 28 }}>
        <h3 style={{ marginBottom: 16, fontSize: 18 }}>
          Doctors ({doctors.length})
        </h3>
        {doctors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--slate)' }}>
            No doctors added yet. Use the form above to add one.
          </div>
        ) : (
          <div className="grid-2">
            {doctors.map(doc => (
              <div key={doc._id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 3 }}>{doc.name}</div>
                    <div style={{ color: 'var(--teal)', fontSize: 13, marginBottom: 6 }}>{doc.specialization}</div>
                    <div style={{ fontSize: 12, color: 'var(--slate)', marginBottom: 4 }}>
                      {doc.qualifications?.join(', ')} · {doc.experience} yrs exp
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--teal)' }}>₹{doc.fees?.consultation}</div>
                    <div style={{ fontSize: 11, color: 'var(--slate)' }}>consultation</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <span className={`badge ${doc.isAvailable ? 'badge-green' : 'badge-red'}`}>
                    {doc.isAvailable ? '● Available' : '● Unavailable'}
                  </span>
                  <span className="badge badge-teal">{doc.availableSlotsToday} slots today</span>
                  <span className="badge badge-amber">★ {doc.rating?.average?.toFixed(1)}</span>
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--slate)' }}>
                  Working days: {doc.schedule?.filter(s => s.isWorking).map(s => s.day.slice(0,3)).join(', ')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main Admin Page ───────────────────────────────────────────────
const Admin = () => {
  const { user } = useAuth();
  const [hospital, setHospital] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [bedForm, setBedForm] = useState(null);

  useEffect(() => {
    if (!user?.hospital) { setLoading(false); return; }
    Promise.all([
      api.getHospital(user.hospital),
      api.getHospitalAppointments(user.hospital, { status: 'pending' }),
    ])
      .then(([hRes, aRes]) => {
        setHospital(hRes.data.data.hospital);
        setBedForm(hRes.data.data.hospital.beds);
        setAppointments(aRes.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const handleHospitalCreated = () => window.location.reload();

  const handleBedUpdate = async () => {
    try {
      await api.updateBeds(hospital._id, { beds: bedForm });
      setHospital(h => ({ ...h, beds: bedForm }));
      alert('Bed availability updated!');
    } catch { alert('Update failed'); }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.updateAppointmentStatus(id, { status });
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status } : a));
    } catch { alert('Failed'); }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  // No hospital yet
  if (!user?.hospital) {
    return (
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 32, marginBottom: 6 }}>Admin Panel</h1>
          <p style={{ color: 'var(--slate)' }}>You don't have a hospital linked yet. Register one below.</p>
        </div>
        <CreateHospitalForm onCreated={handleHospitalCreated} />
      </div>
    );
  }

  const tabs = ['dashboard', 'doctors', 'appointments', 'beds'];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 32, marginBottom: 4 }}>Admin Dashboard</h1>
          <div style={{ color: 'var(--teal)', fontSize: 15 }}>{hospital?.name}</div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13,
              background: tab === t ? 'var(--teal)' : 'rgba(255,255,255,0.06)',
              color: tab === t ? 'var(--navy)' : 'var(--slate)',
              fontWeight: tab === t ? 700 : 400, textTransform: 'capitalize',
              fontFamily: 'DM Sans, sans-serif',
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* DASHBOARD */}
      {tab === 'dashboard' && hospital && (
        <>
          <div className="grid-4" style={{ marginBottom: 28 }}>
            <div className="stat-card"><div className="stat-value">{hospital.beds?.available}</div><div className="stat-label">Available Beds</div></div>
            <div className="stat-card"><div className="stat-value">{hospital.beds?.icu?.available}</div><div className="stat-label">ICU Beds</div></div>
            <div className="stat-card"><div className="stat-value">{appointments.filter(a => a.status === 'pending').length}</div><div className="stat-label">Pending Appts</div></div>
            <div className="stat-card"><div className="stat-value">{hospital.occupancyRate}%</div><div className="stat-label">Occupancy Rate</div></div>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Hospital Info</h3>
            <div className="grid-2">
              <div><div style={{ fontSize: 12, color: 'var(--slate)' }}>ADDRESS</div><div>{hospital.location?.address}, {hospital.location?.city}</div></div>
              <div><div style={{ fontSize: 12, color: 'var(--slate)' }}>CONTACT</div><div>{hospital.contact?.phone}</div></div>
              <div><div style={{ fontSize: 12, color: 'var(--slate)' }}>NODE ID (Graph)</div><div style={{ fontFamily: 'monospace', color: 'var(--teal)' }}>{hospital.nodeId}</div></div>
              <div><div style={{ fontSize: 12, color: 'var(--slate)' }}>TYPE</div><div style={{ textTransform: 'capitalize' }}>{hospital.type}</div></div>
            </div>
          </div>
        </>
      )}

      {/* DOCTORS */}
      {tab === 'doctors' && (
        <DoctorsList hospitalId={hospital._id} />
      )}

      {/* APPOINTMENTS */}
      {tab === 'appointments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {appointments.length === 0 && (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--slate)' }}>No pending appointments</div>
          )}
          {appointments.map(apt => (
            <div key={apt._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{apt.patient?.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--slate)' }}>{apt.patient?.email} · {apt.patient?.phone}</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    {format(new Date(apt.appointmentDate), 'dd MMM yyyy')} at {apt.slotTime} · {apt.doctor?.name} ({apt.doctor?.specialization})
                  </div>
                  {apt.symptoms && <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 4 }}>Symptoms: {apt.symptoms}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, background: `${statusColors[apt.status]}22`, color: statusColors[apt.status] }}>{apt.status}</span>
                  {apt.status === 'pending' && <>
                    <button className="btn btn-primary" style={{ fontSize: 12, padding: '6px 14px' }} onClick={() => handleStatusUpdate(apt._id, 'confirmed')}>Confirm</button>
                    <button className="btn btn-danger"  style={{ fontSize: 12, padding: '6px 14px' }} onClick={() => handleStatusUpdate(apt._id, 'cancelled')}>Cancel</button>
                  </>}
                  {apt.status === 'confirmed' && (
                    <button className="btn btn-primary" style={{ fontSize: 12, padding: '6px 14px' }} onClick={() => handleStatusUpdate(apt._id, 'completed')}>Mark Done</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BEDS */}
      {tab === 'beds' && bedForm && (
        <div className="card">
          <h3 style={{ marginBottom: 20 }}>Update Bed Availability</h3>
          <div className="grid-2">
            {[
              { key: 'general',   label: 'General Ward' },
              { key: 'private',   label: 'Private Room' },
              { key: 'icu',       label: 'ICU' },
              { key: 'emergency', label: 'Emergency' },
            ].map(({ key, label }) => (
              <div key={key} className="card" style={{ padding: 16 }}>
                <h4 style={{ marginBottom: 12, color: 'var(--teal)' }}>{label}</h4>
                <div className="grid-2">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label">Total Beds</label>
                    <input type="number" className="input" value={bedForm[key]?.total || 0}
                      onChange={e => setBedForm(f => ({ ...f, [key]: { ...f[key], total: +e.target.value } }))} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label">Available Beds</label>
                    <input type="number" className="input" value={bedForm[key]?.available || 0}
                      onChange={e => setBedForm(f => ({ ...f, [key]: { ...f[key], available: +e.target.value } }))} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20 }}>
            <div className="form-group">
              <label className="label">Total Available (overall)</label>
              <input type="number" className="input" style={{ maxWidth: 200 }} value={bedForm.available || 0}
                onChange={e => setBedForm(f => ({ ...f, available: +e.target.value }))} />
            </div>
            <button className="btn btn-primary" onClick={handleBedUpdate}>Update Bed Availability</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;