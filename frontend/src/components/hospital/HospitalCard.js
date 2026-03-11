import React from 'react';
import { Link } from 'react-router-dom';

const BedBar = ({ label, available, total, color }) => (
  <div style={{ marginBottom: 8 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
      <span style={{ fontSize: 12, color: 'var(--slate)' }}>{label}</span>
      <span style={{ fontSize: 12, color: available > 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
        {available}/{total}
      </span>
    </div>
    <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
      <div style={{
        height: 4, borderRadius: 2,
        width: `${total > 0 ? (available / total) * 100 : 0}%`,
        background: available > 0 ? color : 'var(--red)',
        transition: 'width 0.6s ease',
      }} />
    </div>
  </div>
);

const HospitalCard = ({ hospital, distance, travelTime }) => {
  const { beds, fees, rating } = hospital;
  const typeColors = {
    government: '#10b981',
    private: '#6366f1',
    trust: '#f59e0b',
    clinic: '#ec4899',
  };

  return (
    <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16, transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(0, 196, 180, 0.15)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: 17, marginBottom: 4 }}>{hospital.name}</h3>
          <div style={{ fontSize: 13, color: 'var(--slate)' }}>
            📍 {hospital.location?.address}, {hospital.location?.city}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span style={{
            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
            background: `${typeColors[hospital.type]}22`, color: typeColors[hospital.type],
          }}>
            {hospital.type?.toUpperCase()}
          </span>
          <div style={{ fontSize: 13, color: '#f59e0b' }}>
            ★ {rating?.average?.toFixed(1)} <span style={{ color: 'var(--slate)' }}>({rating?.count})</span>
          </div>
        </div>
      </div>

      {/* Distance badge */}
      {(distance !== undefined) && (
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="badge badge-teal">📏 {distance?.toFixed(1)} km</span>
          {travelTime && <span className="badge badge-amber">🕐 ~{Math.round(travelTime)} min</span>}
        </div>
      )}

      {/* Bed availability */}
      <div>
        <div style={{ fontSize: 12, color: 'var(--slate)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
          Bed Availability
        </div>
        <BedBar label="General" available={beds?.general?.available || 0} total={beds?.general?.total || 0} color="var(--teal)" />
        <BedBar label="Private" available={beds?.private?.available || 0} total={beds?.private?.total || 0} color="#6366f1" />
        <BedBar label="ICU" available={beds?.icu?.available || 0} total={beds?.icu?.total || 0} color="var(--amber)" />
        <BedBar label="Emergency" available={beds?.emergency?.available || 0} total={beds?.emergency?.total || 0} color="var(--red)" />
      </div>

      {/* Fees */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[
          { label: 'OPD', value: fees?.opd },
          { label: 'IPD/day', value: fees?.ipd },
          { label: 'ICU/day', value: fees?.icu },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px',
            border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center',
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--teal)' }}>
              ₹{value?.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--slate)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Specialties */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {hospital.specialties?.slice(0, 4).map((s) => (
          <span key={s} style={{
            fontSize: 11, padding: '3px 8px', borderRadius: 6,
            background: 'rgba(99, 102, 241, 0.12)', color: '#a5b4fc',
          }}>{s}</span>
        ))}
        {hospital.specialties?.length > 4 && (
          <span style={{ fontSize: 11, color: 'var(--slate)' }}>+{hospital.specialties.length - 4} more</span>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <Link to={`/hospitals/${hospital._id}`} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 13 }}>
          View Details
        </Link>
        <a href={`tel:${hospital.contact?.emergencyPhone}`} className="btn btn-outline" style={{ fontSize: 13 }}>
          📞 Emergency
        </a>
      </div>
    </div>
  );
};

export default HospitalCard;
