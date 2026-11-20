const { Router } = require('express');
const Order = require('../../models/Order');
const ApiError = require('../../utils/ApiError');
const { escapeRegex } = require('../../utils/sanitize');
const { logActivity } = require('../../utils/activity');
const { releaseStock } = require('../../utils/stock');

const router = Router();

function buildQuery(q) {
  const query = {};
  if (q.status) query.status = q.status;
  if (q.paymentStatus) query.paymentStatus = q.paymentStatus;
  if (q.paymentMethod) query.paymentMethod = q.paymentMethod;
  if (q.user) query.user = q.user;
  if (q.from || q.to) {
    query.createdAt = {};
    if (q.from) query.createdAt.$gte = new Date(q.from);
    if (q.to) { const to = new Date(q.to); to.setHours(23, 59, 59, 999); query.createdAt.$lte = to; }
  }
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), 'i');
    query.$or = [{ orderNumber: rx }, { 'shippingAddress.fullName': rx }, { 'shippingAddress.phone': rx }, { 'shippingAddress.pincode': rx }];
  }
  return query;
}

router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
  const query = buildQuery(req.query);
  const [items, total] = await Promise.all([
    Order.find(query).sort(req.query.sort || '-createdAt').skip((page - 1) * limit).limit(limit)
      .populate('user', 'name phone').select('-statusHistory').lean(),
    Order.countDocuments(query),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) || 1 });
});

router.get('/stats/counts', async (_req, res) => {
  const rows = await Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const counts = Object.fromEntries(rows.map((r) => [r._id, r.count]));
  counts.all = rows.reduce((s, r) => s + r.count, 0);
  res.json(counts);
});

router.get('/:id', async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name phone email createdAt')
    .populate('statusHistory.by', 'name role')
    .lean();
  if (!order) throw ApiError.notFound('Order not found');
  res.json(order);
});

router.patch('/:id', async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  const { status, note, paymentStatus, trackingNumber, courier } = req.body;
  const changes = {};

  if (status && status !== order.status) {
    if (!Order.STATUSES.includes(status)) throw ApiError.badRequest('Invalid status');
    if (['cancelled', 'returned'].includes(order.status)) throw ApiError.badRequest(`Order is already ${order.status}`);
    if (['cancelled', 'returned'].includes(status)) await releaseStock(order.items);
    if (status === 'delivered' && order.paymentMethod === 'cod' && order.paymentStatus === 'pending') {
      order.paymentStatus = 'paid';
    }
    changes.status = [order.status, status];
    order.status = status;
    order.statusHistory.push({ status, note, by: req.user._id });
  } else if (note) {
    order.statusHistory.push({ status: order.status, note, by: req.user._id });
  }
  if (paymentStatus && paymentStatus !== order.paymentStatus) {
    if (!Order.PAYMENT_STATUSES.includes(paymentStatus)) throw ApiError.badRequest('Invalid payment status');
    changes.paymentStatus = [order.paymentStatus, paymentStatus];
    order.paymentStatus = paymentStatus;
  }
  if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
  if (courier !== undefined) order.courier = courier;

  await order.save();
  logActivity(req, 'updated', 'Order', order._id, { orderNumber: order.orderNumber, changes });
  res.json(order);
});

module.exports = router;
