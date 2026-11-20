const { Router } = require('express');
const Product = require('../../models/Product');
const ApiError = require('../../utils/ApiError');
const { escapeRegex } = require('../../utils/sanitize');
const { logActivity } = require('../../utils/activity');

const router = Router();

router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 25);
  const query = {};
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    query.$or = [{ name: rx }, { sku: rx }, { 'variants.sku': rx }];
  }
  if (req.query.status === 'out') query.stock = { $lte: 0 };
  if (req.query.status === 'low') query.$expr = { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }] };
  if (req.query.status === 'in') query.$expr = { $gt: ['$stock', '$lowStockThreshold'] };

  const [items, total, summary] = await Promise.all([
    Product.find(query).select('name slug images sku stock lowStockThreshold variants variantLabel isActive price')
      .sort(req.query.sort || 'stock').skip((page - 1) * limit).limit(limit).lean(),
    Product.countDocuments(query),
    Product.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          out: { $sum: { $cond: [{ $lte: ['$stock', 0] }, 1, 0] } },
          low: { $sum: { $cond: [{ $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }] }, 1, 0] } },
          units: { $sum: '$stock' },
          value: { $sum: { $multiply: ['$stock', '$price'] } },
        },
      },
    ]),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) || 1, summary: summary[0] || { total: 0, out: 0, low: 0, units: 0, value: 0 } });
});

// Body: { variantId?, mode: 'set' | 'adjust', value: number, reason?, lowStockThreshold? }
router.patch('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  const { variantId, mode = 'set', reason } = req.body;
  const value = parseInt(req.body.value, 10);

  let before;
  let after;
  if (!Number.isNaN(value)) {
    const target = variantId ? product.variants.id(variantId) : product;
    if (!target) throw ApiError.notFound('Variant not found');
    if (!variantId && product.variants.length) throw ApiError.badRequest('This product has variants — update a variant');
    before = target.stock;
    after = Math.max(0, mode === 'adjust' ? before + value : value);
    target.stock = after;
  }
  if (req.body.lowStockThreshold !== undefined) product.lowStockThreshold = parseInt(req.body.lowStockThreshold, 10) || 0;
  await product.save();

  logActivity(req, 'stock_updated', 'Product', product._id, {
    name: product.name,
    variant: variantId ? product.variants.id(variantId)?.name : undefined,
    before, after, reason,
  });
  res.json(product);
});

module.exports = router;
