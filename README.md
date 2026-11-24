# Wanderly — Travel Destination Explorer and Trip Planner

Single-user full-stack app: React + Vite + Tailwind + React-Leaflet + Recharts (frontend), Node + Express + Mongoose (backend), MongoDB Atlas, JWT + bcrypt.
APIs: Nominatim (search), Geoapify Places (attractions), OpenRouteService (routes), Open-Meteo (weather). No AI features.

## Setup
1. Backend
   cd backend && npm install && cp .env.example .env   # fill MONGO_URI, JWT_SECRET, GEOAPIFY_KEY, ORS_KEY
   npm run dev                                          # http://localhost:5000
2. Frontend
   cd frontend && npm install && npm run dev            # http://localhost:5173 (proxies /api to :5000)
3. Open the app. The first visit shows "Create your account" (only works once). After that it is a normal login.

## Keys
- Geoapify: https://www.geoapify.com  (free tier)
- OpenRouteService: https://openrouteservice.org (free tier)
- Nominatim and Open-Meteo need no key. Set NOMINATIM_USER_AGENT to something identifying you (usage policy).

## Production
Set VITE_API_URL to your API origin + /api, set CLIENT_URL on the backend to your frontend origin, then `npm run build` in frontend.
