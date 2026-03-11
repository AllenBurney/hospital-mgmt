import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => (
  <div>
    {/* Hero */}
    <div style={{
      background: 'linear-gradient(135deg, #0a1628 0%, #112240 50%, #0a1628 100%)',
      borderBottom: '1px solid rgba(0, 196, 180, 0.1)',
      padding: '80px 24px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'rgba(0, 196, 180, 0.04)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -100, left: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.06)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', padding: '6px 16px', background: 'var(--teal-glow)', border: '1px solid rgba(0,196,180,0.3)', borderRadius: 20, fontSize: 13, color: 'var(--teal)', marginBottom: 24 }}>
          ⬡ Graph-powered hospital network
        </div>
        <h1 style={{ fontSize: 58, lineHeight: 1.1, marginBottom: 20 }}>
          Find the Right Hospital,<br />
          <span style={{ color: 'var(--teal)' }}>Right Now</span>
        </h1>
        <p style={{ fontSize: 18, color: 'var(--slate)', marginBottom: 36, lineHeight: 1.7 }}>
          Distributed hospital management using Dijkstra's graph algorithm to instantly
          find nearby hospitals with available beds, qualified doctors, and transparent fees.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/find-hospital" className="btn btn-primary" style={{ fontSize: 16, padding: '14px 32px' }}>
            🔍 Find Nearest Hospital
          </Link>
          <Link to="/graph" className="btn btn-outline" style={{ fontSize: 16, padding: '14px 32px' }}>
            ⬡ View Network Graph
          </Link>
        </div>
      </div>
    </div>

    {/* Features */}
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 24px' }}>
      <h2 style={{ textAlign: 'center', fontSize: 38, marginBottom: 48 }}>How It Works</h2>
      <div className="grid-3">
        {[
          { icon: '📍', title: 'Patient Location', desc: 'Patient shares their GPS location or enters an address. The system finds their nearest hospital node in the graph.' },
          { icon: '⬡', title: 'Dijkstra\'s Algorithm', desc: 'Shortest-path algorithm traverses the hospital network graph, respecting road distances and real-time constraints.' },
          { icon: '🏥', title: 'Smart Matching', desc: 'Filter by bed type (ICU, general, private), doctor specialty, and budget. See only hospitals that can actually help.' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
            <h3 style={{ fontSize: 20, marginBottom: 12 }}>{title}</h3>
            <p style={{ color: 'var(--slate)', fontSize: 14, lineHeight: 1.7 }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginTop: 64 }}>
        {[
          { value: '6+', label: 'Hospitals in Network' },
          { value: '10+', label: 'Graph Edges' },
          { value: 'O(E log V)', label: 'Dijkstra Complexity' },
          { value: '< 1s', label: 'Search Response Time' },
        ].map(({ value, label }) => (
          <div key={label} className="stat-card" style={{ textAlign: 'center' }}>
            <div className="stat-value" style={{ fontSize: 36, textAlign: 'center' }}>{value}</div>
            <div className="stat-label" style={{ textAlign: 'center' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Home;
