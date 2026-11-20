const Offer = require('../models/Offer');

const round2 = (n) => Math.round(n * 100) / 100;

async function getActiveOffers() {
  const now = new Date();
  return Offer.find({
    isActive: true,
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
    ],
  }).lean();
}

const idOf = (v) => String(v?._id || v || '');

function offerMatches(offer, product) {
  switch (offer.appliesTo) {
    case 'all':
      return true;
    case 'category':
      return (offer.categories || []).some((c) => idOf(c) === idOf(product.category));
    case 'brand':
      return (offer.brands || []).some((b) => idOf(b) === idOf(product.brand));
    case 'product':
      return (offer.products || []).some((p) => idOf(p) === idOf(product._id));
    default:
      return false;
  }
}

function discountFor(offer, price) {
  let d = offer.discountType === 'percentage' ? (price * offer.value) / 100 : offer.value;
  if (offer.maxDiscount) d = Math.min(d, offer.maxDiscount);
  return Math.min(round2(d), price);
}

/** Best (largest) offer for a given unit price. */
function bestOffer(product, price, offers) {
  let best = null;
  for (const offer of offers) {
    if (!offerMatches(offer, product)) continue;
    const d = discountFor(offer, price);
    if (!best || d > best.discount) best = { offer, discount: d };
  }
  return best;
}

/**
 * Decorate a product (plain object) with `salePrice` and an `offer` badge,
 * on the product and on each variant.
 */
function priceProduct(product, offers) {
  const p = { ...product };
  const apply = (target) => {
    const b = bestOffer(p, target.price, offers);
    target.salePrice = b ? round2(target.price - b.discount) : target.price;
    target.offer = b ? { title: b.offer.title, badge: b.offer.badge } : null;
    return target;
  };
  apply(p);
  if (Array.isArray(p.variants)) p.variants = p.variants.map((v) => apply({ ...v }));
  p.totalStock = p.variants?.length
    ? p.variants.filter((v) => v.isActive !== false).reduce((s, v) => s + (v.stock || 0), 0)
    : p.stock;
  return p;
}

async function priceProducts(products) {
  const offers = await getActiveOffers();
  return products.map((p) => priceProduct(p.toObject ? p.toObject() : p, offers));
}

module.exports = { getActiveOffers, priceProduct, priceProducts, round2 };
