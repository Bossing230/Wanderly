import api, { unwrap } from './api';
export const searchDestinations = (q, params = {}) => unwrap(api.get('/destinations/search', { params: { q, ...params } }));
export const nearbyPlaces = (lat, lon, params = {}) => unwrap(api.get('/destinations/nearby', { params: { lat, lon, ...params } }));
export const reverseGeocode = (lat, lon) => unwrap(api.get('/destinations/reverse', { params: { lat, lon } }));
export const getCategories = () => unwrap(api.get('/destinations/categories'));
export const getRecent = () => unwrap(api.get('/destinations/recent'));
export const getWeather = (lat, lon) => unwrap(api.get('/weather', { params: { lat, lon } }));
export const getRoute = (points, profile) => unwrap(api.post('/routes', { points, profile }));
export const getPlaceImage = (d, hint, country) => unwrap(api.get('/destinations/image', { params: { name: d.name, lat: d.lat, lon: d.lon, hint, cat: d.category, country } }));