  const axios = require('axios');
  const CODES = { 0: 'Clear sky', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 80: 'Rain showers', 81: 'Rain showers', 82: 'Violent showers', 95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with hail' };
  const label = (c) => CODES[c] || 'Unknown';
  exports.forecast = async (lat, lon, days = 7) => {
    const { data } = await axios.get('https://api.open-meteo.com/v1/forecast', {
      timeout: 10000,
      params: {
        latitude: lat, longitude: lon, timezone: 'auto', forecast_days: days,
        current: 'temperature_2m,weather_code,wind_speed_10m,precipitation,relative_humidity_2m',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max',
      },
    });
    const c = data.current, d = data.daily;
    const daily = d.time.map((date, i) => ({
      date, condition: label(d.weather_code[i]), code: d.weather_code[i],
      tempMax: d.temperature_2m_max[i], tempMin: d.temperature_2m_min[i],
      precipitation: d.precipitation_sum[i], rainChance: d.precipitation_probability_max[i], windMax: d.wind_speed_10m_max[i],
    }));
    const wet = daily.filter((x) => (x.rainChance || 0) >= 50).length;
    return {
      current: { temp: c.temperature_2m, condition: label(c.weather_code), code: c.weather_code, wind: c.wind_speed_10m, precipitation: c.precipitation, humidity: c.relative_humidity_2m },
      daily,
      summary: `${wet} of ${daily.length} days likely wet. Highs ${Math.min(...daily.map((x) => x.tempMax))}–${Math.max(...daily.map((x) => x.tempMax))}°C.${wet >= 3 ? ' Pack rain gear.' : ''}`,
      units: data.current_units,
    };
  };
