const { Router } = require('express');
const Ticket = require('../../models/Ticket');
const User = require('../../models/User');
const { STAFF_ROLES } = require('../../config/permissions');
const ApiError = require('../../utils/ApiError');
const { escapeRegex } = require('../../utils/sanitize');
const { logActivity } = require('../../utils/activity');

const router = Router();

router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
  const query = {};
  for (const k of ['status', 'priority', 'category']) if (req.query[k]) query[k] = req.query[k];
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    query.$or = [{ subject: rx }, { ticketNumber: rx }];
  }
  const [items, total, counts] = await Promise.all([
    Ticket.find(query).sort('-updatedAt').skip((page - 1) * limit).limit(limit)
      .populate('user', 'name phone').populate('assignee', 'name').select('-messages').lean(),
    Ticket.countDocuments(query),
    Ticket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) || 1, counts: Object.fromEntries(counts.map((c) => [c._id, c.count])) });
});

// Staff who can be assigned tickets (readable by anyone with ticket access)
router.get('/meta/assignees', async (_req, res) => {
  const items = await User.find({ role: { $in: STAFF_ROLES }, isActive: true }).select('name role').sort('name').lean();
  res.json({ items });
});

router.get('/:id', async (req, res) => {
  const ticket = await Ticket.findById(req.params.id)
    .populate('user', 'name phone email')
    .populate('order', 'orderNumber total status createdAt')
    .populate('assignee', 'name')
    .lean();
  if (!ticket) throw ApiError.notFound('Ticket not found');
  res.json(ticket);
});

router.post('/:id/reply', async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw ApiError.notFound('Ticket not found');
  if (!req.body.body) throw ApiError.badRequest('Reply cannot be empty');
  ticket.messages.push({ author: req.user._id, authorName: req.user.name || 'Support', fromStaff: true, body: String(req.body.body).slice(0, 4000) });
  ticket.status = req.body.status || (ticket.status === 'open' ? 'in_progress' : ticket.status);
  if (!ticket.assignee) ticket.assignee = req.user._id;
  await ticket.save();
  logActivity(req, 'replied', 'Ticket', ticket._id, { ticketNumber: ticket.ticketNumber });
  res.json(ticket);
});

router.patch('/:id', async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw ApiError.notFound('Ticket not found');
  for (const k of ['status', 'priority', 'assignee']) if (req.body[k] !== undefined) ticket[k] = req.body[k] || undefined;
  await ticket.save();
  logActivity(req, 'updated', 'Ticket', ticket._id, { ticketNumber: ticket.ticketNumber, ...req.body });
  res.json(ticket);
});

module.exports = router;
