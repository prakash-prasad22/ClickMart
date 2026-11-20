const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: String,
    eyebrow: String,
    image: String,
    ctaLabel: { type: String, default: 'Shop now' },
    link: { type: String, default: '/shop' },
    placement: { type: String, enum: ['hero', 'promo'], default: 'hero', index: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startsAt: Date,
    endsAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Banner', bannerSchema);
