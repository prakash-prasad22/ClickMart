const { Router } = require('express');
const User = require('../../models/User');
const ApiError = require('../../utils/ApiError');
const { STAFF_ROLES } = require('../../config/permissions');
const { logActivity } = require('../../utils/activity');

const router = Router();

router.get('/', async (_req, res) => {
  const items = await User.find({ role: { $in: STAFF_ROLES } }).sort('role name').select('name email phone role isActive lastLoginAt createdAt').lean();
  res.json({ items, total: items.length, page: 1, pages: 1 });
});

router.post('/', async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  if (!name || !email || !password) throw ApiError.badRequest('Name, email and password are required');
  if (!STAFF_ROLES.includes(role)) throw ApiError.badRequest('Invalid role');
  if (String(password).length < 8) throw ApiError.badRequest('Password must be at least 8 characters');
  const user = await User.create({ name, email, phone: phone || undefined, password, role });
  logActivity(req, 'created', 'Team', user._id, { name, role });
  res.status(201).json(user.toSafeJSON());
});

async function ensureAnotherAdmin(excludeId) {
  const admins = await User.countDocuments({ role: 'admin', isActive: true, _id: { $ne: excludeId } });
  if (!admins) throw ApiError.badRequest('At least one active admin is required');
}

async function update(req, res) {
  const user = await User.findOne({ _id: req.params.id, role: { $in: STAFF_ROLES } });
  if (!user) throw ApiError.notFound('Team member not found');
  const { name, email, phone, role, isActive, password } = req.body;
  if (role && !STAFF_ROLES.includes(role)) throw ApiError.badRequest('Invalid role');
  if (user.role === 'admin' && ((role && role !== 'admin') || isActive === false)) await ensureAnotherAdmin(user._id);
  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (phone !== undefined) user.phone = phone || undefined;
  if (role) user.role = role;
  if (isActive !== undefined) user.isActive = !!isActive;
  if (password) {
    if (String(password).length < 8) throw ApiError.badRequest('Password must be at least 8 characters');
    user.password = password;
  }
  await user.save();
  logActivity(req, 'updated', 'Team', user._id, { name: user.name, role: user.role, isActive: user.isActive });
  res.json(user.toSafeJSON());
}
router.put('/:id', update);
router.patch('/:id', update);

router.delete('/:id', async (req, res) => {
  if (String(req.user._id) === req.params.id) throw ApiError.badRequest('You cannot remove yourself');
  const user = await User.findOne({ _id: req.params.id, role: { $in: STAFF_ROLES } });
  if (!user) throw ApiError.notFound('Team member not found');
  if (user.role === 'admin') await ensureAnotherAdmin(user._id);
  await user.deleteOne();
  logActivity(req, 'deleted', 'Team', user._id, { name: user.name });
  res.json({ ok: true });
});

module.exports = router;
