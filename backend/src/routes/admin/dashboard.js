const { Router } = require('express');
const Order = require('../../models/Order');
const User = require('../../models/User');
const Product = require('../../models/Product');
const Ticket = require('../../models/Ticket');
const Review = require('../../models/Review');

const router = Router();
const REVENUE_STATUSES = { $nin: ['cancelled', 'returned'] };
const DAY = 24 * 60 * 60 * 1000;

const startOfDay = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

async function revenueBetween(from, to) {
  const [r] = await Order.aggregate([
    { $match: { createdAt: { $gte: from, $lt: to }, status: REVENUE_STATUSES } },
    { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
  ]);
  return { revenue: r?.revenue || 0, orders: r?.orders || 0 };
}

router.get('/', async (_req, res) => {
  const today = startOfDay();
  const now = new Date();
  const d30 = new Date(today.getTime() - 29 * DAY);
  const d60 = new Date(today.getTime() - 59 * DAY);
  const d14 = new Date(today.getTime() - 13 * DAY);

  const [
    todayStats, last30, prev30, customers, newCustomers, prevNewCustomers,
    pendingOrders, openTickets, pendingReviews, lowStock, recentOrders, daily, statusBreakdown, topProducts,
  ] = await Promise.all([
    revenueBetween(today, now),
    revenueBetween(d30, now),
    revenueBetween(d60, d30),
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'customer', createdAt: { $gte: d30 } }),
    User.countDocuments({ role: 'customer', createdAt: { $gte: d60, $lt: d30 } }),
    Order.countDocuments({ status: { $in: ['pending', 'confirmed'] } }),
    Ticket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
    Review.countDocuments({ status: 'pending' }),
    Product.find({ isActive: true, $expr: { $lte: ['$stock', '$lowStockThreshold'] } })
      .select('name slug images stock lowStockThreshold sku').sort('stock').limit(6).lean(),
    Order.find().sort('-createdAt').limit(8).populate('user', 'name phone').select('orderNumber total status paymentStatus paymentMethod createdAt shippingAddress.fullName user items').lean(),
    Order.aggregate([
      { $match: { createdAt: { $gte: d14 }, status: REVENUE_STATUSES } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+05:30' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([{ $match: { createdAt: { $gte: d30 } } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { createdAt: { $gte: d30 }, status: REVENUE_STATUSES } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.name' }, image: { $first: '$items.image' }, qty: { $sum: '$items.qty' }, revenue: { $sum: '$items.lineTotal' } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),
  ]);

  // Fill missing days with zeros so the chart has a continuous axis
  const map = new Map(daily.map((d) => [d._id, d]));
  const series = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(d14.getTime() + i * DAY);
    const key = new Date(d.getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return { date: key, revenue: map.get(key)?.revenue || 0, orders: map.get(key)?.orders || 0 };
  });

  const pct = (a, b) => (b ? Math.round(((a - b) / b) * 1000) / 10 : null);

  res.json({
    kpis: {
      todayRevenue: todayStats.revenue,
      todayOrders: todayStats.orders,
      revenue30: last30.revenue,
      revenue30Change: pct(last30.revenue, prev30.revenue),
      orders30: last30.orders,
      orders30Change: pct(last30.orders, prev30.orders),
      aov30: last30.orders ? Math.round(last30.revenue / last30.orders) : 0,
      customers,
      newCustomers30: newCustomers,
      newCustomersChange: pct(newCustomers, prevNewCustomers),
    },
    attention: { pendingOrders, openTickets, pendingReviews, lowStock: lowStock.length },
    series,
    statusBreakdown,
    topProducts,
    lowStock,
    recentOrders,
  });
});

module.exports = router;
