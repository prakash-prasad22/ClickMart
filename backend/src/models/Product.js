const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

// A variant is a purchasable option: 250g / 500g / 1kg, or a saree colour.
const variantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, trim: true },
  price: { type: Number, required: true, min: 0 },
  mrp: { type: Number, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    shortDescription: { type: String, trim: true },
    description: String,
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', index: true },
    images: [String],
    // Used when the product has no variants
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, min: 0 },
    sku: { type: String, trim: true },
    stock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    variantLabel: { type: String, default: 'Size' }, // e.g. "Weight", "Colour"
    variants: [variantSchema],
    attributes: [{ key: String, value: String, _id: false }], // Fabric: Silk, Origin: Kashmir
    tags: [{ type: String, trim: true, lowercase: true }],
    isFeatured: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    seo: { title: String, description: String },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', tags: 'text', shortDescription: 'text' });

productSchema.pre('validate', function prepare() {
  if (!this.slug && this.name) this.slug = `${slugify(this.name)}-${Math.random().toString(36).slice(2, 6)}`;
  // Base price/stock mirror the active variants so listings, sorting & stock checks work.
  const active = (this.variants || []).filter((v) => v.isActive !== false);
  if (active.length) {
    const cheapest = active.reduce((a, b) => (b.price < a.price ? b : a));
    this.price = cheapest.price;
    this.mrp = cheapest.mrp || cheapest.price;
    this.stock = active.reduce((s, v) => s + (v.stock || 0), 0);
  }
  if (!this.mrp || this.mrp < this.price) this.mrp = this.price;
});

module.exports = mongoose.model('Product', productSchema);
