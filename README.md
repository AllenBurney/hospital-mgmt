# 🏥 MediGraph — Distributed Hospital Management System
### MERN Stack + Graph Algorithm (Dijkstra's)

---

## 📐 Architecture Overview

```
Patient Location (lat/lng)
        │
        ▼
MongoDB $near → Nearest Hospital Node
        │
        ▼
Load HospitalGraph edges (adjacency list)
        │
        ▼
Dijkstra's Algorithm (O(E log V))
        │  Apply filters: bedType, specialty, maxFee, ICU
        ▼
Ranked list of nearest matching hospitals
        │
        ▼
Return hospitals + doctors + path + distance
```

---

## 🗄️ MongoDB Collections (Mongoose Schemas)

### 1. `users` collection — `User.js`
```
_id          ObjectId
name         String (required)
email        String (unique, required)
password     String (hashed, select:false)
role         enum: patient | hospital_admin | super_admin
phone        String
location     GeoJSON Point { coordinates: [lng, lat], address, city, state }
hospital     ref → Hospital (for hospital_admin)
isActive     Boolean
lastLogin    Date
```
**Index:** `location: '2dsphere'` (for patient geo queries)

---

### 2. `hospitals` collection — `Hospital.js`
```
_id                  ObjectId
name                 String (required)
registrationNumber   String (unique)
type                 enum: government | private | trust | clinic
nodeId               String (unique graph identifier, e.g. "H001")
location             GeoJSON Point + address/city/state/pincode
contact              { phone, email, website, emergencyPhone }
beds: {
  total              Number
  available          Number
  icu:               { total, available }
  emergency:         { total, available }
  general:           { total, available }
  private:           { total, available }
}
fees: {
  opd                Number  (outpatient consultation fee)
  ipd                Number  (general ward per day)
  ipdPrivate         Number  (private room per day)
  icu                Number  (ICU per day)
  emergency          Number  (emergency admission)
  surgery:           { minor, major }
}
specialties          [String]   e.g. ['Cardiology', 'Neurology']
facilities           [String]   e.g. ['MRI', 'ICU', 'Blood Bank']
rating               { average: Number, count: Number }
isActive             Boolean
isVerified           Boolean
admin                ref → User
lastUpdated          Date
```
**Indexes:**
- `location: '2dsphere'` — for $near and $geoWithin queries
- `beds.available: 1` — for bed availability filtering
- `isActive: 1, isVerified: 1` — for active hospital queries

---

### 3. `hospitalgraphs` collection — `HospitalGraph.js`  ⬡ THE GRAPH EDGES
```
_id                ObjectId
fromHospital       ref → Hospital
fromNodeId         String (graph node ID)
toHospital         ref → Hospital
toNodeId           String (graph node ID)
distanceKm         Number (road distance, edge weight)
travelTimeMinutes  Number (estimated travel time, alt weight)
roadType           enum: highway | arterial | local | express
isActive           Boolean
```
**Indexes:**
- `fromHospital: 1`
- `toHospital: 1`
- `fromNodeId + toNodeId: unique` — prevents duplicate edges

**Graph Structure:**
- Each edge is stored twice (A→B and B→A) for bidirectional traversal
- Dijkstra's reads all edges once, builds adjacency Map, runs shortest path
- Edge weight can be `distanceKm` or `travelTimeMinutes` based on user preference

---

### 4. `doctors` collection — `Doctor.js`
```
_id                  ObjectId
user                 ref → User (optional, if doctor has login)
hospital             ref → Hospital (required)
name                 String
registrationNumber   String (unique medical registration)
specialization       String (e.g. 'Cardiology')
subSpecialization    String
qualifications       [String]  e.g. ['MBBS', 'MD', 'DM']
experience           Number (years)
contact              { phone, email }
fees: {
  consultation       Number
  followUp           Number
}
schedule: [{
  day               enum: Monday–Sunday
  startTime         String  "09:00"
  endTime           String  "17:00"
  slotDuration      Number (minutes, default 30)
  isWorking         Boolean
  maxPatients       Number
}]
availableSlotsToday  Number (dynamically updated)
isAvailable          Boolean
isActive             Boolean
rating               { average, count }
photo                String (URL)
```

---

### 5. `appointments` collection — `Appointment.js`
```
_id               ObjectId
patient           ref → User
doctor            ref → Doctor
hospital          ref → Hospital
appointmentDate   Date
slotTime          String  "10:30"
type              enum: opd | emergency | followup | teleconsult
status            enum: pending | confirmed | in-progress | completed | cancelled | no-show
symptoms          String
notes             String (doctor's post-appointment notes)
diagnosis         String
prescription: [{
  medicine        String
  dosage          String
  duration        String
  notes           String
}]
fee               Number
paymentStatus     enum: pending | paid | refunded
referredFrom      ref → Hospital (if transferred)
cancellationReason String
```
**Indexes:**
- `patient + appointmentDate: -1` — patient history
- `doctor + appointmentDate: 1` — doctor schedule
- `hospital + status: 1` — hospital dashboard

---

### 6. `beds` collection — `Bed.js`
```
_id                ObjectId
hospital           ref → Hospital
bedNumber          String  "B001"
ward               String  "Ward-A", "ICU-1"
type               enum: general | private | icu | emergency | pediatric | maternity
floor              Number
status             enum: available | occupied | maintenance | reserved
currentPatient     ref → User
admissionDate      Date
expectedDischarge  Date
features           [String]  e.g. ['oxygen', 'ventilator', 'monitor']
pricePerDay        Number
notes              String
```
**Index:** `hospital + status + type: 1` (for bed search queries)

---

### 7. `admissions` collection — `Admission.js`
```
_id                ObjectId
patient            ref → User
hospital           ref → Hospital
bed                ref → Bed
admittingDoctor    ref → Doctor
admissionDate      Date
dischargeDate      Date
admissionType      enum: emergency | planned | transfer
status             enum: admitted | discharged | transferred | deceased
diagnosis          String
billing: {
  bedCharges       Number
  doctorCharges    Number
  medicineCharges  Number
  testCharges      Number
  otherCharges     Number
  total            Number
  paid             Number
  due              Number
}
paymentStatus      enum: pending | partial | paid
transferredTo      ref → Hospital
notes: [{
  note             String
  addedBy          ref → User
  addedAt          Date
}]
```

---

### 8. `reviews` collection — `Review.js`
```
_id           ObjectId
patient       ref → User
targetType    enum: hospital | doctor
hospital      ref → Hospital
doctor        ref → Doctor
rating        Number (1–5)
comment       String
isVerified    Boolean (patient actually visited)
appointment   ref → Appointment
```

---

## 🔗 API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register patient or hospital admin |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/update-location` | Update patient GPS location |

### Hospitals
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/hospitals` | List all hospitals (filters: city, type, specialty) |
| POST | `/api/hospitals` | Create hospital (admin only) |
| GET | `/api/hospitals/:id` | Hospital details + doctors + bed stats |
| PUT | `/api/hospitals/:id` | Update hospital info |
| PUT | `/api/hospitals/:id/beds` | Update bed availability |
| **GET** | **`/api/hospitals/nearby/graph`** | **🔍 Dijkstra graph-based search** |
| GET | `/api/hospitals/nearby/geo` | Simple MongoDB geo $near search |
| GET | `/api/hospitals/graph/edges` | All graph edges (for visualization) |
| POST | `/api/hospitals/graph/edge` | Add edge between two hospitals |

### Graph Search Query Params
```
lng=77.2090&lat=28.5672    Patient coordinates
bedType=icu                Filter: general|private|icu|emergency
specialty=Cardiology       Filter by specialty
maxOpdFee=1000             Max outpatient fee
maxIpdFee=5000             Max inpatient daily fee
requireICU=true            Must have ICU beds
topN=10                    Number of results
weightKey=distanceKm       Route by: distanceKm | travelTimeMinutes
```

### Doctors
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/doctors` | List doctors (filters: hospital, specialization, available) |
| GET | `/api/doctors/:id` | Doctor details |
| GET | `/api/doctors/:id/slots?date=YYYY-MM-DD` | Available appointment slots |
| POST | `/api/doctors` | Add doctor (hospital admin) |
| PUT | `/api/doctors/:id` | Update doctor |

### Appointments
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/appointments` | Book appointment |
| GET | `/api/appointments/my` | Patient's appointments |
| GET | `/api/appointments/hospital/:id` | Hospital's appointments (admin) |
| PUT | `/api/appointments/:id/status` | Update status |
| DELETE | `/api/appointments/:id` | Cancel appointment |

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone <repo>
cd hospital-mgmt
npm run install-all
```

### 2. Configure Environment
```bash
cd backend
cp .env.example .env
# Edit .env: set MONGO_URI and JWT_SECRET
```

### 3. Seed Database
```bash
npm run seed
# Creates 6 hospitals, 10 graph edges, 5 doctors, 20 beds
```

### 4. Run Development
```bash
# Terminal 1 - Backend (port 5000)
npm run dev-backend

# Terminal 2 - Frontend (port 3000)
npm run dev-frontend
```

### 5. Open App
Visit: `http://localhost:3000`

---

## ⬡ Graph Algorithm Details

The `graphAlgorithm.js` utility implements:

1. **MinHeap** — O(log n) priority queue for Dijkstra's
2. **buildAdjacencyList()** — Converts DB edges to Map<nodeId, neighbors[]>
3. **dijkstra()** — Classic shortest path with configurable edge weight
4. **reconstructPath()** — Traces back the shortest path for UI display
5. **findNearestHospitals()** — Full pipeline with hospital filters

**Time Complexity:** O((V + E) log V) where V = hospitals, E = road connections

---

## 🏗 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, D3.js (graph viz), Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Graph | Custom Dijkstra implementation (no external lib) |
| Maps | MongoDB 2dsphere index for geo queries |
| Styling | Custom CSS (DM Serif Display + DM Sans fonts) |
