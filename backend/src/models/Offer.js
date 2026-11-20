const mongoose = require('mongoose');

// Automatic discounts (no code needed) applied to product prices storewide,
// or to selected categories / brands / products.
const offerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: String,
    discountType: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
    value: { type: Number, required: true, min: 0 },
    maxDiscount: Number,
    appliesTo: { type: String, enum: ['all', 'category', 'brand', 'product'], default: 'all' },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    brands: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Brand' }],
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    badge: { type: String, default: 'Offer' },
    startsAt: Date,
    endsAt: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Offer', offerSchema);
