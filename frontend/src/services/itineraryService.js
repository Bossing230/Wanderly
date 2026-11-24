import api, { unwrap } from './api';
export const listItems = (trip) => unwrap(api.get('/itineraries', { params: { trip } }));
export const createItem = (d) => unwrap(api.post('/itineraries', d));
export const updateItem = (id, d) => unwrap(api.put(`/itineraries/${id}`, d));
export const deleteItem = (id) => unwrap(api.delete(`/itineraries/${id}`));
