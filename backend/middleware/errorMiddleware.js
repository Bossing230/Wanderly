exports.notFound = (req, res) => res.status(404).json({ success: false, message: `Not found: ${req.originalUrl}` });

exports.errorHandler = (err, _req, res, _next) => {
  let status = err.status || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Server error';

  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.response) {
    const up = err.response.status;
    console.error(`[External API error] ${up} from ${err.config?.baseURL || ''}${err.config?.url || ''}`, JSON.stringify(err.response.data)?.slice(0, 300));
    status = 502;
    message =
      up === 429 ? 'Too many requests to the map service. Wait a few seconds and try again.'
      : up === 401 || up === 403 ? 'The service rejected the request. Check your API key or NOMINATIM_USER_AGENT in backend/.env.'
      : 'An external travel service is unavailable. Please try again.';
  } else if (['ECONNABORTED', 'ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT'].includes(err.code)) {
    console.error('[External API network error]', err.code, err.config?.url);
    status = 502;
    message = 'Could not reach an external travel service. Check your internet connection.';
  }
  res.status(status).json({ success: false, message });
};