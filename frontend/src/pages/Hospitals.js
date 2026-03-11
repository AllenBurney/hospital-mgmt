import React, { useState, useEffect } from 'react';
import * as api from '../utils/api';
import HospitalCard from '../components/hospital/HospitalCard';

const Hospitals = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ city: '', type: '', specialty: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 12;

  useEffect(() => {
    setLoading(true);
    api.getHospitals({ ...filters, page, limit: LIMIT })
      .then((res) => {
        setHospitals(res.data.data);
        setTotal(res.data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters, page]);

  const handleFilter = (e) => {
    setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));
    setPage(1);
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 36, marginBottom: 6 }}>Hospitals</h1>
          <p style={{ color: 'var(--slate)' }}>{total} hospitals registered in the network</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 28, padding: '20px 24px' }}>
        <div className="grid-3">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">City</label>
            <input className="input" name="city" value={filters.city} onChange={handleFilter} placeholder="Search by city..." />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">Type</label>
            <select className="input" name="type" value={filters.type} onChange={handleFilter}>
              <option value="">All Types</option>
              <option value="government">Government</option>
              <option value="private">Private</option>
              <option value="trust">Trust</option>
              <option value="clinic">Clinic</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">Specialty</label>
            <input className="input" name="specialty" value={filters.specialty} onChange={handleFilter} placeholder="e.g. Cardiology" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <>
          <div className="grid-3">
            {hospitals.map((h) => <HospitalCard key={h._id} hospital={h} />)}
          </div>

          {hospitals.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--slate)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🏥</div>
              <div>No hospitals found matching your filters</div>
            </div>
          )}

          {/* Pagination */}
          {total > LIMIT && (() => {
            const totalPages = Math.ceil(total / LIMIT);
            const delta = 2;
            const getPages = () => {
              const range = [];
              for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) range.push(i);
              if (page - delta > 2) range.unshift('...');
              if (page + delta < totalPages - 1) range.push('...');
              range.unshift(1);
              if (totalPages > 1) range.push(totalPages);
              return range;
            };
            const btn = {
              height: 36, minWidth: 36, padding: '0 10px', borderRadius: 8,
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s',
            };
            return (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, marginTop: 36, flexWrap: 'wrap' }}>
                <button disabled={page === 1}
                  onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  style={{ ...btn, padding: '0 14px', background: 'rgba(255,255,255,0.06)', color: page === 1 ? 'var(--slate)' : 'var(--white)', opacity: page === 1 ? 0.4 : 1 }}>
                  ← Prev
                </button>
                {getPages().map((p, i) => p === '...'
                  ? <span key={`e${i}`} style={{ color: 'var(--slate)', padding: '0 4px' }}>…</span>
                  : <button key={p}
                      onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      style={{ ...btn, background: p === page ? 'var(--teal)' : 'rgba(255,255,255,0.06)', color: p === page ? 'var(--navy)' : 'var(--white)', fontWeight: p === page ? 700 : 400, boxShadow: p === page ? '0 0 12px rgba(0,196,180,0.35)' : 'none' }}>
                      {p}
                    </button>
                )}
                <button disabled={page === totalPages}
                  onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  style={{ ...btn, padding: '0 14px', background: 'rgba(255,255,255,0.06)', color: page === totalPages ? 'var(--slate)' : 'var(--white)', opacity: page === totalPages ? 0.4 : 1 }}>
                  Next →
                </button>
                <span style={{ fontSize: 12, color: 'var(--slate)', marginLeft: 8 }}>
                  Page {page} of {totalPages} · {total} hospitals
                </span>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
};

export default Hospitals;