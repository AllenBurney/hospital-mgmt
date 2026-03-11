import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import * as api from '../../utils/api';

const GraphViz = ({ highlightPath = [] }) => {
  const svgRef    = useRef();
  const [status, setStatus]   = useState('loading'); // loading | empty | ready | error
  const [message, setMessage] = useState('');
  const [stats, setStats]     = useState({ hospitals: 0, edges: 0, nodes: 0, links: 0 });
  const [tooltip, setTooltip] = useState(null);
  const dataRef = useRef({ nodes: [], links: [] });

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      // Fetch hospitals (up to 300 for graph display)
      const hRes = await api.getHospitals({ limit: 300 });
      const allHospitals = hRes.data.data || [];

      if (allHospitals.length === 0) {
        setStatus('empty');
        setMessage('No hospitals found in database. Run the seed or import script first.');
        return;
      }

      // Fetch edges
      const eRes = await api.getGraphEdges();
      const allEdges = eRes.data.data || [];
      const totalEdges = eRes.data.count || 0;

      console.log(`Loaded ${allHospitals.length} hospitals, ${allEdges.length} edges (total: ${totalEdges})`);

      // Build nodeId → hospital map
      const nodeMap = new Map();
      for (const h of allHospitals) {
        if (h.nodeId) nodeMap.set(h.nodeId, h);
      }

      let nodes = [];
      let links = [];

      if (allEdges.length === 0) {
        // No edges at all — just show hospitals as dots
        nodes = allHospitals.filter(h => h.nodeId).map(h => ({ id: h.nodeId, ...h }));
        setMessage(`No graph edges found. ${allHospitals.length} hospitals shown as standalone nodes.`);
      } else {
        // Collect node IDs that appear in edges AND exist in our hospital list
        const nodeIdsInEdges = new Set();
        for (const e of allEdges) {
          if (nodeMap.has(e.fromNodeId)) nodeIdsInEdges.add(e.fromNodeId);
          if (nodeMap.has(e.toNodeId))   nodeIdsInEdges.add(e.toNodeId);
        }

        // Also add hospitals that have nodeIds but no edges (isolated nodes)
        for (const h of allHospitals) {
          if (h.nodeId) nodeIdsInEdges.add(h.nodeId);
        }

        // Build nodes array (cap at 300)
        const nodeIdList = Array.from(nodeIdsInEdges).slice(0, 300);
        nodes = nodeIdList.map(id => {
          const h = nodeMap.get(id);
          return h ? { id, ...h } : { id, name: id, beds: {}, fees: {}, location: {} };
        });

        // Build final node set for edge filtering
        const finalNodeIds = new Set(nodes.map(n => n.id));

        // Deduplicate and filter edges
        const seen = new Set();
        for (const e of allEdges) {
          if (!finalNodeIds.has(e.fromNodeId) || !finalNodeIds.has(e.toNodeId)) continue;
          const key = [e.fromNodeId, e.toNodeId].sort().join('|||');
          if (seen.has(key)) continue;
          seen.add(key);
          links.push({
            source: e.fromNodeId,
            target: e.toNodeId,
            distance: e.distanceKm || 0,
            time: e.travelTimeMinutes || 0,
          });
          if (links.length >= 800) break; // cap for browser performance
        }
      }

      dataRef.current = { nodes, links };
      setStats({
        hospitals: hRes.data.total || allHospitals.length,
        edges: totalEdges,
        nodes: nodes.length,
        links: links.length,
      });
      setStatus('ready');
    } catch (err) {
      console.error('GraphViz load error:', err);
      setStatus('error');
      setMessage(err.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (status === 'ready') draw();
  }, [status, highlightPath]);

  const draw = () => {
    const { nodes, links } = dataRef.current;
    const container = svgRef.current?.parentElement;
    if (!container || nodes.length === 0) return;

    const W = container.clientWidth || 900;
    const H = 560;

    // Clear
    d3.select(svgRef.current).selectAll('*').remove();
    const svg = d3.select(svgRef.current).attr('width', W).attr('height', H);

    // Background
    svg.append('rect').attr('width', W).attr('height', H).attr('fill', '#0a1628');

    // Glow filter
    const defs = svg.append('defs');
    const glow = defs.append('filter').attr('id', 'gv-glow');
    glow.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const fm = glow.append('feMerge');
    fm.append('feMergeNode').attr('in', 'coloredBlur');
    fm.append('feMergeNode').attr('in', 'SourceGraphic');

    // Zoomable group
    const g = svg.append('g');
    svg.call(d3.zoom().scaleExtent([0.05, 8]).on('zoom', e => g.attr('transform', e.transform)));

    // Deep copy nodes for D3 simulation
    const simNodes = nodes.map(n => ({ ...n }));
    const byId     = new Map(simNodes.map(n => [n.id, n]));

    // Resolve link references to actual node objects
    const simLinks = links
      .filter(l => byId.has(l.source) && byId.has(l.target))
      .map(l => ({ ...l, source: byId.get(l.source), target: byId.get(l.target) }));

    const large = simNodes.length > 80;
    const r     = large ? 6 : 16;

    // Highlight set
    const hlSet = new Set();
    for (let i = 0; i < highlightPath.length - 1; i++) {
      hlSet.add([highlightPath[i], highlightPath[i+1]].sort().join('|||'));
    }

    // Simulation
    const sim = d3.forceSimulation(simNodes)
      .force('link',      d3.forceLink(simLinks).id(d => d.id).distance(large ? 25 : 70))
      .force('charge',    d3.forceManyBody().strength(large ? -60 : -250))
      .force('center',    d3.forceCenter(W/2, H/2))
      .force('collision', d3.forceCollide(large ? 10 : 24))
      .alphaDecay(large ? 0.04 : 0.02);

    // Draw links
    const linkSel = g.append('g')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(simLinks)
      .join('line')
      .attr('stroke', d => {
        const k = [d.source.id, d.target.id].sort().join('|||');
        return hlSet.has(k) ? '#f59e0b' : '#00c4b4';
      })
      .attr('stroke-width', d => {
        const k = [d.source.id, d.target.id].sort().join('|||');
        return hlSet.has(k) ? 3 : large ? 0.6 : 1.2;
      })
      .attr('filter', d => {
        const k = [d.source.id, d.target.id].sort().join('|||');
        return hlSet.has(k) ? 'url(#gv-glow)' : '';
      });

    // Draw nodes
    const nodeSel = g.append('g')
      .selectAll('g')
      .data(simNodes)
      .join('g')
      .call(d3.drag()
        .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag',  (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end',   (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
      )
      .on('mouseenter', (e, d) => setTooltip({ h: d, x: e.clientX, y: e.clientY }))
      .on('mouseleave', () => setTooltip(null));

    nodeSel.append('circle')
      .attr('r', d => highlightPath.includes(d.id) ? r + 5 : r)
      .attr('fill', d => {
        if (highlightPath.includes(d.id)) return '#f59e0b';
        const av = d.beds?.available ?? 0;
        if (av > 50) return '#10b981';
        if (av > 10) return '#00c4b4';
        if (av > 0)  return '#f59e0b';
        return '#ef4444';
      })
      .attr('fill-opacity', 0.85)
      .attr('stroke', '#ffffff')
      .attr('stroke-opacity', 0.2)
      .attr('stroke-width', 1)
      .attr('filter', d => highlightPath.includes(d.id) ? 'url(#gv-glow)' : '');

    if (!large) {
      // Beds count label
      nodeSel.append('text')
        .attr('text-anchor', 'middle').attr('dy', '0.35em')
        .attr('fill', '#fff').attr('font-size', 9).attr('font-weight', 700)
        .attr('pointer-events', 'none')
        .text(d => d.beds?.available ?? '');

      // Hospital name label
      nodeSel.append('text')
        .attr('text-anchor', 'middle').attr('dy', r + 12)
        .attr('fill', '#cbd5e1').attr('font-size', 9)
        .attr('pointer-events', 'none')
        .text(d => (d.name || d.id).split(' ').slice(0, 2).join(' '));
    }

    // Distance labels on links (small graph only)
    if (!large && simLinks.length < 100) {
      g.append('g').selectAll('text').data(simLinks).join('text')
        .attr('text-anchor', 'middle')
        .attr('fill', 'rgba(148,163,184,0.7)')
        .attr('font-size', 8)
        .attr('pointer-events', 'none')
        .text(d => d.distance ? `${d.distance}km` : '');
    }

    // Tick
    sim.on('tick', () => {
      linkSel
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y);

      nodeSel.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);

      if (!large && simLinks.length < 100) {
        g.selectAll('text').filter((d, i, nodes) => nodes[i].parentNode.tagName === 'g' && d?.source)
          .attr('x', d => d.source?.x && d.target?.x ? (d.source.x + d.target.x) / 2 : 0)
          .attr('y', d => d.source?.y && d.target?.y ? (d.source.y + d.target.y) / 2 - 4 : 0);
      }
    });
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Legend + stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { color: '#10b981', label: '>50 beds' },
            { color: '#00c4b4', label: '10–50 beds' },
            { color: '#f59e0b', label: '1–10 beds' },
            { color: '#ef4444', label: 'No beds' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: 12, color: 'var(--slate)' }}>{label}</span>
            </div>
          ))}
        </div>
        {status === 'ready' && (
          <span style={{ fontSize: 12, color: 'var(--teal)' }}>
            🏥 {stats.hospitals} hospitals · ⬡ {stats.edges} edges · showing {stats.nodes} nodes / {stats.links} links
          </span>
        )}
      </div>

      <div style={{ fontSize: 11, color: 'var(--slate)', marginBottom: 8 }}>
        Scroll to zoom · Click & drag to pan · Drag nodes to rearrange
      </div>

      {/* States */}
      {status === 'loading' && (
        <div className="loading-center" style={{ flexDirection: 'column', gap: 10, height: 560, background: '#0a1628', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div className="spinner" />
          <div style={{ color: 'var(--slate)', fontSize: 13 }}>Loading hospital network...</div>
        </div>
      )}

      {status === 'error' && (
        <div style={{ height: 560, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a1628', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--red)', marginBottom: 12 }}>⚠ {message}</div>
          <button className="btn btn-outline" onClick={load} style={{ fontSize: 13 }}>Retry</button>
        </div>
      )}

      {status === 'empty' && (
        <div style={{ height: 560, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a1628', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏥</div>
          <div style={{ color: 'var(--slate)', fontSize: 14 }}>{message}</div>
        </div>
      )}

      {status === 'ready' && message && (
        <div style={{ padding: '8px 12px', background: 'rgba(245,158,11,0.1)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.2)', fontSize: 12, color: '#f59e0b', marginBottom: 8 }}>
          ⚠ {message}
        </div>
      )}

      <svg
        ref={svgRef}
        style={{
          borderRadius: 12, border: '1px solid var(--border)',
          display: status === 'ready' ? 'block' : 'none',
          width: '100%', cursor: 'grab',
        }}
      />

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed', left: tooltip.x + 14, top: tooltip.y - 80,
          background: 'var(--navy-light)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '12px 16px', pointerEvents: 'none',
          zIndex: 9999, boxShadow: 'var(--shadow)', minWidth: 220, maxWidth: 280,
        }}>
          <div style={{ fontWeight: 600, marginBottom: 3, fontSize: 14 }}>{tooltip.h.name || tooltip.h.id}</div>
          <div style={{ fontSize: 12, color: 'var(--slate)', marginBottom: 6 }}>
            {tooltip.h.location?.city}{tooltip.h.location?.city && tooltip.h.location?.state ? ', ' : ''}{tooltip.h.location?.state}
          </div>
          <div style={{ fontSize: 12 }}>
            <span style={{ color: '#10b981' }}>Available: {tooltip.h.beds?.available ?? '?'}</span>
            {' / '}
            <span style={{ color: 'var(--slate)' }}>Total: {tooltip.h.beds?.total ?? '?'}</span>
          </div>
          {tooltip.h.fees?.opd > 0 && (
            <div style={{ fontSize: 12, color: 'var(--teal)', marginTop: 4 }}>
              OPD: ₹{tooltip.h.fees.opd} · ICU: ₹{tooltip.h.fees.icu}/day
            </div>
          )}
          {tooltip.h.specialties?.length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--slate)', marginTop: 4 }}>
              {tooltip.h.specialties.slice(0, 3).join(' · ')}
            </div>
          )}
          <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)', marginTop: 6, fontFamily: 'monospace' }}>
            {tooltip.h.id}
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphViz;