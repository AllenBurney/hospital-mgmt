/**
 * SEED SCRIPT
 * Run: node utils/seed.js
 * Populates DB with sample hospitals, doctors, graph edges
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Hospital = require('../models/Hospital');
const HospitalGraph = require('../models/HospitalGraph');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Bed = require('../models/Bed');

const hospitals = [
  {
    name: 'AIIMS Delhi',
    registrationNumber: 'REG-DL-001',
    type: 'government',
    nodeId: 'H001',
    location: { type: 'Point', coordinates: [77.2090, 28.5672], address: 'Ansari Nagar', city: 'Delhi', state: 'Delhi' },
    contact: { phone: '011-26588500', email: 'info@aiims.edu', emergencyPhone: '011-26589400' },
    beds: { total: 2000, available: 320, icu: { total: 100, available: 18 }, emergency: { total: 80, available: 12 }, general: { total: 1200, available: 200 }, private: { total: 620, available: 90 } },
    fees: { opd: 50, ipd: 500, ipdPrivate: 2500, icu: 8000, emergency: 300, surgery: { minor: 5000, major: 50000 } },
    specialties: ['Cardiology', 'Neurology', 'Oncology', 'Orthopedics', 'Nephrology', 'Gastroenterology'],
    facilities: ['MRI', 'CT Scan', 'ICU', 'NICU', 'Blood Bank', 'Dialysis', 'Cath Lab'],
    rating: { average: 4.5, count: 2340 },
    isVerified: true,
  },
  {
    name: 'Safdarjung Hospital',
    registrationNumber: 'REG-DL-002',
    type: 'government',
    nodeId: 'H002',
    location: { type: 'Point', coordinates: [77.1989, 28.5706], address: 'Safdarjung', city: 'Delhi', state: 'Delhi' },
    contact: { phone: '011-26198888', emergencyPhone: '011-26197777' },
    beds: { total: 1800, available: 210, icu: { total: 80, available: 10 }, emergency: { total: 60, available: 8 }, general: { total: 1100, available: 150 }, private: { total: 560, available: 42 } },
    fees: { opd: 30, ipd: 400, ipdPrivate: 2000, icu: 6000, emergency: 200, surgery: { minor: 3000, major: 40000 } },
    specialties: ['General Surgery', 'Medicine', 'Pediatrics', 'Obstetrics', 'Orthopedics'],
    facilities: ['ICU', 'Blood Bank', 'X-Ray', 'CT Scan', 'Dialysis'],
    rating: { average: 4.1, count: 1820 },
    isVerified: true,
  },
  {
    name: 'Fortis Hospital Gurgaon',
    registrationNumber: 'REG-HR-001',
    type: 'private',
    nodeId: 'H003',
    location: { type: 'Point', coordinates: [77.0422, 28.4595], address: 'Sector 44', city: 'Gurgaon', state: 'Haryana' },
    contact: { phone: '0124-4921000', emergencyPhone: '0124-4921999' },
    beds: { total: 400, available: 85, icu: { total: 40, available: 6 }, emergency: { total: 30, available: 5 }, general: { total: 200, available: 50 }, private: { total: 130, available: 24 } },
    fees: { opd: 1200, ipd: 5000, ipdPrivate: 12000, icu: 25000, emergency: 3000, surgery: { minor: 30000, major: 200000 } },
    specialties: ['Cardiology', 'Orthopedics', 'Neurology', 'Oncology', 'Urology'],
    facilities: ['Robotic Surgery', 'MRI', 'PET Scan', 'ICU', 'NICU', 'Cath Lab'],
    rating: { average: 4.6, count: 980 },
    isVerified: true,
  },
  {
    name: 'Max Super Speciality Saket',
    registrationNumber: 'REG-DL-003',
    type: 'private',
    nodeId: 'H004',
    location: { type: 'Point', coordinates: [77.2163, 28.5271], address: 'Press Enclave Road, Saket', city: 'Delhi', state: 'Delhi' },
    contact: { phone: '011-26515050', emergencyPhone: '011-26515959' },
    beds: { total: 500, available: 60, icu: { total: 50, available: 4 }, emergency: { total: 40, available: 3 }, general: { total: 250, available: 35 }, private: { total: 160, available: 18 } },
    fees: { opd: 1500, ipd: 6000, ipdPrivate: 15000, icu: 30000, emergency: 4000, surgery: { minor: 40000, major: 250000 } },
    specialties: ['Cardiac Sciences', 'Neurosciences', 'Cancer Care', 'Transplant', 'Orthopedics'],
    facilities: ['Da Vinci Robot', 'Gamma Knife', 'MRI 3T', 'ICU', 'Bone Marrow Transplant'],
    rating: { average: 4.7, count: 1120 },
    isVerified: true,
  },
  {
    name: 'Lok Nayak Hospital',
    registrationNumber: 'REG-DL-004',
    type: 'government',
    nodeId: 'H005',
    location: { type: 'Point', coordinates: [77.2368, 28.6384], address: 'Jawahar Lal Nehru Marg', city: 'Delhi', state: 'Delhi' },
    contact: { phone: '011-23232400', emergencyPhone: '011-23234321' },
    beds: { total: 2200, available: 180, icu: { total: 90, available: 9 }, emergency: { total: 70, available: 6 }, general: { total: 1400, available: 120 }, private: { total: 640, available: 45 } },
    fees: { opd: 20, ipd: 300, ipdPrivate: 1500, icu: 5000, emergency: 100, surgery: { minor: 2000, major: 30000 } },
    specialties: ['Medicine', 'Surgery', 'Psychiatry', 'Dermatology', 'ENT', 'Ophthalmology'],
    facilities: ['ICU', 'Blood Bank', 'CT Scan', 'Dialysis', 'Eye OT'],
    rating: { average: 3.9, count: 2100 },
    isVerified: true,
  },
  {
    name: 'Apollo Hospital Noida',
    registrationNumber: 'REG-UP-001',
    type: 'private',
    nodeId: 'H006',
    location: { type: 'Point', coordinates: [77.3910, 28.5708], address: 'Sector 26', city: 'Noida', state: 'UP' },
    contact: { phone: '0120-4699999', emergencyPhone: '0120-4699911' },
    beds: { total: 300, available: 45, icu: { total: 30, available: 3 }, emergency: { total: 25, available: 4 }, general: { total: 160, available: 28 }, private: { total: 85, available: 10 } },
    fees: { opd: 1000, ipd: 4500, ipdPrivate: 11000, icu: 22000, emergency: 2500, surgery: { minor: 25000, major: 180000 } },
    specialties: ['Cardiology', 'Gastroenterology', 'Nephrology', 'Orthopedics', 'Endocrinology'],
    facilities: ['Cath Lab', 'MRI', 'ERCP', 'Dialysis', 'ICU'],
    rating: { average: 4.4, count: 760 },
    isVerified: true,
  },
];

// Graph edges: [fromNodeId, toNodeId, distanceKm, travelTimeMinutes, roadType]
const edges = [
  ['H001', 'H002', 3.2, 15, 'arterial'],
  ['H001', 'H004', 4.8, 20, 'arterial'],
  ['H001', 'H005', 8.1, 30, 'arterial'],
  ['H002', 'H003', 18.5, 45, 'highway'],
  ['H002', 'H004', 4.5, 18, 'arterial'],
  ['H003', 'H004', 16.0, 40, 'highway'],
  ['H004', 'H005', 12.0, 35, 'arterial'],
  ['H005', 'H006', 20.0, 50, 'highway'],
  ['H001', 'H006', 22.0, 55, 'highway'],
  ['H003', 'H006', 30.0, 60, 'highway'],
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing
    await Promise.all([
      Hospital.deleteMany({}),
      HospitalGraph.deleteMany({}),
      Doctor.deleteMany({}),
      Bed.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // Seed hospitals
    const createdHospitals = await Hospital.insertMany(hospitals);
    console.log(`✅ Created ${createdHospitals.length} hospitals`);

    // Map nodeId → _id
    const nodeMap = {};
    for (const h of createdHospitals) nodeMap[h.nodeId] = h._id;

    // Seed graph edges (bidirectional)
    const edgeDocs = [];
    for (const [from, to, dist, time, road] of edges) {
      edgeDocs.push({ fromHospital: nodeMap[from], fromNodeId: from, toHospital: nodeMap[to], toNodeId: to, distanceKm: dist, travelTimeMinutes: time, roadType: road });
      edgeDocs.push({ fromHospital: nodeMap[to], fromNodeId: to, toHospital: nodeMap[from], toNodeId: from, distanceKm: dist, travelTimeMinutes: time, roadType: road });
    }
    await HospitalGraph.insertMany(edgeDocs);
    console.log(`✅ Created ${edgeDocs.length} graph edges`);

    // Seed sample doctors for AIIMS
    const aiims = createdHospitals[0];
    const doctorsData = [
      { name: 'Dr. Priya Sharma', registrationNumber: 'DOC-001', specialization: 'Cardiology', qualifications: ['MBBS', 'MD', 'DM Cardiology'], experience: 15, hospital: aiims._id, fees: { consultation: 800, followUp: 400 }, isAvailable: true, availableSlotsToday: 12, rating: { average: 4.8, count: 340 } },
      { name: 'Dr. Rajesh Kumar', registrationNumber: 'DOC-002', specialization: 'Neurology', qualifications: ['MBBS', 'MD', 'DM Neurology'], experience: 12, hospital: aiims._id, fees: { consultation: 1000, followUp: 500 }, isAvailable: true, availableSlotsToday: 8, rating: { average: 4.7, count: 280 } },
      { name: 'Dr. Anita Verma', registrationNumber: 'DOC-003', specialization: 'Oncology', qualifications: ['MBBS', 'MS', 'MCh'], experience: 18, hospital: aiims._id, fees: { consultation: 1200, followUp: 600 }, isAvailable: false, availableSlotsToday: 0, rating: { average: 4.9, count: 195 } },
      { name: 'Dr. Suresh Patel', registrationNumber: 'DOC-004', specialization: 'Orthopedics', qualifications: ['MBBS', 'MS Ortho'], experience: 10, hospital: createdHospitals[2]._id, fees: { consultation: 1500, followUp: 700 }, isAvailable: true, availableSlotsToday: 15, rating: { average: 4.5, count: 420 } },
      { name: 'Dr. Meera Nair', registrationNumber: 'DOC-005', specialization: 'Cardiology', qualifications: ['MBBS', 'DNB Cardiology'], experience: 8, hospital: createdHospitals[2]._id, fees: { consultation: 1800, followUp: 900 }, isAvailable: true, availableSlotsToday: 10, rating: { average: 4.6, count: 230 } },
    ];

    // Add weekly schedule
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    for (const d of doctorsData) {
      d.schedule = weekdays.map(day => ({ day, startTime: '09:00', endTime: '17:00', slotDuration: 30, isWorking: true, maxPatients: 16 }));
    }

    await Doctor.insertMany(doctorsData);
    console.log(`✅ Created ${doctorsData.length} doctors`);

    // Seed sample beds for AIIMS
    const bedDocs = [];
    const bedTypes = ['general', 'private', 'icu', 'emergency'];
    for (let i = 1; i <= 20; i++) {
      const type = bedTypes[i % 4];
      bedDocs.push({
        hospital: aiims._id,
        bedNumber: `B${i.toString().padStart(3, '0')}`,
        ward: type === 'icu' ? 'ICU-1' : type === 'emergency' ? 'ER' : `Ward-${String.fromCharCode(65 + (i % 4))}`,
        type,
        floor: Math.ceil(i / 5),
        status: i % 5 === 0 ? 'occupied' : 'available',
        pricePerDay: type === 'icu' ? 8000 : type === 'private' ? 2500 : type === 'emergency' ? 3000 : 500,
      });
    }
    await Bed.insertMany(bedDocs);
    console.log(`✅ Created ${bedDocs.length} beds`);

    console.log('\n🎉 Seed complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
