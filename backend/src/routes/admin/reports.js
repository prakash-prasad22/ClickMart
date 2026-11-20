const { Router } = require('express');
const Order = require('../../models/Order');
const User = require('../../models/User');

const router = Router();
const DAY = 24 * 60 * 60 * 1000;
const VALID = { $nin: ['cancelled', 'returned'] };

function range(q) {
  const to = q.to ? new Date(q.to) : new Date();
  to.setHours(23, 59, 59, 999);
  const from = q.from ? new Date(q.from) : new Date(to.getTime() - 29 * DAY);
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

router.get('/', async (req, res) => {
  const { from, to } = range(req.query);
  const match = { createdAt: { $gte: from, $lte: to } };
  const valid = { ...match, status: VALID };
  const fmt = req.query.groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';

  const [totals, series, byCategory, topProducts, byPayment, byStatus, newCustomers, byCity] = await Promise.all([
    Order.aggregate([
      { $match: valid },
      {
        $group: {
          _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 },
          discounts: { $sum: { $add: ['$offerDiscount', '$couponDiscount'] } },
          shipping: { $sum: '$shippingFee' },
          items: { $sum: { $sum: '$items.qty' } },
        },
      },
    ]),
    Order.aggregate([
      { $match: valid },
      { $group: { _id: { $dateToString: { format: fmt, date: '$createdAt', timezone: '+05:30' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: valid },
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'p' } },
      { $lookup: { from: 'categories', localField: 'p.category', foreignField: '_id', as: 'c' } },
      { $group: { _id: { $ifNull: [{ $first: '$c.name' }, 'Uncategorised'] }, revenue: { $sum: '$items.lineTotal' }, qty: { $sum: '$items.qty' } } },
      { $sort: { revenue: -1 } },
    ]),
    Order.aggregate([
      { $match: valid },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.name' }, qty: { $sum: '$items.qty' }, revenue: { $sum: '$items.lineTotal' } } },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]),
    Order.aggregate([{ $match: valid }, { $group: { _id: '$paymentMethod', revenue: { $sum: '$total' }, orders: { $sum: 1 } } }]),
    Order.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    User.countDocuments({ role: 'customer', createdAt: { $gte: from, $lte: to } }),
    Order.aggregate([
      { $match: valid },
      { $group: { _id: '$shippingAddress.city', revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $limit: 8 },
    ]),
  ]);

  const t = totals[0] || { revenue: 0, orders: 0, discounts: 0, shipping: 0, items: 0 };
  res.json({
    from, to,
    totals: { ...t, aov: t.orders ? Math.round(t.revenue / t.orders) : 0, newCustomers },
    series: series.map((s) => ({ date: s._id, revenue: s.revenue, orders: s.orders })),
    byCategory, topProducts, byPayment, byStatus, byCity,
  });
});

module.exports = router;
