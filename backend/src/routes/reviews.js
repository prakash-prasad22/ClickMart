const { Router } = require('express');
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.post('/', authenticate, async (req, res) => {
  const { product, rating, title, comment } = req.body;
  if (!mongoose.isValidObjectId(product)) throw ApiError.badRequest('Invalid product');
  const r = parseInt(rating, 10);
  if (!(r >= 1 && r <= 5)) throw ApiError.badRequest('Rating must be between 1 and 5');
  if (!(await Product.exists({ _id: product }))) throw ApiError.notFound('Product not found');

  const exists = await Review.exists({ product, user: req.user._id });
  if (exists) throw new ApiError(409, 'You have already reviewed this product');

  const verifiedPurchase = !!(await Order.exists({ user: req.user._id, 'items.product': product, status: 'delivered' }));
  const review = await Review.create({
    product,
    user: req.user._id,
    rating: r,
    title: title ? String(title).slice(0, 120) : undefined,
    comment: comment ? String(comment).slice(0, 2000) : undefined,
    verifiedPurchase,
    status: 'pending', // moderated from the admin panel
  });
  res.status(201).json(review);
});

module.exports = router;
