import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

// Attach JWT token
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// Auth
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');
export const updateLocation = (data) => API.put('/auth/update-location', data);

// Hospitals
export const getHospitals = (params) => API.get('/hospitals', { params });
export const getHospital = (id) => API.get(`/hospitals/${id}`);
export const createHospital = (data) => API.post('/hospitals', data);
export const updateHospital = (id, data) => API.put(`/hospitals/${id}`, data);
export const updateBeds = (id, data) => API.put(`/hospitals/${id}/beds`, data);
export const getNearbyGraph = (params) => API.get('/hospitals/nearby/graph', { params });
export const getNearbyGeo = (params) => API.get('/hospitals/nearby/geo', { params });
export const getGraphEdges = () => API.get('/hospitals/graph/edges');
export const addGraphEdge = (data) => API.post('/hospitals/graph/edge', data);

// Doctors
export const getDoctors = (params) => API.get('/doctors', { params });
export const getDoctor = (id) => API.get(`/doctors/${id}`);
export const getDoctorSlots = (id, date) => API.get(`/doctors/${id}/slots`, { params: { date } });
export const createDoctor = (data) => API.post('/doctors', data);

// Appointments
export const bookAppointment = (data) => API.post('/appointments', data);
export const getMyAppointments = () => API.get('/appointments/my');
export const getHospitalAppointments = (hospitalId, params) =>
  API.get(`/appointments/hospital/${hospitalId}`, { params });
export const updateAppointmentStatus = (id, data) => API.put(`/appointments/${id}/status`, data);
export const cancelAppointment = (id, reason) => API.delete(`/appointments/${id}`, { data: { reason } });
