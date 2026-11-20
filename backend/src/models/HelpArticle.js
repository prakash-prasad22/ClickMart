const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

const helpArticleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    topic: { type: String, default: 'General', trim: true }, // Orders, Shipping, Returns, Payments...
    body: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

helpArticleSchema.pre('validate', function setSlug() {
  if (!this.slug && this.title) this.slug = slugify(this.title);
});

module.exports = mongoose.model('HelpArticle', helpArticleSchema);
