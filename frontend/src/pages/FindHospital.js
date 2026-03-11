import React, { useState, useRef, useEffect } from 'react';
import * as api from '../utils/api';
import HospitalCard from '../components/hospital/HospitalCard';
import GraphViz from '../components/graph/GraphViz';

const FindHospital = () => {
  const [form, setForm] = useState({
    lng: '', lat: '',
    bedType: '', specialty: '',
    maxOpdFee: '', maxIpdFee: '',
    requireICU: false,
    topN: '10', weightKey: 'distanceKm',
  });
  const [addressQuery, setAddressQuery] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [suggestions, setSuggestions]   = useState([]);
  const [geoLoading, setGeoLoading]     = useState(false);
  const [gpsLoading, setGpsLoading]     = useState(false);
  const [results, setResults]           = useState([]);
  const [highlightPath, setHighlightPath] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [searched, setSearched]         = useState(false);
  const [error, setError]               = useState(null);
  const debounceRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  // Debounced Nominatim autocomplete (free, no API key)
  useEffect(() => {
    if (!addressQuery || addressQuery.length < 3) { setSuggestions([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setGeoLoading(true);
      try {
        const res  = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressQuery)}&format=json&addressdetails=1&limit=5&countrycodes=in`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        setSuggestions(data);
      } catch { setSuggestions([]); }
      setGeoLoading(false);
    }, 400);
  }, [addressQuery]);

  const selectSuggestion = (s) => {
    const label = s.display_name.split(',').slice(0, 3).join(',');
    setForm(f => ({ ...f, lat: s.lat, lng: s.lon }));
    setLocationLabel(label);
    setAddressQuery(label);
    setSuggestions([]);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported by your browser'); return; }
    setGpsLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        setForm(f => ({ ...f, lat: String(latitude), lng: String(longitude) }));
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          const label = data.address
            ? [data.address.suburb, data.address.city || data.address.town, data.address.state].filter(Boolean).join(', ')
            : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setLocationLabel(label);
          setAddressQuery(label);
        } catch {
          setLocationLabel(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          setAddressQuery(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
        setSuggestions([]);
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        setError(err.code === 1
          ? 'Location access denied. Please allow location or type an address.'
          : 'Could not get location. Try typing an address instead.');
      },
      { timeout: 8000 }
    );
  };

  const handleSearch = async () => {
    if (!form.lat || !form.lng) {
      setError('Please select a location first — search an address or click Use GPS.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = {
        lng: form.lng, lat: form.lat,
        topN: form.topN, weightKey: form.weightKey,
        requireICU: form.requireICU,
        ...(form.bedType   && { bedType:   form.bedType }),
        ...(form.specialty && { specialty: form.specialty }),
        ...(form.maxOpdFee && { maxOpdFee: form.maxOpdFee }),
        ...(form.maxIpdFee && { maxIpdFee: form.maxIpdFee }),
      };
      const res = await api.getNearbyGraph(params);
      setResults(res.data.data);
      if (res.data.data.length > 0) {
        setHighlightPath(res.data.data[0].path.map(p => p.nodeId));
      }
      setSearched(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed');
    }
    setLoading(false);
  };

  const specialties = [
    'Cardiology', 'Neurology', 'Oncology', 'Orthopedics',
    'Nephrology', 'Gastroenterology', 'Pediatrics', 'General Surgery',
  ];

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 36, marginBottom: 8 }}>Find Nearest Hospital</h1>
        <p style={{ color: 'var(--slate)', fontSize: 15 }}>
          Uses Dijkstra's graph algorithm to find hospitals sorted by road distance with real-time availability filters.
        </p>
      </div>

      {/* Search Form */}
      <div className="card" style={{ marginBottom: 32 }}>
        <h3 style={{ marginBottom: 20, fontSize: 18 }}>Search Parameters</h3>

        {/* ── Location row ── */}
        <div style={{ marginBottom: 20 }}>
          <label className="label">Your Location *</label>
          <div style={{ display: 'flex', gap: 10 }}>

            {/* Address autocomplete */}
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                className="input"
                value={addressQuery}
                onChange={e => {
                  setAddressQuery(e.target.value);
                  setForm(f => ({ ...f, lat: '', lng: '' }));
                  setLocationLabel('');
                }}
                placeholder="Search area, city or address… e.g. Salt Lake, Kolkata"
                style={{ paddingRight: 36 }}
              />
              {geoLoading && (
                <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
                  <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                </div>
              )}

              {suggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
                  background: 'var(--navy-light)', border: '1px solid var(--border)',
                  borderRadius: 8, overflow: 'hidden', boxShadow: 'var(--shadow)',
                }}>
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      onClick={() => selectSuggestion(s)}
                      style={{
                        padding: '10px 14px', cursor: 'pointer', fontSize: 13,
                        borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                        display: 'flex', gap: 8, alignItems: 'flex-start',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,196,180,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ marginTop: 2, flexShrink: 0 }}>📍</span>
                      <div>
                        <div style={{ color: 'var(--white)', fontWeight: 500, marginBottom: 2 }}>
                          {s.display_name.split(',').slice(0, 2).join(',')}
                        </div>
                        <div style={{ color: 'var(--slate)', fontSize: 11 }}>
                          {s.display_name.split(',').slice(2, 5).join(',')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GPS button */}
            <button
              className="btn btn-outline"
              onClick={useCurrentLocation}
              disabled={gpsLoading}
              style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6, padding: '0 18px', flexShrink: 0 }}
            >
              {gpsLoading
                ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Locating…</>
                : <>📍 Use GPS</>}
            </button>
          </div>

          {/* Confirmed location pill */}
          {form.lat && form.lng && (
            <div style={{
              marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 14px', borderRadius: 20,
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
              fontSize: 12, color: '#10b981',
            }}>
              ✓ {locationLabel || `${parseFloat(form.lat).toFixed(5)}, ${parseFloat(form.lng).toFixed(5)}`}
              <span style={{ color: 'rgba(16,185,129,0.45)', fontSize: 10 }}>
                · {parseFloat(form.lat).toFixed(5)}, {parseFloat(form.lng).toFixed(5)}
              </span>
            </div>
          )}
        </div>

        {/* ── Filters row 1 ── */}
        <div className="grid-3" style={{ marginBottom: 16 }}>
          <div className="form-group">
            <label className="label">Bed Type</label>
            <select className="input" name="bedType" value={form.bedType} onChange={handleChange}>
              <option value="">Any Bed</option>
              <option value="general">General</option>
              <option value="private">Private</option>
              <option value="icu">ICU</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">Specialty Required</label>
            <select className="input" name="specialty" value={form.specialty} onChange={handleChange}>
              <option value="">Any Specialty</option>
              {specialties.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Sort / Route by</label>
            <select className="input" name="weightKey" value={form.weightKey} onChange={handleChange}>
              <option value="distanceKm">Shortest Distance (km)</option>
              <option value="travelTimeMinutes">Fastest Travel Time</option>
            </select>
          </div>
        </div>

        {/* ── Filters row 2 ── */}
        <div className="grid-3" style={{ marginBottom: 20 }}>
          <div className="form-group">
            <label className="label">Max OPD Fee (₹)</label>
            <input className="input" name="maxOpdFee" value={form.maxOpdFee} onChange={handleChange} placeholder="e.g. 1000" type="number" />
          </div>
          <div className="form-group">
            <label className="label">Max IPD Fee / day (₹)</label>
            <input className="input" name="maxIpdFee" value={form.maxIpdFee} onChange={handleChange} placeholder="e.g. 5000" type="number" />
          </div>
          <div className="form-group">
            <label className="label">Results</label>
            <select className="input" name="topN" value={form.topN} onChange={handleChange}>
              <option value="5">Top 5</option>
              <option value="10">Top 10</option>
              <option value="20">Top 20</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
            <input type="checkbox" name="requireICU" checked={form.requireICU} onChange={handleChange}
              style={{ accentColor: 'var(--teal)', width: 16, height: 16 }} />
            Require ICU availability
          </label>
        </div>

        {error && (
          <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', borderRadius: 8, color: 'var(--red)', marginBottom: 16, fontSize: 14 }}>
            ⚠ {error}
          </div>
        )}

        <button className="btn btn-primary" onClick={handleSearch} disabled={loading} style={{ fontSize: 15, padding: '12px 28px' }}>
          {loading ? '🔍 Searching...' : '🔍 Find Hospitals via Graph'}
        </button>
      </div>

      {/* Graph Visualization */}
      <div className="card" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18 }}>⬡ Hospital Network Graph</h3>
          <span style={{ fontSize: 13, color: 'var(--slate)' }}>
            {searched && results.length > 0
              ? '🟡 Highlighted = shortest path to nearest hospital'
              : 'Nodes = hospitals · Edges = road connections'}
          </span>
        </div>
        <GraphViz highlightPath={highlightPath} />
      </div>

      {/* Results */}
      {searched && (
        <div>
          <h2 style={{ marginBottom: 20 }}>
            {results.length > 0 ? `${results.length} Hospitals Found` : 'No hospitals match your filters'}
          </h2>
          <div className="grid-2">
            {results.map((r) => (
              <div key={r.hospital._id}>
                <HospitalCard hospital={r.hospital} distance={r.distance} travelTime={r.travelTimeMinutes} />
                {r.path?.length > 1 && (
                  <div style={{
                    marginTop: 8, padding: '8px 14px',
                    background: 'rgba(245,158,11,0.08)', borderRadius: 8,
                    border: '1px solid rgba(245,158,11,0.2)',
                    fontSize: 12, color: 'var(--amber)',
                  }}>
                    🗺 Graph path: {r.path.map(p => p.nodeId).join(' → ')}
                  </div>
                )}
                {r.doctors?.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 12, color: 'var(--slate)', marginBottom: 6 }}>Available Doctors:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {r.doctors.slice(0, 3).map(d => (
                        <span key={d._id} style={{
                          fontSize: 12, padding: '4px 10px', borderRadius: 6,
                          background: 'rgba(99,102,241,0.12)', color: '#a5b4fc',
                        }}>
                          {d.name} · {d.specialization} · ₹{d.fees?.consultation}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FindHospital;





