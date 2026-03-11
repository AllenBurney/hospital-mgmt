import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const HospitalDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  // Appointment booking state
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    api.getHospital(id)
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (selectedDoctor && bookingDate) {
      api.getDoctorSlots(selectedDoctor._id, bookingDate)
        .then((res) => setSlots(res.data.data))
        .catch(console.error);
    }
  }, [selectedDoctor, bookingDate]);

  const handleBook = async () => {
    if (!selectedDoctor || !bookingDate || !selectedSlot) return;
    setBookingLoading(true);
    try {
      await api.bookAppointment({
        doctorId: selectedDoctor._id,
        hospitalId: id,
        appointmentDate: bookingDate,
        slotTime: selectedSlot,
        symptoms,
      });
      setBookingSuccess(true);
      setSelectedDoctor(null);
      setSelectedSlot('');
      setBookingDate('');
    } catch (err) {
      alert(err.response?.data?.message || 'Booking failed');
    }
    setBookingLoading(false);
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!data) return <div style={{ textAlign: 'center', padding: 48 }}>Hospital not found</div>;

  const { hospital, doctors, bedStats } = data;

  const tabs = ['overview', 'doctors', 'beds', 'fees'];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h1 style={{ fontSize: 32 }}>{hospital.name}</h1>
              {hospital.isVerified && <span className="badge badge-green">✓ Verified</span>}
            </div>
            <div style={{ color: 'var(--slate)', marginBottom: 8 }}>
              📍 {hospital.location?.address}, {hospital.location?.city}, {hospital.location?.state}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ color: '#f59e0b', fontSize: 15 }}>★ {hospital.rating?.average?.toFixed(1)}</span>
              <span style={{ color: 'var(--slate)' }}>({hospital.rating?.count} reviews)</span>
              <span className="badge badge-teal">{hospital.type}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <a href={`tel:${hospital.contact?.emergencyPhone}`} className="btn btn-danger">
              🚨 Emergency
            </a>
            <a href={`tel:${hospital.contact?.phone}`} className="btn btn-outline">
              📞 Call
            </a>
          </div>
        </div>
      </div>

      {/* Booking success */}
      {bookingSuccess && (
        <div style={{ padding: 16, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: 24, color: 'var(--green)' }}>
          ✅ Appointment booked successfully! <Link to="/appointments">View your appointments →</Link>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-value">{hospital.beds?.available}</div>
          <div className="stat-label">Available Beds</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{hospital.beds?.icu?.available}</div>
          <div className="stat-label">ICU Beds</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{doctors?.length}</div>
          <div className="stat-label">Active Doctors</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">₹{hospital.fees?.opd}</div>
          <div className="stat-label">OPD Consultation</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--card-bg)', borderRadius: 10, padding: 6, border: '1px solid var(--border)', width: 'fit-content' }}>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: tab === t ? 'var(--teal)' : 'transparent',
              color: tab === t ? 'var(--navy)' : 'var(--slate)',
              fontWeight: tab === t ? 700 : 400, fontSize: 14,
              textTransform: 'capitalize', fontFamily: 'DM Sans, sans-serif',
            }}
          >{t}</button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="grid-2">
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Specialties</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {hospital.specialties?.map((s) => (
                <span key={s} style={{ padding: '6px 14px', background: 'rgba(99, 102, 241, 0.12)', borderRadius: 8, color: '#a5b4fc', fontSize: 13 }}>{s}</span>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Facilities</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {hospital.facilities?.map((f) => (
                <span key={f} style={{ padding: '6px 14px', background: 'var(--teal-glow)', borderRadius: 8, color: 'var(--teal)', fontSize: 13 }}>{f}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'doctors' && (
        <div>
          <div className="grid-2">
            {doctors?.map((doc) => (
              <div key={doc._id} className="card" style={{ cursor: 'pointer', border: selectedDoctor?._id === doc._id ? '1px solid var(--teal)' : '1px solid var(--border)' }}
                onClick={() => { setSelectedDoctor(doc); setSelectedSlot(''); setSlots([]); }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{doc.name}</div>
                    <div style={{ color: 'var(--teal)', fontSize: 13, marginBottom: 4 }}>{doc.specialization}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--teal)' }}>₹{doc.fees?.consultation}</div>
                    <div style={{ fontSize: 11, color: 'var(--slate)' }}>consultation</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <span className={`badge ${doc.isAvailable ? 'badge-green' : 'badge-red'}`}>
                    {doc.isAvailable ? '● Available' : '● Unavailable'}
                  </span>
                  <span className="badge badge-amber">★ {doc.rating?.average?.toFixed(1)}</span>
                  {doc.availableSlotsToday > 0 && <span className="badge badge-teal">{doc.availableSlotsToday} slots today</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Booking panel */}
          {selectedDoctor && user && (
            <div className="card" style={{ marginTop: 24, border: '1px solid var(--teal)' }}>
              <h3 style={{ marginBottom: 16 }}>Book Appointment with {selectedDoctor.name}</h3>
              <div className="grid-2" style={{ marginBottom: 16 }}>
                <div className="form-group">
                  <label className="label">Select Date</label>
                  <input type="date" className="input" value={bookingDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setBookingDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="label">Symptoms / Reason</label>
                  <input className="input" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="Brief description..." />
                </div>
              </div>

              {slots.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <label className="label">Available Slots</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {slots.map((s) => (
                      <button key={s}
                        onClick={() => setSelectedSlot(s)}
                        style={{
                          padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13,
                          background: selectedSlot === s ? 'var(--teal)' : 'rgba(0,196,180,0.1)',
                          color: selectedSlot === s ? 'var(--navy)' : 'var(--teal)',
                          fontWeight: selectedSlot === s ? 700 : 400,
                        }}
                      >{s}</button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button className="btn btn-primary" onClick={handleBook} disabled={!selectedSlot || bookingLoading}>
                  {bookingLoading ? 'Booking...' : `Book for ₹${selectedDoctor.fees?.consultation}`}
                </button>
                <button className="btn btn-outline" onClick={() => setSelectedDoctor(null)}>Cancel</button>
              </div>
            </div>
          )}

          {selectedDoctor && !user && (
            <div style={{ marginTop: 16, padding: 16, background: 'rgba(245, 158, 11, 0.1)', borderRadius: 8 }}>
              <Link to="/login">Login</Link> to book an appointment.
            </div>
          )}
        </div>
      )}

      {tab === 'beds' && (
        <div className="grid-2">
          {[
            { type: 'general', label: 'General Ward', color: 'var(--teal)' },
            { type: 'private', label: 'Private Room', color: '#6366f1' },
            { type: 'icu', label: 'ICU', color: 'var(--amber)' },
            { type: 'emergency', label: 'Emergency', color: 'var(--red)' },
          ].map(({ type, label, color }) => {
            const stat = hospital.beds?.[type];
            return (
              <div key={type} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16 }}>{label}</h3>
                  <span style={{ fontSize: 24, fontWeight: 700, color }}>{stat?.available}</span>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, marginBottom: 8 }}>
                  <div style={{ height: 8, borderRadius: 4, background: color, width: `${stat?.total ? (stat.available / stat.total) * 100 : 0}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--slate)' }}>
                  <span>{stat?.available} available</span>
                  <span>{stat?.total} total</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'fees' && (
        <div className="card">
          <h3 style={{ marginBottom: 20 }}>Fee Structure</h3>
          <div style={{ display: 'grid', gap: 0 }}>
            {[
              { label: 'OPD Consultation', value: hospital.fees?.opd },
              { label: 'IPD (General Ward/day)', value: hospital.fees?.ipd },
              { label: 'IPD (Private Room/day)', value: hospital.fees?.ipdPrivate },
              { label: 'ICU (per day)', value: hospital.fees?.icu },
              { label: 'Emergency Admission', value: hospital.fees?.emergency },
              { label: 'Minor Surgery', value: hospital.fees?.surgery?.minor },
              { label: 'Major Surgery', value: hospital.fees?.surgery?.major },
            ].map(({ label, value }, i) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 0', borderBottom: i < 6 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ color: 'var(--slate)' }}>{label}</span>
                <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--teal)' }}>₹{value?.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalDetail;
