const { Router } = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const { authenticate } = require('../middleware/auth');
const { priceProducts } = require('../utils/pricing');

const router = Router();
router.use(authenticate);

const ADDRESS_FIELDS = ['label', 'fullName', 'phone', 'line1', 'line2', 'landmark', 'city', 'state', 'pincode', 'country', 'location', 'formattedAddress', 'isDefault'];
const pickAddress = (body) => Object.fromEntries(ADDRESS_FIELDS.filter((k) => body[k] !== undefined).map((k) => [k, body[k]]));

function ensureSingleDefault(user, preferredId) {
  const list = user.addresses;
  if (!list.length) return;
  const target = preferredId ? list.id(preferredId) : list.find((a) => a.isDefault) || list[0];
  list.forEach((a) => { a.isDefault = String(a._id) === String(target._id); });
}

// ── Addresses ─────────────────────────────────────────────────────
router.get('/addresses', (req, res) => res.json(req.user.addresses));

router.post('/addresses', async (req, res) => {
  if (req.user.addresses.length >= 20) throw ApiError.badRequest('You can save up to 20 addresses');
  const addr = req.user.addresses.create(pickAddress(req.body));
  req.user.addresses.push(addr);
  ensureSingleDefault(req.user, req.body.isDefault || req.user.addresses.length === 1 ? addr._id : null);
  await req.user.save();
  res.status(201).json(req.user.addresses.id(addr._id));
});

router.put('/addresses/:id', async (req, res) => {
  const addr = req.user.addresses.id(req.params.id);
  if (!addr) throw ApiError.notFound('Address not found');
  addr.set(pickAddress(req.body));
  ensureSingleDefault(req.user, req.body.isDefault ? addr._id : null);
  await req.user.save();
  res.json(addr);
});

router.delete('/addresses/:id', async (req, res) => {
  const addr = req.user.addresses.id(req.params.id);
  if (!addr) throw ApiError.notFound('Address not found');
  addr.deleteOne();
  ensureSingleDefault(req.user);
  await req.user.save();
  res.json({ ok: true });
});

// ── Wishlist ──────────────────────────────────────────────────────
router.get('/wishlist', async (req, res) => {
  const products = await Product.find({ _id: { $in: req.user.wishlist }, isActive: true }).populate('brand', 'name slug').lean();
  res.json({ ids: req.user.wishlist, items: await priceProducts(products) });
});

router.post('/wishlist/:productId', async (req, res) => {
  const { productId } = req.params;
  if (!mongoose.isValidObjectId(productId)) throw ApiError.badRequest('Invalid product');
  const idx = req.user.wishlist.findIndex((id) => String(id) === productId);
  if (idx >= 0) req.user.wishlist.splice(idx, 1);
  else req.user.wishlist.push(productId);
  await req.user.save();
  res.json({ ids: req.user.wishlist, added: idx < 0 });
});

module.exports = router;
