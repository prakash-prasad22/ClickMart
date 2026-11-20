const { Router } = require('express');
const Setting = require('../../models/Setting');
const { logActivity } = require('../../utils/activity');

const router = Router();

const WRITABLE = [
  'storeName', 'tagline', 'supportEmail', 'supportPhone', 'address', 'currency', 'currencySymbol',
  'shippingFee', 'freeShippingAbove', 'taxRate', 'codEnabled', 'onlinePaymentEnabled',
  'serviceablePincodePrefixes', 'storeLocation', 'socials', 'announcement',
];

router.get('/', async (_req, res) => {
  res.json(await Setting.get());
});

router.put('/', async (req, res) => {
  const s = await Setting.get();
  const data = Object.fromEntries(WRITABLE.filter((k) => req.body[k] !== undefined).map((k) => [k, req.body[k]]));
  if (typeof data.serviceablePincodePrefixes === 'string') {
    data.serviceablePincodePrefixes = data.serviceablePincodePrefixes.split(',').map((x) => x.trim()).filter(Boolean);
  }
  s.set(data);
  await s.save();
  logActivity(req, 'updated', 'Settings', s._id, { fields: Object.keys(data) });
  res.json(s);
});

module.exports = router;
