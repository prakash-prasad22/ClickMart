const { Router } = require('express');
const Review = require('../../models/Review');
const ApiError = require('../../utils/ApiError');
const { escapeRegex } = require('../../utils/sanitize');
const { logActivity } = require('../../utils/activity');

const router = Router();

router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
  const query = {};
  if (req.query.status) query.status = req.query.status;
  if (req.query.rating) query.rating = parseInt(req.query.rating, 10);
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    query.$or = [{ title: rx }, { comment: rx }];
  }
  const [items, total, counts] = await Promise.all([
    Review.find(query).sort('-createdAt').skip((page - 1) * limit).limit(limit)
      .populate('product', 'name slug images').populate('user', 'name phone').lean(),
    Review.countDocuments(query),
    Review.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) || 1, counts: Object.fromEntries(counts.map((c) => [c._id, c.count])) });
});

router.patch('/:id', async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');
  if (!['pending', 'approved', 'rejected'].includes(req.body.status)) throw ApiError.badRequest('Invalid status');
  review.status = req.body.status;
  await review.save();
  await Review.recalc(review.product);
  logActivity(req, `review_${review.status}`, 'Review', review._id);
  res.json(review);
});

router.delete('/:id', async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');
  await Review.recalc(review.product);
  logActivity(req, 'deleted', 'Review', review._id);
  res.json({ ok: true });
});

module.exports = router;
