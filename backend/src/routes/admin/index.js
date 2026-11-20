const { Router } = require('express');
const { authenticate, requireStaff, allow } = require('../../middleware/auth');
const { crud, mountCrud } = require('../../utils/crud');
const { upload } = require('../../middleware/upload');
const ApiError = require('../../utils/ApiError');

const Category = require('../../models/Category');
const Brand = require('../../models/Brand');
const Offer = require('../../models/Offer');
const Coupon = require('../../models/Coupon');
const Banner = require('../../models/Banner');
const HelpArticle = require('../../models/HelpArticle');

const router = Router();
router.use(authenticate, requireStaff);

router.use('/dashboard', allow('dashboard'), require('./dashboard'));
router.use('/orders', allow('orders'), require('./orders'));
router.use('/products', allow('products'), require('./products'));
router.use('/inventory', allow('inventory'), require('./inventory'));
router.use('/reviews', allow('reviews'), require('./reviews'));
router.use('/tickets', allow('tickets'), require('./tickets'));
router.use('/customers', allow('customers'), require('./customers'));
router.use('/team', allow('team'), require('./team'));
router.use('/reports', allow('reports'), require('./reports'));
router.use('/settings', allow('settings'), require('./settings'));
router.use('/activity', allow('activity'), require('./activity'));

// Simple CRUD modules
const simple = [
  ['categories', Category, { searchFields: ['name', 'slug'], filters: ['isActive', 'parent'], populate: { path: 'parent', select: 'name' }, defaultSort: 'sortOrder name' }],
  ['brands', Brand, { searchFields: ['name', 'slug', 'origin'], filters: ['isActive'], defaultSort: 'sortOrder name' }],
  ['offers', Offer, { searchFields: ['title', 'badge'], filters: ['isActive', 'appliesTo'] }],
  ['coupons', Coupon, { searchFields: ['code', 'description'], filters: ['isActive'] }],
  ['banners', Banner, { searchFields: ['title', 'subtitle'], filters: ['isActive', 'placement'], defaultSort: 'placement sortOrder' }],
  ['help', HelpArticle, { searchFields: ['title', 'topic', 'body'], filters: ['isPublished', 'topic'], defaultSort: 'topic sortOrder' }],
];
for (const [path, Model, opts] of simple) {
  router.use(`/${path}`, allow(path), mountCrud(Router(), crud(Model, opts)));
}

// Image uploads (any staff member who can edit catalogue / marketing)
router.post('/uploads', upload.array('files', 10), (req, res) => {
  if (!req.files?.length) throw ApiError.badRequest('No files uploaded');
  res.status(201).json({ urls: req.files.map((f) => `/uploads/${f.filename}`) });
});

module.exports = router;
