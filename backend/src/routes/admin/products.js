const { Router } = require('express');
const Product = require('../../models/Product');
const ApiError = require('../../utils/ApiError');
const slugify = require('../../utils/slugify');
const { escapeRegex } = require('../../utils/sanitize');
const { logActivity } = require('../../utils/activity');

const router = Router();

const WRITABLE = [
  'name', 'slug', 'shortDescription', 'description', 'category', 'brand', 'images', 'price', 'mrp', 'sku',
  'stock', 'lowStockThreshold', 'variantLabel', 'variants', 'attributes', 'tags', 'isFeatured', 'isActive', 'seo',
];

function pick(body) {
  const data = Object.fromEntries(WRITABLE.filter((k) => body[k] !== undefined).map((k) => [k, body[k]]));
  if (data.slug) data.slug = slugify(data.slug);
  if (data.category === '') data.category = null;
  if (data.brand === '') data.brand = null;
  if (typeof data.tags === 'string') data.tags = data.tags.split(',').map((t) => t.trim()).filter(Boolean);
  return data;
}

router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
  const query = {};
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    query.$or = [{ name: rx }, { sku: rx }, { tags: rx }, { 'variants.sku': rx }];
  }
  for (const k of ['category', 'brand']) if (req.query[k]) query[k] = req.query[k];
  for (const k of ['isActive', 'isFeatured']) if (req.query[k]) query[k] = req.query[k] === 'true';
  const [items, total] = await Promise.all([
    Product.find(query).sort(req.query.sort || '-createdAt').skip((page - 1) * limit).limit(limit)
      .populate('category', 'name').populate('brand', 'name').lean(),
    Product.countDocuments(query),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) || 1 });
});

router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) throw ApiError.notFound('Product not found');
  res.json(product);
});

router.post('/', async (req, res) => {
  const product = await Product.create(pick(req.body));
  logActivity(req, 'created', 'Product', product._id, { name: product.name });
  res.status(201).json(product);
});

router.put('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  product.set(pick(req.body));
  await product.save();
  logActivity(req, 'updated', 'Product', product._id, { name: product.name, fields: Object.keys(req.body) });
  res.json(product);
});

router.patch('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  product.set(pick(req.body));
  await product.save();
  logActivity(req, 'updated', 'Product', product._id, { name: product.name, fields: Object.keys(req.body) });
  res.json(product);
});

router.post('/:id/duplicate', async (req, res) => {
  const src = await Product.findById(req.params.id).lean();
  if (!src) throw ApiError.notFound('Product not found');
  const { _id, slug, createdAt, updatedAt, rating, numReviews, soldCount, ...rest } = src;
  const copy = await Product.create({
    ...rest,
    name: `${src.name} (copy)`,
    isActive: false,
    variants: (src.variants || []).map(({ _id: _vid, ...v }) => v),
  });
  logActivity(req, 'duplicated', 'Product', copy._id, { from: src.name });
  res.status(201).json(copy);
});

router.delete('/:id', async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  logActivity(req, 'deleted', 'Product', product._id, { name: product.name });
  res.json({ ok: true });
});

module.exports = router;
