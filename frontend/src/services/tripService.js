import api, { unwrap } from './api';
export const listTrips = (params = {}) => unwrap(api.get('/trips', { params }));
export const getTrip = (id) => unwrap(api.get(`/trips/${id}`));
export const createTrip = (d) => unwrap(api.post('/trips', d));
export const updateTrip = (id, d) => unwrap(api.put(`/trips/${id}`, d));
export const deleteTrip = (id) => unwrap(api.delete(`/trips/${id}`));
export const addTripDestination = (id, d) => unwrap(api.post(`/trips/${id}/destinations`, d));
export const getStats = () => unwrap(api.get('/trips/stats'));
export const getHistory = (params = {}) => unwrap(api.get('/trips/history', { params }));
