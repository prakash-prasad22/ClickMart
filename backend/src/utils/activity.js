const ActivityLog = require('../models/ActivityLog');

// Fire-and-forget audit trail for admin actions.
function logActivity(req, action, entity, entityId, meta = {}) {
  if (!req.user) return;
  ActivityLog.create({
    actor: req.user._id,
    actorName: req.user.name || req.user.email || req.user.phone,
    actorRole: req.user.role,
    action,
    entity,
    entityId: entityId ? String(entityId) : undefined,
    meta,
    ip: req.ip,
  }).catch((e) => console.error('activity log failed', e.message));
}

module.exports = { logActivity };
