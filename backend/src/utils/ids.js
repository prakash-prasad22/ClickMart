const crypto = require('crypto');

// Human-friendly references: CM-251120-4F7K
function humanRef(prefix) {
  const d = new Date();
  const date = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
  return `${prefix}-${date}-${rand}`;
}

module.exports = { humanRef };
