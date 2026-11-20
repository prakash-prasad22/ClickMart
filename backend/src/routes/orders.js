const { Router } = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const ApiError = require('../utils/ApiError');
const { authenticate } = require('../middleware/auth');
const { buildQuote } = require('../utils/cart');
const { reserveStock, releaseStock } = require('../utils/stock');
const { humanRef } = require('../utils/ids');

const router = Router();
router.use(authenticate);

const ADDRESS_FIELDS = ['fullName', 'phone', 'line1', 'line2', 'landmark', 'city', 'state', 'pincode', 'country', 'location', 'formattedAddress'];

router.post('/', async (req, res) => {
  const { addressId, paymentMethod = 'cod', couponCode, notes } = req.body;

  const saved = addressId ? req.user.addresses.id(addressId) : null;
  const source = saved || req.body.address;
  if (!source) throw ApiError.badRequest('Please choose a delivery address');
  const shippingAddress = Object.fromEntries(ADDRESS_FIELDS.map((k) => [k, source[k]]));
  for (const k of ['fullName', 'phone', 'line1', 'city', 'state', 'pincode']) {
    if (!shippingAddress[k]) throw ApiError.badRequest(`Address ${k} is required`);
  }

  const items = Array.isArray(req.body.items) && req.body.items.length ? req.body.items : req.user.cart;
  if (!items?.length) throw ApiError.badRequest('Your bag is empty');

  const quote = await buildQuote(items, { couponCode, userId: req.user._id, pincode: shippingAddress.pincode });
  if (quote.issues.length) throw new ApiError(409, quote.issues[0].message, { issues: quote.issues });
  if (!quote.serviceable) throw ApiError.badRequest('Sorry, we do not deliver to this pincode yet');
  if (couponCode && quote.couponError) throw ApiError.badRequest(quote.couponError);
  if (!quote.paymentMethods[paymentMethod]) throw ApiError.badRequest('This payment method is not available');

  const lines = quote.items.map((l) => ({
    product: l.product,
    variantId: l.variantId || undefined,
    name: l.name,
    variantName: l.variantName || undefined,
    image: l.image,
    sku: l.sku,
    mrp: l.mrp,
    price: l.price,
    qty: l.qty,
    lineTotal: l.lineTotal,
  }));

  await reserveStock(lines);

  let order;
  try {
    order = await Order.create({
      orderNumber: humanRef('CM'),
      user: req.user._id,
      items: lines,
      shippingAddress,
      subtotal: quote.subtotal,
      offerDiscount: quote.offerDiscount,
      couponCode: quote.coupon?.code,
      couponDiscount: quote.couponDiscount,
      shippingFee: quote.shippingFee,
      tax: quote.tax,
      total: quote.total,
      paymentMethod,
      paymentStatus: 'pending',
      status: 'pending',
      statusHistory: [{ status: 'pending', note: 'Order placed', by: req.user._id }],
      notes: notes ? String(notes).slice(0, 500) : undefined,
    });
  } catch (err) {
    await releaseStock(lines);
    throw err;
  }

  if (quote.coupon) await Coupon.updateOne({ code: quote.coupon.code }, { $inc: { usedCount: 1 } });
  req.user.cart = [];
  await req.user.save();

  // TODO(payments): for paymentMethod === 'online', create a Razorpay order here and return its id.
  res.status(201).json(order);
});

router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = 10;
  const [items, total] = await Promise.all([
    Order.find({ user: req.user._id }).sort('-createdAt').skip((page - 1) * limit).limit(limit).lean(),
    Order.countDocuments({ user: req.user._id }),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) || 1 });
});

const findMine = (req) => {
  const { id } = req.params;
  const match = mongoose.isValidObjectId(id) ? { _id: id } : { orderNumber: id };
  return Order.findOne({ ...match, user: req.user._id });
};

router.get('/:id', async (req, res) => {
  const order = await findMine(req);
  if (!order) throw ApiError.notFound('Order not found');
  res.json(order);
});

router.post('/:id/cancel', async (req, res) => {
  const order = await findMine(req);
  if (!order) throw ApiError.notFound('Order not found');
  if (!['pending', 'confirmed'].includes(order.status)) {
    throw ApiError.badRequest('This order can no longer be cancelled. Please raise a support ticket');
  }
  order.status = 'cancelled';
  order.statusHistory.push({ status: 'cancelled', note: req.body.reason || 'Cancelled by customer', by: req.user._id });
  await order.save();
  await releaseStock(order.items);
  res.json(order);
});

module.exports = router;
