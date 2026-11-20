// Strip MongoDB operators ($...) and dotted keys from user input (NoSQL injection guard).
function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith('$') || k.includes('.')) continue;
      out[k] = clean(v);
    }
    return out;
  }
  return value;
}

function sanitizeBody(req, _res, next) {
  if (req.body) req.body = clean(req.body);
  next();
}

const escapeRegex = (s = '') => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { sanitizeBody, clean, escapeRegex };
