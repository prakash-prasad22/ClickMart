const { Router } = require('express');
const mongoose = require('mongoose');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { buildQuote } = require('../utils/cart');

const router = Router();

const cleanItems = (items) =>
  (Array.isArray(items) ? items : [])
    .filter((i) => i && mongoose.isValidObjectId(i.product))
    .slice(0, 100)
    .map((i) => ({
      product: i.product,
      variantId: i.variantId && mongoose.isValidObjectId(i.variantId) ? i.variantId : undefined,
      qty: Math.max(1, Math.min(99, parseInt(i.qty, 10) || 1)),
    }));

// Price a cart (guest or signed-in). Body: { items, couponCode, pincode }
router.post('/quote', optionalAuth, async (req, res) => {
  const items = req.body.items ? cleanItems(req.body.items) : req.user?.cart || [];
  const quote = await buildQuote(items, {
    couponCode: req.body.couponCode,
    pincode: req.body.pincode,
    userId: req.user?._id,
  });
  res.json(quote);
});

// Persisted cart for signed-in users (synced from the browser)
router.get('/', authenticate, (req, res) => {
  res.json({ items: req.user.cart });
});

router.put('/', authenticate, async (req, res) => {
  req.user.cart = cleanItems(req.body.items);
  await req.user.save();
  res.json({ items: req.user.cart });
});

module.exports = router;
