const { Router } = require('express');
const ActivityLog = require('../../models/ActivityLog');
const { escapeRegex } = require('../../utils/sanitize');

const router = Router();

router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 30);
  const query = {};
  if (req.query.entity) query.entity = req.query.entity;
  if (req.query.actor) query.actor = req.query.actor;
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    query.$or = [{ action: rx }, { entity: rx }, { actorName: rx }];
  }
  const [items, total, entities] = await Promise.all([
    ActivityLog.find(query).sort('-createdAt').skip((page - 1) * limit).limit(limit).lean(),
    ActivityLog.countDocuments(query),
    ActivityLog.distinct('entity'),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) || 1, entities });
});

module.exports = router;
