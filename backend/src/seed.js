/* eslint-disable no-console */
/**
 * Seeds an admin account, store settings and a starter catalogue.
 *   npm run seed            → creates admin + demo data (skips if catalogue exists)
 *   npm run seed -- --fresh → wipes catalogue/marketing collections first
 */
const mongoose = require('mongoose');
const env = require('./config/env');
const connectDB = require('./config/db');
const User = require('./models/User');
const Category = require('./models/Category');
const Brand = require('./models/Brand');
const Product = require('./models/Product');
const Banner = require('./models/Banner');
const Offer = require('./models/Offer');
const Coupon = require('./models/Coupon');
const HelpArticle = require('./models/HelpArticle');
const Setting = require('./models/Setting');

const fresh = process.argv.includes('--fresh');

async function run() {
  await connectDB();

  // ── Admin ───────────────────────────────────────────────
  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@clickmart.local').toLowerCase();
  let admin = await User.findOne({ email });
  if (!admin) {
    admin = await User.create({
      name: process.env.SEED_ADMIN_NAME || 'Admin',
      email,
      password: process.env.SEED_ADMIN_PASSWORD || 'ChangeMe@123',
      role: 'admin',
    });
    console.log(`✓ Admin created: ${email}`);
  } else {
    console.log(`• Admin exists: ${email}`);
  }
  await Setting.get();

  if (fresh) {
    await Promise.all([Category, Brand, Product, Banner, Offer, Coupon, HelpArticle].map((M) => M.deleteMany({})));
    console.log('✓ Cleared catalogue collections');
  } else if (await Product.estimatedDocumentCount()) {
    console.log('• Catalogue already has products — skipping demo data (use --fresh to reset)');
    return;
  }

  // ── Categories ──────────────────────────────────────────
  const [dryFruits, sarees, gifting] = await Category.create([
    { name: 'Dry Fruits', description: 'Hand-sorted, premium grade nuts & dried fruits', sortOrder: 1, isFeatured: true },
    { name: 'Sarees', description: 'Handloom & designer sarees from across India', sortOrder: 2, isFeatured: true },
    { name: 'Gift Hampers', description: 'Festive hampers for every occasion', sortOrder: 3, isFeatured: true },
  ]);
  const sub = await Category.create([
    { name: 'Almonds', parent: dryFruits._id, sortOrder: 1 },
    { name: 'Cashews', parent: dryFruits._id, sortOrder: 2 },
    { name: 'Pistachios', parent: dryFruits._id, sortOrder: 3 },
    { name: 'Dates & Figs', parent: dryFruits._id, sortOrder: 4 },
    { name: 'Silk Sarees', parent: sarees._id, sortOrder: 1 },
    { name: 'Cotton Sarees', parent: sarees._id, sortOrder: 2 },
  ]);
  const cat = Object.fromEntries(sub.map((c) => [c.name, c._id]));

  // ── Brands ──────────────────────────────────────────────
  const brands = await Brand.create([
    { name: 'Kashmir Valley', origin: 'Srinagar, J&K', sortOrder: 1 },
    { name: 'Nutty Gritties', origin: 'India', sortOrder: 2 },
    { name: 'Bhagalpur Looms', origin: 'Bhagalpur, Bihar', sortOrder: 3 },
    { name: 'Banaras Heritage', origin: 'Varanasi, UP', sortOrder: 4 },
    { name: 'Madhubani Craft', origin: 'Madhubani, Bihar', sortOrder: 5 },
  ]);
  const b = Object.fromEntries(brands.map((x) => [x.name, x._id]));

  const weights = (base, stock = 40) => [
    { name: '250 g', price: base, mrp: Math.round(base * 1.2), stock, sku: '' },
    { name: '500 g', price: Math.round(base * 1.9), mrp: Math.round(base * 2.3), stock, sku: '' },
    { name: '1 kg', price: Math.round(base * 3.6), mrp: Math.round(base * 4.4), stock: Math.round(stock / 2), sku: '' },
  ];

  await Product.create([
    {
      name: 'California Almonds — Premium', category: cat.Almonds, brand: b['Nutty Gritties'], variantLabel: 'Weight',
      shortDescription: 'Crunchy, naturally sweet whole almonds. Hand-sorted, no broken kernels.',
      description: 'Our premium almonds are sourced from the finest orchards and hand-sorted for size and quality. Rich in vitamin E, protein and healthy fats — perfect for soaking overnight or snacking straight from the jar.',
      variants: weights(299), isFeatured: true, tags: ['almonds', 'badam', 'healthy'],
      attributes: [{ key: 'Origin', value: 'California, USA' }, { key: 'Shelf life', value: '9 months' }],
    },
    {
      name: 'Mamra Almonds', category: cat.Almonds, brand: b['Kashmir Valley'], variantLabel: 'Weight',
      shortDescription: 'Rare, oil-rich Mamra badam — the king of almonds.', variants: weights(749, 20), isFeatured: true,
      tags: ['almonds', 'mamra'], attributes: [{ key: 'Origin', value: 'Afghanistan' }],
    },
    {
      name: 'W240 Whole Cashews', category: cat.Cashews, brand: b['Nutty Gritties'], variantLabel: 'Weight',
      shortDescription: 'Large, creamy W240 grade cashews from Goa.', variants: weights(349), isFeatured: true,
      tags: ['cashew', 'kaju'], attributes: [{ key: 'Grade', value: 'W240' }, { key: 'Origin', value: 'Goa' }],
    },
    {
      name: 'Roasted Salted Pistachios', category: cat.Pistachios, brand: b['Nutty Gritties'], variantLabel: 'Weight',
      shortDescription: 'Iranian pistachios, slow-roasted with a pinch of sea salt.', variants: weights(399), tags: ['pista'],
    },
    {
      name: 'Kashmiri Walnut Kernels', category: dryFruits._id, brand: b['Kashmir Valley'], variantLabel: 'Weight',
      shortDescription: 'Light halves, freshly cracked from the Kashmir valley.', variants: weights(449), isFeatured: true, tags: ['walnut', 'akhrot'],
    },
    {
      name: 'Medjool Dates', category: cat['Dates & Figs'], brand: b['Nutty Gritties'], variantLabel: 'Weight',
      shortDescription: 'Soft, caramel-like jumbo Medjool dates.', variants: weights(499), tags: ['dates', 'khajoor'],
    },
    {
      name: 'Afghan Anjeer (Dried Figs)', category: cat['Dates & Figs'], brand: b['Kashmir Valley'], variantLabel: 'Weight',
      shortDescription: 'Sun-dried figs, naturally sweet and fibre rich.', variants: weights(549), tags: ['anjeer', 'figs'],
    },
    {
      name: 'Bhagalpuri Tussar Silk Saree', category: cat['Silk Sarees'], brand: b['Bhagalpur Looms'], variantLabel: 'Colour',
      shortDescription: 'Handwoven Tussar silk with a natural golden sheen.',
      description: 'Woven by master weavers in Bhagalpur, this Tussar silk saree carries the characteristic texture and lustre of wild silk. Comes with an unstitched blouse piece.',
      variants: [
        { name: 'Mustard Gold', price: 4499, mrp: 5999, stock: 6 },
        { name: 'Deep Maroon', price: 4499, mrp: 5999, stock: 4 },
        { name: 'Ivory', price: 4299, mrp: 5799, stock: 3 },
      ],
      isFeatured: true, tags: ['tussar', 'silk', 'handloom'],
      attributes: [{ key: 'Fabric', value: 'Tussar Silk' }, { key: 'Length', value: '6.3 m with blouse' }, { key: 'Care', value: 'Dry clean only' }],
    },
    {
      name: 'Banarasi Katan Silk Saree', category: cat['Silk Sarees'], brand: b['Banaras Heritage'], variantLabel: 'Colour',
      shortDescription: 'Pure Katan silk with intricate zari brocade.',
      variants: [
        { name: 'Royal Red', price: 12999, mrp: 15999, stock: 3 },
        { name: 'Emerald', price: 12999, mrp: 15999, stock: 2 },
      ],
      isFeatured: true, tags: ['banarasi', 'wedding', 'zari'],
      attributes: [{ key: 'Fabric', value: 'Pure Katan Silk' }, { key: 'Work', value: 'Zari brocade' }],
    },
    {
      name: 'Madhubani Hand-painted Cotton Saree', category: cat['Cotton Sarees'], brand: b['Madhubani Craft'],
      shortDescription: 'Breathable cotton, hand-painted with traditional Madhubani motifs.',
      price: 2499, mrp: 3299, stock: 8, sku: 'MDB-CTN-01', tags: ['madhubani', 'cotton', 'handpainted'],
      attributes: [{ key: 'Fabric', value: 'Cotton' }, { key: 'Art', value: 'Madhubani' }],
    },
    {
      name: 'Festive Dry Fruit Hamper', category: gifting._id, brand: b['Nutty Gritties'],
      shortDescription: 'Almonds, cashews, pistachios & raisins in a keepsake wooden box.',
      price: 1499, mrp: 1899, stock: 25, sku: 'HMP-FEST-01', isFeatured: true, tags: ['gift', 'diwali', 'hamper'],
    },
  ]);

  await Banner.create([
    { title: 'The Harvest Edit', eyebrow: 'New season', subtitle: 'Hand-sorted almonds, cashews & walnuts — straight from the orchards to your doorstep in Patna.', link: '/shop?category=dry-fruits', ctaLabel: 'Shop dry fruits', placement: 'hero', sortOrder: 1 },
    { title: 'Woven in Bihar', eyebrow: 'Handloom stories', subtitle: 'Bhagalpuri Tussar & Madhubani sarees, made by master weavers.', link: '/shop?category=sarees', ctaLabel: 'Explore sarees', placement: 'hero', sortOrder: 2 },
    { title: 'Gift hampers', subtitle: 'Curated for festivals & weddings', link: '/shop?category=gift-hampers', placement: 'promo', sortOrder: 1 },
  ]);

  await Offer.create({ title: 'Silk Week — 10% off sarees', badge: '10% off', discountType: 'percentage', value: 10, appliesTo: 'category', categories: [sarees._id, ...sub.filter((c) => String(c.parent) === String(sarees._id)).map((c) => c._id)] });
  await Coupon.create([
    { code: 'WELCOME10', description: '10% off your first order (max ₹200)', discountType: 'percentage', value: 10, maxDiscount: 200, minOrderValue: 499, perUserLimit: 1 },
    { code: 'PATNA100', description: '₹100 off on orders above ₹1,499', discountType: 'flat', value: 100, minOrderValue: 1499, perUserLimit: 3 },
  ]);

  await HelpArticle.create([
    { topic: 'Orders', title: 'How do I track my order?', body: 'Go to Account → Orders and open any order to see its live status. We also send SMS updates when your order is packed, shipped and out for delivery.' },
    { topic: 'Orders', title: 'Can I cancel my order?', body: 'Orders can be cancelled from the order page until they are packed. After that, please raise a support ticket and our team will help you.' },
    { topic: 'Delivery', title: 'Where do you deliver?', body: 'We currently deliver across Patna (pincodes starting 800 and 801). Delivery to other cities and abroad is coming soon.' },
    { topic: 'Delivery', title: 'How long does delivery take?', body: 'Most orders within Patna are delivered within 24–48 hours.' },
    { topic: 'Payments', title: 'Which payment methods are accepted?', body: 'Cash on Delivery is available on all orders. Online payments (UPI, cards, net banking) are coming soon.' },
    { topic: 'Returns', title: 'What is your return policy?', body: 'Sarees can be returned within 7 days if unused with tags intact. Food items like dry fruits cannot be returned once opened, but if anything arrives damaged we will replace it — just raise a ticket with a photo.' },
  ]);

  console.log('✓ Demo catalogue, banners, offers, coupons and help articles created');
}

run()
  .catch((err) => { console.error('✗ Seed failed:', err.message); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());

void env;
