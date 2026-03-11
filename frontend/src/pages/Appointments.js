import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../utils/api';
import { format } from 'date-fns';

const statusColors = {
  pending: '#f59e0b',
  confirmed: '#10b981',
  completed: '#6366f1',
  cancelled: '#ef4444',
  'no-show': '#94a3b8',
  'in-progress': '#00c4b4',
};

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.getMyAppointments()
      .then((res) => setAppointments(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      await api.cancelAppointment(id, 'Cancelled by patient');
      setAppointments((prev) => prev.map((a) => a._id === id ? { ...a, status: 'cancelled' } : a));
    } catch (err) {
      alert('Failed to cancel');
    }
  };

  const filtered = filter === 'all' ? appointments : appointments.filter((a) => a.status === filter);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: 36, marginBottom: 24 }}>My Appointments</h1>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap' }}>
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((s) => (
          <button key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13,
              background: filter === s ? 'var(--teal)' : 'rgba(255,255,255,0.05)',
              color: filter === s ? 'var(--navy)' : 'var(--slate)',
              fontWeight: filter === s ? 700 : 400, textTransform: 'capitalize',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {s} {s === 'all' ? `(${appointments.length})` : `(${appointments.filter(a => a.status === s).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--slate)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
          <div style={{ marginBottom: 12 }}>No appointments found</div>
          <Link to="/find-hospital" className="btn btn-primary">Find a Hospital</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map((apt) => (
            <div key={apt._id} className="card fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>
                    {apt.doctor?.name}
                  </div>
                  <div style={{ color: 'var(--teal)', fontSize: 14, marginBottom: 6 }}>
                    {apt.doctor?.specialization}
                  </div>
                  <div style={{ color: 'var(--slate)', fontSize: 13 }}>
                    🏥 {apt.hospital?.name} · {apt.hospital?.location?.city}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: `${statusColors[apt.status]}22`, color: statusColors[apt.status],
                  }}>
                    {apt.status?.toUpperCase()}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--slate)', marginBottom: 2 }}>DATE</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {apt.appointmentDate ? format(new Date(apt.appointmentDate), 'dd MMM yyyy') : 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--slate)', marginBottom: 2 }}>TIME</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{apt.slotTime}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--slate)', marginBottom: 2 }}>TYPE</div>
                  <div style={{ fontSize: 14, fontWeight: 500, textTransform: 'uppercase' }}>{apt.type}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--slate)', marginBottom: 2 }}>FEE</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--teal)' }}>₹{apt.fee?.toLocaleString('en-IN')}</div>
                </div>
                {apt.symptoms && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--slate)', marginBottom: 2 }}>SYMPTOMS</div>
                    <div style={{ fontSize: 13 }}>{apt.symptoms}</div>
                  </div>
                )}
              </div>

              {apt.diagnosis && (
                <div style={{ marginTop: 12, padding: 12, background: 'rgba(99, 102, 241, 0.08)', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: 'var(--slate)', marginBottom: 4 }}>DIAGNOSIS</div>
                  <div style={{ fontSize: 14 }}>{apt.diagnosis}</div>
                </div>
              )}

              {apt.prescription?.length > 0 && (
                <div style={{ marginTop: 12, padding: 12, background: 'rgba(0, 196, 180, 0.05)', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: 'var(--slate)', marginBottom: 8 }}>PRESCRIPTION</div>
                  {apt.prescription.map((p, i) => (
                    <div key={i} style={{ fontSize: 13, color: 'var(--white)', marginBottom: 4 }}>
                      💊 {p.medicine} — {p.dosage} for {p.duration}
                    </div>
                  ))}
                </div>
              )}

              {['pending', 'confirmed'].includes(apt.status) && (
                <div style={{ marginTop: 16 }}>
                  <button className="btn btn-danger" style={{ fontSize: 13, padding: '7px 16px' }}
                    onClick={() => handleCancel(apt._id)}>
                    Cancel Appointment
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Appointments;
