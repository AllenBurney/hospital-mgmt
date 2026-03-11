/**
 * REAL HOSPITAL DATA IMPORT SCRIPT
 * Source: National Hospital Directory with Geo Code (data.gov.in)
 *
 * Usage:
 *   node utils/importHospitals.js                        → imports ALL hospitals (with coords)
 *   node utils/importHospitals.js --state "West Bengal"  → West Bengal (uses district fallback coords)
 *   node utils/importHospitals.js --state "Karnataka"    → Karnataka
 *   node utils/importHospitals.js --state "Gujarat"      → Gujarat
 *   node utils/importHospitals.js --limit 500            → max 500
 *   node utils/importHospitals.js --state "Maharashtra" --limit 300
 *   node utils/importHospitals.js --clear                → clears existing hospitals first
 */

const mongoose = require('mongoose');
const fs       = require('fs');
const path     = require('path');
const readline = require('readline');
const dotenv   = require('dotenv');
dotenv.config();

const Hospital      = require('../models/Hospital');
const HospitalGraph = require('../models/HospitalGraph');

// ── CLI args ──────────────────────────────────────────────────────
const args   = process.argv.slice(2);
const getArg = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i+1] : null; };
const STATE  = getArg('--state');
const LIMIT  = parseInt(getArg('--limit') || '99999');
const CLEAR  = args.includes('--clear');
const CSV_PATH = path.join(__dirname, '..', 'hospital_directory.csv');

// ── District-level fallback GPS coordinates ───────────────────────
// Used when CSV row has no coordinates
const DISTRICT_COORDS = {
  // West Bengal
  'Kolkata':           [88.3639, 22.5726],
  'Howrah':            [88.2636, 22.5958],
  'Hooghly':           [88.3832, 22.9072],
  'North 24 Parganas': [88.4278, 22.8593],
  '24 Pargs (N)':      [88.4278, 22.8593],
  'South 24 Parganas': [88.4524, 22.1527],
  'Nadia':             [88.5563, 23.4700],
  'Murshidabad':       [88.2741, 24.1826],
  'Bardhaman':         [87.8615, 23.2324],
  'Birbhum':           [87.5353, 23.8903],
  'Bankura':           [87.0699, 23.2304],
  'Purulia':           [86.3640, 23.3316],
  'Medinipur East':    [87.8197, 22.4273],
  'Medinipur West':    [87.2758, 22.4273],
  'Malda':             [88.1434, 25.0108],
  'Dinajpur Uttar':    [88.4338, 25.6273],
  'Dinajpur Dakshin':  [88.3338, 25.3273],
  'Jalpaiguri':        [88.7280, 26.5438],
  'Darjeeling':        [88.2627, 27.0360],
  'Cooch Behar':       [89.4432, 26.3452],
  // Delhi
  'New Delhi':         [77.2090, 28.6139],
  'Central Delhi':     [77.2167, 28.6508],
  'North Delhi':       [77.2219, 28.7041],
  'South Delhi':       [77.2167, 28.5245],
  'East Delhi':        [77.2956, 28.6408],
  'West Delhi':        [77.1025, 28.6542],
  // Uttar Pradesh
  'Lucknow':           [80.9462, 26.8467],
  'Agra':              [78.0081, 27.1767],
  'Varanasi':          [82.9739, 25.3176],
  'Kanpur Nagar':      [80.3319, 26.4499],
  'Allahabad':         [81.8463, 25.4358],
  'Meerut':            [77.7064, 28.9845],
  'Ghaziabad':         [77.4538, 28.6692],
  'Noida':             [77.3910, 28.5355],
  // Tamil Nadu
  'Chennai':           [80.2707, 13.0827],
  'Coimbatore':        [76.9558, 11.0168],
  'Madurai':           [78.1198, 9.9252],
  'Tiruchirappalli':   [78.6868, 10.7905],
  'Salem':             [78.1460, 11.6643],
  // Rajasthan
  'Jaipur':            [75.7873, 26.9124],
  'Jodhpur':           [73.0243, 26.2389],
  'Udaipur':           [73.6833, 24.5854],
  'Kota':              [75.8648, 25.2138],
  // Punjab
  'Ludhiana':          [75.8573, 30.9010],
  'Amritsar':          [74.8723, 31.6340],
  'Jalandhar':         [75.5762, 31.3260],
  'Patiala':           [76.3869, 30.3398],
  // Telangana
  'Hyderabad':         [78.4867, 17.3850],
  'Rangareddy':        [78.3930, 17.2427],
  'Medchal':           [78.5485, 17.6287],
  'Warangal':          [79.5941, 17.9784],
  // Odisha
  'Khordha':           [85.8245, 20.1733],
  'Cuttack':           [85.8830, 20.4625],
  'Ganjam':            [84.7941, 19.3870],
  'Sundargarh':        [84.0291, 22.1166],
  // Generic fallbacks by state
  'West Bengal':       [88.3639, 22.5726],
  'Delhi':             [77.2090, 28.6139],
  'Uttar Pradesh':     [80.9462, 26.8467],
  'Tamil Nadu':        [80.2707, 13.0827],
  'Rajasthan':         [75.7873, 26.9124],
  'Punjab':            [75.8573, 30.9010],
  'Telangana':         [78.4867, 17.3850],
  'Odisha':            [85.8245, 20.1733],
  'Bihar':             [85.3131, 25.0961],
  'Jharkhand':         [85.2799, 23.6102],
  'Assam':             [91.7362, 26.2006],
  'Chhattisgarh':      [81.6296, 21.2787],
  'Himachal Pradesh':  [77.1734, 31.1048],
  'Uttarakhand':       [79.0193, 30.0668],
  'Goa':               [74.1240, 15.2993],
  'Manipur':           [93.9063, 24.6637],
  'Meghalaya':         [91.3662, 25.4670],
  'Tripura':           [91.9882, 23.9408],
  'Nagaland':          [94.5624, 26.1584],
  'Mizoram':           [92.7176, 23.1645],
  'Arunachal Pradesh': [94.7278, 28.2180],
  'Sikkim':            [88.5122, 27.5330],
};

// Add small random offset so hospitals in same district don't stack on exact same point
function addJitter(coords) {
  return [
    coords[0] + (Math.random() - 0.5) * 0.12,  // ±~6km longitude
    coords[1] + (Math.random() - 0.5) * 0.10,  // ±~5km latitude
  ];
}

function getCoords(row) {
  // Try real coordinates first
  const str = row.Location_Coordinates;
  if (str && str.trim() && str !== '0') {
    const parts = str.split(',').map(s => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const [lat, lng] = parts;
      if (lat >= 6 && lat <= 38 && lng >= 68 && lng <= 98) {
        return [lng, lat]; // GeoJSON [lng, lat]
      }
    }
  }
  // Fallback: use district coords + jitter
  const district = row.District?.trim();
  const state    = row.State?.trim();
  if (district && DISTRICT_COORDS[district]) return addJitter(DISTRICT_COORDS[district]);
  if (state    && DISTRICT_COORDS[state])    return addJitter(DISTRICT_COORDS[state]);
  return null; // truly unknown
}

function mapType(category, caretype) {
  const c = (category + ' ' + caretype).toLowerCase();
  if (c.includes('government') || c.includes('public') || c.includes('govt')) return 'government';
  if (c.includes('private'))  return 'private';
  if (c.includes('trust') || c.includes('ngo') || c.includes('charitable')) return 'trust';
  if (c.includes('clinic'))   return 'clinic';
  return 'private';
}

function parseList(str) {
  if (!str || str === '0') return [];
  return str.split(/[,;|]/).map(s => s.trim()).filter(s => s.length > 1 && s !== '0');
}

function cleanPhone(str) {
  if (!str || str === '0') return '';
  return str.split(',')[0].trim();
}

function estimateBeds(totalStr, type) {
  const total = parseInt(totalStr) || 0;
  if (total > 0) {
    const icu       = Math.max(1, Math.round(total * 0.05));
    const emergency = Math.max(1, Math.round(total * 0.04));
    const private_  = Math.round(total * 0.20);
    const general   = total - icu - emergency - private_;
    const avail     = Math.round(total * (0.15 + Math.random() * 0.25));
    return {
      total, available: avail,
      icu:       { total: icu,       available: Math.round(icu * 0.3) },
      emergency: { total: emergency, available: Math.round(emergency * 0.4) },
      general:   { total: general,   available: Math.round(general * 0.2) },
      private:   { total: private_,  available: Math.round(private_ * 0.15) },
    };
  }
  const sizes = { government: 200, private: 80, trust: 100, clinic: 20 };
  const t   = (sizes[type] || 80) + Math.floor(Math.random() * 60);
  const avail = Math.round(t * (0.1 + Math.random() * 0.3));
  return {
    total: t, available: avail,
    icu:       { total: Math.round(t*0.05), available: Math.max(0, Math.round(t*0.015)) },
    emergency: { total: Math.round(t*0.04), available: Math.max(0, Math.round(t*0.012)) },
    general:   { total: Math.round(t*0.70), available: Math.round(avail*0.7) },
    private:   { total: Math.round(t*0.21), available: Math.round(avail*0.3) },
  };
}

function estimateFees(type) {
  const base = {
    government: { opd: 30,  ipd: 300,  ipdPrivate: 1500, icu: 5000,  emergency: 100,  minor: 3000,  major: 30000  },
    private:    { opd: 800, ipd: 3000, ipdPrivate: 8000, icu: 18000, emergency: 2000, minor: 25000, major: 150000 },
    trust:      { opd: 200, ipd: 800,  ipdPrivate: 3000, icu: 8000,  emergency: 500,  minor: 8000,  major: 60000  },
    clinic:     { opd: 400, ipd: 1500, ipdPrivate: 3000, icu: 10000, emergency: 1000, minor: 10000, major: 50000  },
  };
  const f    = base[type] || base.private;
  const vary = (v) => Math.round(v * (0.8 + Math.random() * 0.4));
  return {
    opd: vary(f.opd), ipd: vary(f.ipd), ipdPrivate: vary(f.ipdPrivate),
    icu: vary(f.icu), emergency: vary(f.emergency),
    surgery: { minor: vary(f.minor), major: vary(f.major) },
  };
}

const DEFAULT_SPECIALTIES = {
  government: ['General Medicine', 'General Surgery', 'Pediatrics', 'Gynecology', 'Orthopedics'],
  private:    ['General Medicine', 'General Surgery', 'Cardiology', 'Orthopedics'],
  trust:      ['General Medicine', 'Pediatrics', 'Gynecology'],
  clinic:     ['General Medicine'],
};

// ── CSV Parser ────────────────────────────────────────────────────
async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath, { encoding: 'utf-8' }),
      crlfDelay: Infinity,
    });
    let headers = null;
    let lineNum  = 0;
    rl.on('line', (line) => {
      lineNum++;
      const cols = [];
      let current = ''; let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === ',' && !inQuotes) { cols.push(current); current = ''; }
        else { current += ch; }
      }
      cols.push(current);
      if (lineNum === 1) { headers = cols.map(h => h.replace(/"/g, '').trim()); return; }
      if (!headers) return;
      const row = {};
      headers.forEach((h, i) => { row[h] = (cols[i] || '').replace(/"/g, '').trim(); });
      results.push(row);
    });
    rl.on('close', () => resolve(results));
    rl.on('error', reject);
  });
}

// ── Graph edges via proximity ─────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2-lat1)*Math.PI/180;
  const dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function generateGraphEdges(hospitals) {
  const edges = []; const seen = new Set();
  const byDistrict = {};
  for (const h of hospitals) {
    const key = `${h.location.state}|${h.location.city}`;
    if (!byDistrict[key]) byDistrict[key] = [];
    byDistrict[key].push(h);
  }
  for (const group of Object.values(byDistrict)) {
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i++) {
      const [lngA, latA] = group[i].location.coordinates;
      const dists = group
        .map((h, j) => {
          if (i === j) return null;
          const [lngB, latB] = h.location.coordinates;
          return { dist: haversine(latA, lngA, latB, lngB), hospital: h };
        })
        .filter(Boolean)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 3);
      for (const { dist, hospital } of dists) {
        const key = [group[i].nodeId, hospital.nodeId].sort().join('|');
        if (seen.has(key) || dist > 50) continue;
        seen.add(key);
        const time = Math.round((dist / 40) * 60);
        const road = dist < 5 ? 'local' : dist < 15 ? 'arterial' : 'highway';
        edges.push({ fromHospital: group[i]._id, fromNodeId: group[i].nodeId, toHospital: hospital._id,   toNodeId: hospital.nodeId, distanceKm: +dist.toFixed(2), travelTimeMinutes: time, roadType: road });
        edges.push({ fromHospital: hospital._id,  fromNodeId: hospital.nodeId, toHospital: group[i]._id, toNodeId: group[i].nodeId,  distanceKm: +dist.toFixed(2), travelTimeMinutes: time, roadType: road });
      }
    }
  }
  return edges;
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  try {
    if (!fs.existsSync(CSV_PATH)) {
      console.error(`❌ CSV not found at: ${CSV_PATH}`);
      console.error('   Place hospital_directory.csv inside the backend/ folder');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    if (CLEAR) {
      await Promise.all([Hospital.deleteMany({}), HospitalGraph.deleteMany({})]);
      console.log('🗑️  Cleared existing hospitals and graph edges');
    }

    console.log('📖 Reading CSV...');
    const rows = await parseCSV(CSV_PATH);
    console.log(`   Found ${rows.length} rows in CSV`);

    let filtered = STATE
      ? rows.filter(r => r.State?.toLowerCase().includes(STATE.toLowerCase()))
      : rows;

    if (STATE) console.log(`   Filtered to ${filtered.length} rows for state: "${STATE}"`);

    // Try to get coordinates (real or fallback)
    const withCoords = filtered.filter(r => getCoords(r) !== null);
    const noCoords   = filtered.length - withCoords.length;
    console.log(`   ${withCoords.length} rows have GPS coordinates (${noCoords} skipped — no coords or fallback)`);

    filtered = withCoords.slice(0, LIMIT);
    if (withCoords.length > LIMIT) console.log(`   Limited to ${LIMIT} hospitals`);

    if (filtered.length === 0) {
      console.error('❌ No valid rows found.');
      process.exit(1);
    }

    console.log('\n🏥 Building hospital documents...');
    const hospitalDocs = [];
    const usedRegNums  = new Set();
    const usedNodeIds  = new Set();

    for (let i = 0; i < filtered.length; i++) {
      const row   = filtered[i];
      const coords = getCoords(row);
      const type  = mapType(row.Hospital_Category, row.Hospital_Care_Type);

      let regNum = row.Hospital_Regis_Number?.trim();
      if (!regNum || regNum === '0' || usedRegNums.has(regNum)) {
        regNum = `REG-${(row.State_ID||'XX').padStart(2,'0')}-${(row.District_ID||'00').padStart(3,'0')}-${i+1}`;
      }
      usedRegNums.add(regNum);

      let nodeId = `H${String(i+1).padStart(6,'0')}`;
      while (usedNodeIds.has(nodeId)) nodeId = `H${String(i+100000+Math.floor(Math.random()*10000)).padStart(6,'0')}`;
      usedNodeIds.add(nodeId);

      const specialties = parseList(row.Specialties);
      const facilities  = parseList(row.Facilities);

      hospitalDocs.push({
        name:               row.Hospital_Name || `Hospital ${i+1}`,
        registrationNumber: regNum,
        type,
        nodeId,
        location: {
          type: 'Point', coordinates: coords,
          address: row.Address_Original_First_Line || row.Location || '',
          city:    row.District || '',
          state:   row.State    || '',
          pincode: row.Pincode  || '',
        },
        contact: {
          phone:          cleanPhone(row.Telephone),
          email:          row.Hospital_Primary_Email_Id !== '0' ? row.Hospital_Primary_Email_Id : '',
          emergencyPhone: cleanPhone(row.Emergency_Num),
          website:        row.Website !== '0' ? row.Website : '',
        },
        beds:        estimateBeds(row.Total_Num_Beds, type),
        fees:        estimateFees(type),
        specialties: specialties.length > 0 ? specialties : DEFAULT_SPECIALTIES[type],
        facilities:  facilities.length  > 0 ? facilities  : [],
        rating: {
          average: parseFloat((3.5 + Math.random() * 1.4).toFixed(1)),
          count:   Math.floor(Math.random() * 500) + 10,
        },
        isActive: true, isVerified: true, lastUpdated: new Date(),
      });
    }

    // Insert in batches of 500
    console.log(`\n💾 Inserting ${hospitalDocs.length} hospitals...`);
    const BATCH = 500;
    let inserted = 0;
    const createdHospitals = [];
    for (let i = 0; i < hospitalDocs.length; i += BATCH) {
      const batch  = hospitalDocs.slice(i, i + BATCH);
      const result = await Hospital.insertMany(batch, { ordered: false });
      createdHospitals.push(...result);
      inserted += result.length;
      process.stdout.write(`\r   Inserted ${inserted}/${hospitalDocs.length}...`);
    }
    console.log(`\n✅ Inserted ${inserted} hospitals`);

    // Generate graph edges
    console.log('\n⬡  Generating graph edges...');
    const edges = generateGraphEdges(createdHospitals);
    console.log(`   Generated ${edges.length} edges`);
    if (edges.length > 0) {
      let edgesInserted = 0;
      for (let i = 0; i < edges.length; i += 1000) {
        await HospitalGraph.insertMany(edges.slice(i, i+1000), { ordered: false });
        edgesInserted += Math.min(1000, edges.length - i);
        process.stdout.write(`\r   Inserted ${edgesInserted}/${edges.length} edges...`);
      }
      console.log(`\n✅ Inserted ${edgesInserted} graph edges`);
    }

    console.log('\n─────────────────────────────────────────');
    console.log('🎉 Import complete!');
    console.log(`   Hospitals   : ${inserted}`);
    console.log(`   Graph edges : ${edges.length}`);
    if (STATE) console.log(`   State       : ${STATE}`);
    console.log('─────────────────────────────────────────');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

main();