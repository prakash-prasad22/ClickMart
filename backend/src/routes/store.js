const { Router } = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Banner = require('../models/Banner');
const Review = require('../models/Review');
const HelpArticle = require('../models/HelpArticle');
const Setting = require('../models/Setting');
const ApiError = require('../utils/ApiError');
const { getActiveOffers, priceProduct } = require('../utils/pricing');
const { escapeRegex } = require('../utils/sanitize');

const router = Router();

const LIST_FIELDS = 'name slug shortDescription images price mrp stock variants variantLabel category brand rating numReviews isFeatured soldCount createdAt tags';

const activeWindow = () => {
  const now = new Date();
  return {
    isActive: true,
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
    ],
  };
};

const priceAll = (list, offers) => list.map((p) => priceProduct(p, offers));

router.get('/settings', async (_req, res) => {
  const s = await Setting.get();
  res.json({
    storeName: s.storeName,
    tagline: s.tagline,
    supportEmail: s.supportEmail,
    supportPhone: s.supportPhone,
    address: s.address,
    currencySymbol: s.currencySymbol,
    freeShippingAbove: s.freeShippingAbove,
    shippingFee: s.shippingFee,
    codEnabled: s.codEnabled,
    onlinePaymentEnabled: s.onlinePaymentEnabled,
    serviceablePincodePrefixes: s.serviceablePincodePrefixes,
    storeLocation: s.storeLocation,
    socials: s.socials,
    announcement: s.announcement,
  });
});

router.get('/home', async (_req, res) => {
  const offers = await getActiveOffers();
  const base = { isActive: true };
  const [heroBanners, promoBanners, categories, featured, newArrivals, bestsellers, brands] = await Promise.all([
    Banner.find({ ...activeWindow(), placement: 'hero' }).sort('sortOrder').lean(),
    Banner.find({ ...activeWindow(), placement: 'promo' }).sort('sortOrder').limit(3).lean(),
    Category.find({ isActive: true, parent: null }).sort('sortOrder name').limit(12).lean(),
    Product.find({ ...base, isFeatured: true }).select(LIST_FIELDS).populate('brand', 'name slug').sort('-updatedAt').limit(8).lean(),
    Product.find(base).select(LIST_FIELDS).populate('brand', 'name slug').sort('-createdAt').limit(8).lean(),
    Product.find(base).select(LIST_FIELDS).populate('brand', 'name slug').sort('-soldCount -rating').limit(8).lean(),
    Brand.find({ isActive: true }).sort('sortOrder name').limit(16).lean(),
  ]);
  res.json({
    heroBanners,
    promoBanners,
    categories,
    brands,
    offers: offers.map((o) => ({ _id: o._id, title: o.title, description: o.description, badge: o.badge, discountType: o.discountType, value: o.value })),
    featured: priceAll(featured, offers),
    newArrivals: priceAll(newArrivals, offers),
    bestsellers: priceAll(bestsellers, offers),
  });
});

router.get('/categories', async (_req, res) => {
  const [categories, counts] = await Promise.all([
    Category.find({ isActive: true }).sort('sortOrder name').lean(),
    Product.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);
  const map = new Map(counts.map((c) => [String(c._id), c.count]));
  res.json(categories.map((c) => ({ ...c, productCount: map.get(String(c._id)) || 0 })));
});

router.get('/brands', async (_req, res) => {
  res.json(await Brand.find({ isActive: true }).sort('sortOrder name').lean());
});

const SORTS = {
  featured: { isFeatured: -1, soldCount: -1, createdAt: -1 },
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  rating: { rating: -1, numReviews: -1 },
  popular: { soldCount: -1 },
};

router.get('/products', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(48, Math.max(1, parseInt(req.query.limit, 10) || 24));
  const query = { isActive: true };

  if (req.query.q) {
    const rx = new RegExp(escapeRegex(String(req.query.q)), 'i');
    query.$or = [{ name: rx }, { tags: rx }, { shortDescription: rx }];
  }
  if (req.query.category) {
    const slugs = String(req.query.category).split(',');
    const cats = await Category.find({ slug: { $in: slugs } }).select('_id').lean();
    const ids = cats.map((c) => c._id);
    const children = await Category.find({ parent: { $in: ids } }).select('_id').lean();
    query.category = { $in: [...ids, ...children.map((c) => c._id)] };
  }
  if (req.query.brand) {
    const brands = await Brand.find({ slug: { $in: String(req.query.brand).split(',') } }).select('_id').lean();
    query.brand = { $in: brands.map((b) => b._id) };
  }
  const min = parseFloat(req.query.minPrice);
  const max = parseFloat(req.query.maxPrice);
  if (!Number.isNaN(min) || !Number.isNaN(max)) {
    query.price = {};
    if (!Number.isNaN(min)) query.price.$gte = min;
    if (!Number.isNaN(max)) query.price.$lte = max;
  }
  if (req.query.inStock === 'true') query.stock = { $gt: 0 };
  if (req.query.featured === 'true') query.isFeatured = true;
  if (req.query.ids) {
    query._id = { $in: String(req.query.ids).split(',').filter((id) => mongoose.isValidObjectId(id)) };
  }

  const sort = SORTS[req.query.sort] || SORTS.featured;
  const [items, total, offers, priceRange] = await Promise.all([
    Product.find(query).select(LIST_FIELDS).populate('brand', 'name slug').populate('category', 'name slug').sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Product.countDocuments(query),
    getActiveOffers(),
    Product.aggregate([{ $match: { isActive: true } }, { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }]),
  ]);

  res.json({
    items: priceAll(items, offers),
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    priceRange: priceRange[0] ? { min: priceRange[0].min, max: priceRange[0].max } : { min: 0, max: 0 },
  });
});

router.get('/products/:slug', async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate('category', 'name slug')
    .populate('brand', 'name slug logo')
    .lean();
  if (!product) throw ApiError.notFound('Product not found');

  const offers = await getActiveOffers();
  const [reviews, related, dist] = await Promise.all([
    Review.find({ product: product._id, status: 'approved' }).populate('user', 'name').sort('-createdAt').limit(20).lean(),
    Product.find({ isActive: true, category: product.category?._id, _id: { $ne: product._id } })
      .select(LIST_FIELDS).populate('brand', 'name slug').sort('-soldCount').limit(8).lean(),
    Review.aggregate([
      { $match: { product: product._id, status: 'approved' } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]),
  ]);

  res.json({
    product: priceProduct(product, offers),
    reviews: reviews.map((r) => ({ ...r, user: { name: r.user?.name ? r.user.name.split(' ')[0] : 'Customer' } })),
    ratingDistribution: Object.fromEntries([5, 4, 3, 2, 1].map((n) => [n, dist.find((d) => d._id === n)?.count || 0])),
    related: priceAll(related, offers),
  });
});

router.get('/help', async (_req, res) => {
  const articles = await HelpArticle.find({ isPublished: true }).sort('topic sortOrder title').select('title slug topic body').lean();
  res.json(articles);
});

router.get('/help/:slug', async (req, res) => {
  const article = await HelpArticle.findOne({ slug: req.params.slug, isPublished: true }).lean();
  if (!article) throw ApiError.notFound('Article not found');
  res.json(article);
});

module.exports = router;
