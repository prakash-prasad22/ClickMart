const { Router } = require('express');
const User = require('../../models/User');
const Order = require('../../models/Order');
const Ticket = require('../../models/Ticket');
const ApiError = require('../../utils/ApiError');
const { escapeRegex } = require('../../utils/sanitize');
const { logActivity } = require('../../utils/activity');

const router = Router();

async function statsFor(userIds) {
  const rows = await Order.aggregate([
    { $match: { user: { $in: userIds } } },
    {
      $group: {
        _id: '$user',
        orders: { $sum: 1 },
        spent: { $sum: { $cond: [{ $in: ['$status', ['cancelled', 'returned']] }, 0, '$total'] } },
        lastOrderAt: { $max: '$createdAt' },
      },
    },
  ]);
  return new Map(rows.map((r) => [String(r._id), r]));
}

router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
  const query = { role: 'customer' };
  if (req.query.isActive) query.isActive = req.query.isActive === 'true';
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    query.$or = [{ name: rx }, { phone: rx }, { email: rx }];
  }
  const [users, total] = await Promise.all([
    User.find(query).sort('-createdAt').skip((page - 1) * limit).limit(limit).select('name phone email isActive createdAt lastLoginAt addresses').lean(),
    User.countDocuments(query),
  ]);
  const stats = await statsFor(users.map((u) => u._id));
  const items = users.map(({ addresses, ...u }) => {
    const s = stats.get(String(u._id));
    const def = addresses?.find((a) => a.isDefault) || addresses?.[0];
    return { ...u, city: def?.city, orders: s?.orders || 0, spent: s?.spent || 0, lastOrderAt: s?.lastOrderAt };
  });
  res.json({ items, total, page, pages: Math.ceil(total / limit) || 1 });
});

router.get('/:id', async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: 'customer' }).select('-password -cart').lean();
  if (!user) throw ApiError.notFound('Customer not found');
  const [orders, tickets, stats] = await Promise.all([
    Order.find({ user: user._id }).sort('-createdAt').limit(25).select('orderNumber total status paymentStatus createdAt items').lean(),
    Ticket.find({ user: user._id }).sort('-updatedAt').limit(10).select('ticketNumber subject status updatedAt').lean(),
    statsFor([user._id]),
  ]);
  const s = stats.get(String(user._id));
  res.json({ ...user, orders, tickets, stats: { orders: s?.orders || 0, spent: s?.spent || 0, lastOrderAt: s?.lastOrderAt } });
});

router.patch('/:id', async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: 'customer' });
  if (!user) throw ApiError.notFound('Customer not found');
  if (req.body.isActive !== undefined) user.isActive = !!req.body.isActive;
  if (req.body.name !== undefined) user.name = req.body.name;
  await user.save();
  logActivity(req, user.isActive ? 'activated' : 'suspended', 'Customer', user._id, { name: user.name, phone: user.phone });
  res.json(user.toSafeJSON());
});

module.exports = router;
