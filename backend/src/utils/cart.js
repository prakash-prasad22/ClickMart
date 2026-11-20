const mongoose = require('mongoose');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const Setting = require('../models/Setting');
const { getActiveOffers, priceProduct, round2 } = require('./pricing');

async function evaluateCoupon(code, subtotal, userId) {
  if (!code) return { discount: 0 };
  const coupon = await Coupon.findOne({ code: String(code).toUpperCase().trim() }).lean();
  const now = new Date();
  if (!coupon || !coupon.isActive) return { error: 'This coupon is not valid' };
  if (coupon.startsAt && coupon.startsAt > now) return { error: 'This coupon is not active yet' };
  if (coupon.endsAt && coupon.endsAt < now) return { error: 'This coupon has expired' };
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return { error: 'This coupon has been fully redeemed' };
  if (subtotal < (coupon.minOrderValue || 0)) {
    return { error: `Add items worth ₹${round2(coupon.minOrderValue - subtotal)} more to use this coupon` };
  }
  if (userId && coupon.perUserLimit) {
    const used = await Order.countDocuments({ user: userId, couponCode: coupon.code, status: { $ne: 'cancelled' } });
    if (used >= coupon.perUserLimit) return { error: 'You have already used this coupon' };
  }
  let discount = coupon.discountType === 'percentage' ? (subtotal * coupon.value) / 100 : coupon.value;
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  return { coupon, discount: round2(Math.min(discount, subtotal)) };
}

/**
 * Re-price a cart on the server. Never trust client prices.
 * @param {Array<{product: string, variantId?: string, qty: number}>} rawItems
 */
async function buildQuote(rawItems = [], { couponCode, userId, pincode } = {}) {
  const items = rawItems
    .filter((i) => i && mongoose.isValidObjectId(i.product))
    .map((i) => ({ product: String(i.product), variantId: i.variantId ? String(i.variantId) : null, qty: Math.max(1, Math.min(99, parseInt(i.qty, 10) || 1)) }));

  const ids = [...new Set(items.map((i) => i.product))];
  const [products, offers, settings] = await Promise.all([
    Product.find({ _id: { $in: ids } }).lean(),
    getActiveOffers(),
    Setting.get(),
  ]);
  const byId = new Map(products.map((p) => [String(p._id), priceProduct(p, offers)]));

  const lines = [];
  const issues = [];
  for (const item of items) {
    const p = byId.get(item.product);
    if (!p || !p.isActive) {
      issues.push({ product: item.product, message: 'A product in your bag is no longer available' });
      continue;
    }
    let unit = p;
    let variant = null;
    if (p.variants?.length) {
      variant = p.variants.find((v) => String(v._id) === item.variantId && v.isActive !== false);
      if (!variant) {
        issues.push({ product: item.product, message: `Please choose an option for ${p.name}` });
        continue;
      }
      unit = variant;
    }
    const available = unit.stock ?? 0;
    const qty = Math.min(item.qty, available);
    if (available <= 0) {
      issues.push({ product: item.product, variantId: item.variantId, message: `${p.name} is out of stock` });
    } else if (qty < item.qty) {
      issues.push({ product: item.product, variantId: item.variantId, message: `Only ${available} left of ${p.name}` });
    }
    lines.push({
      product: p._id,
      variantId: variant?._id || null,
      slug: p.slug,
      name: p.name,
      variantName: variant?.name || null,
      image: p.images?.[0] || null,
      sku: variant?.sku || p.sku,
      mrp: unit.mrp || unit.price,
      basePrice: unit.price,
      price: unit.salePrice,
      offer: unit.offer,
      qty: item.qty,
      available,
      inStock: available >= item.qty,
      lineTotal: round2(unit.salePrice * item.qty),
    });
  }

  const purchasable = lines.filter((l) => l.inStock);
  const mrpTotal = round2(purchasable.reduce((s, l) => s + l.mrp * l.qty, 0));
  const baseTotal = round2(purchasable.reduce((s, l) => s + l.basePrice * l.qty, 0));
  const subtotal = round2(purchasable.reduce((s, l) => s + l.lineTotal, 0));
  const offerDiscount = round2(baseTotal - subtotal);

  const couponResult = await evaluateCoupon(couponCode, subtotal, userId);
  const couponDiscount = couponResult.discount || 0;
  const afterCoupon = subtotal - couponDiscount;
  const shippingFee = subtotal === 0 || afterCoupon >= settings.freeShippingAbove ? 0 : settings.shippingFee;
  const tax = settings.taxRate ? round2((afterCoupon * settings.taxRate) / 100) : 0;
  const total = round2(afterCoupon + shippingFee + tax);

  let serviceable = true;
  if (pincode && settings.serviceablePincodePrefixes?.length) {
    serviceable = settings.serviceablePincodePrefixes.some((pre) => String(pincode).startsWith(pre));
  }

  return {
    items: lines,
    issues,
    mrpTotal,
    subtotal,
    offerDiscount,
    savings: round2(mrpTotal - subtotal + couponDiscount),
    coupon: couponResult.coupon ? { code: couponResult.coupon.code, description: couponResult.coupon.description } : null,
    couponError: couponResult.error || null,
    couponDiscount,
    shippingFee,
    freeShippingAbove: settings.freeShippingAbove,
    tax,
    total,
    serviceable,
    paymentMethods: { cod: settings.codEnabled, online: settings.onlinePaymentEnabled },
  };
}

module.exports = { buildQuote, evaluateCoupon };
