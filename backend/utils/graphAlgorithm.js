/**
 * GRAPH UTILITIES
 * Dijkstra's algorithm for finding nearest hospitals.
 * Supports filtering by: bed availability, doctor specialty, max fees.
 */

class MinHeap {
  constructor() {
    this.heap = [];
  }
  push(item) {
    this.heap.push(item);
    this._bubbleUp(this.heap.length - 1);
  }
  pop() {
    const top = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return top;
  }
  isEmpty() {
    return this.heap.length === 0;
  }
  _bubbleUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent].dist <= this.heap[i].dist) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }
  _sinkDown(i) {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.heap[l].dist < this.heap[smallest].dist) smallest = l;
      if (r < n && this.heap[r].dist < this.heap[smallest].dist) smallest = r;
      if (smallest === i) break;
      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
      i = smallest;
    }
  }
}

/**
 * Build adjacency list from HospitalGraph edges.
 * @param {Array} edges - Array of HospitalGraph documents
 * @returns {Map} nodeId → [{toNodeId, distanceKm, travelTimeMinutes, toHospitalId}]
 */
function buildAdjacencyList(edges) {
  const adj = new Map();
  for (const edge of edges) {
    if (!edge.isActive) continue;
    if (!adj.has(edge.fromNodeId)) adj.set(edge.fromNodeId, []);
    adj.get(edge.fromNodeId).push({
      toNodeId: edge.toNodeId,
      toHospitalId: edge.toHospital.toString(),
      distanceKm: edge.distanceKm,
      travelTimeMinutes: edge.travelTimeMinutes,
    });
  }
  return adj;
}

/**
 * Dijkstra's shortest path from a source node.
 * @param {string} sourceNodeId - Starting node (patient's nearest hospital or pseudo-node)
 * @param {Map} adjacencyList - Built by buildAdjacencyList
 * @param {string} weightKey - 'distanceKm' or 'travelTimeMinutes'
 * @returns {Map} nodeId → { dist, prev, hospitalId }
 */
function dijkstra(sourceNodeId, adjacencyList, weightKey = 'distanceKm') {
  const dist = new Map();
  const prev = new Map();
  const visited = new Set();
  const pq = new MinHeap();

  dist.set(sourceNodeId, 0);
  pq.push({ nodeId: sourceNodeId, dist: 0 });

  while (!pq.isEmpty()) {
    const { nodeId, dist: currentDist } = pq.pop();
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    const neighbors = adjacencyList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      const newDist = currentDist + neighbor[weightKey];
      if (!dist.has(neighbor.toNodeId) || newDist < dist.get(neighbor.toNodeId)) {
        dist.set(neighbor.toNodeId, newDist);
        prev.set(neighbor.toNodeId, { from: nodeId, hospitalId: neighbor.toHospitalId });
        pq.push({ nodeId: neighbor.toNodeId, dist: newDist });
      }
    }
  }

  return { dist, prev };
}

/**
 * Reconstruct path from source to target using prev map.
 */
function reconstructPath(targetNodeId, prev) {
  const path = [];
  let current = targetNodeId;
  while (prev.has(current)) {
    const { from, hospitalId } = prev.get(current);
    path.unshift({ nodeId: current, hospitalId });
    current = from;
  }
  path.unshift({ nodeId: current, hospitalId: null }); // source
  return path;
}

/**
 * Find N nearest hospitals with optional filters.
 * @param {string} sourceNodeId
 * @param {Array} allHospitals - populated Hospital documents (with nodeId)
 * @param {Array} edges - HospitalGraph edge documents
 * @param {Object} filters - { bedType, specialty, maxOpdFee, maxIpdFee, requireICU }
 * @param {number} topN - max results
 * @param {string} weightKey - 'distanceKm' | 'travelTimeMinutes'
 */
function findNearestHospitals({
  sourceNodeId,
  allHospitals,
  edges,
  filters = {},
  topN = 10,
  weightKey = 'distanceKm',
}) {
  const adj = buildAdjacencyList(edges);
  const { dist, prev } = dijkstra(sourceNodeId, adj, weightKey);

  // Map nodeId → hospital for lookup
  const nodeToHospital = new Map();
  for (const h of allHospitals) {
    nodeToHospital.set(h.nodeId, h);
  }

  const results = [];

  for (const [nodeId, distance] of dist.entries()) {
    if (nodeId === sourceNodeId) continue;
    const hospital = nodeToHospital.get(nodeId);
    if (!hospital || !hospital.isActive || !hospital.isVerified) continue;

    // Apply filters
    if (filters.bedType) {
      const bedStat = hospital.beds[filters.bedType];
      if (!bedStat || bedStat.available <= 0) continue;
    } else {
      if (hospital.beds.available <= 0) continue; // default: must have some bed
    }

    if (filters.requireICU && hospital.beds.icu.available <= 0) continue;

    if (filters.maxOpdFee && hospital.fees.opd > filters.maxOpdFee) continue;
    if (filters.maxIpdFee && hospital.fees.ipd > filters.maxIpdFee) continue;

    if (filters.specialty) {
      const hasSpecialty = hospital.specialties.some(
        (s) => s.toLowerCase().includes(filters.specialty.toLowerCase())
      );
      if (!hasSpecialty) continue;
    }

    const path = reconstructPath(nodeId, prev);

    results.push({
      hospital,
      distance,
      path,
      travelTimeMinutes: weightKey === 'travelTimeMinutes' ? distance : null,
    });
  }

  // Sort by distance ascending
  results.sort((a, b) => a.distance - b.distance);

  return results.slice(0, topN);
}

module.exports = { findNearestHospitals, dijkstra, buildAdjacencyList, reconstructPath };
