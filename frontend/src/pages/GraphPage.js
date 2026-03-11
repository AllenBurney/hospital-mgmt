import React from 'react';
import GraphViz from '../components/graph/GraphViz';

const GraphPage = () => (
  <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
    <div style={{ marginBottom: 28 }}>
      <h1 style={{ fontSize: 36, marginBottom: 8 }}>⬡ Hospital Network Graph</h1>
      <p style={{ color: 'var(--slate)', maxWidth: 700 }}>
        Interactive visualization of the hospital network. Each node represents a hospital.
        Edge weights are road distances (km). Dijkstra's algorithm traverses this graph to find
        the nearest available hospital for a patient. Node color indicates bed availability.
      </p>
    </div>
    <div className="card">
      <GraphViz />
    </div>

    <div className="grid-3" style={{ marginTop: 28 }}>
      {[
        { title: 'Dijkstra\'s Algorithm', desc: 'Finds shortest path from patient\'s location to hospitals with available beds, visiting each graph node once.' },
        { title: 'Real-time Filtering', desc: 'Edges and nodes are filtered by bed type, specialty, and fee constraints before running the algorithm.' },
        { title: 'Bidirectional Edges', desc: 'All hospital-to-hospital roads are bidirectional. Edge weight = road distance in km or travel time.' },
      ].map(({ title, desc }) => (
        <div key={title} className="card">
          <h3 style={{ fontSize: 15, marginBottom: 8, color: 'var(--teal)' }}>{title}</h3>
          <p style={{ fontSize: 13, color: 'var(--slate)', lineHeight: 1.6 }}>{desc}</p>
        </div>
      ))}
    </div>
  </div>
);

export default GraphPage;
