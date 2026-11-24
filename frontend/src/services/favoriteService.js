import api, { unwrap } from './api';
export const listFavorites = (params = {}) => unwrap(api.get('/favorites', { params }));
export const addFavorite = (data) => unwrap(api.post('/favorites', data));
export const updateFavorite = (id, data) => unwrap(api.put(`/favorites/${id}`, data));
export const removeFavorite = (id) => unwrap(api.delete(`/favorites/${id}`));
