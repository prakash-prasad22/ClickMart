const { Router } = require('express');
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const { authenticate } = require('../middleware/auth');
const { humanRef } = require('../utils/ids');

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const items = await Ticket.find({ user: req.user._id }).sort('-updatedAt').select('-messages').populate('order', 'orderNumber').lean();
  res.json(items);
});

router.post('/', async (req, res) => {
  const { subject, category, orderId, message } = req.body;
  if (!subject || !message) throw ApiError.badRequest('Subject and message are required');
  let order;
  if (orderId && mongoose.isValidObjectId(orderId)) {
    order = await Order.findOne({ _id: orderId, user: req.user._id }).select('_id');
  }
  const ticket = await Ticket.create({
    ticketNumber: humanRef('TK'),
    user: req.user._id,
    order: order?._id,
    subject: String(subject).slice(0, 160),
    category,
    messages: [{ author: req.user._id, authorName: req.user.name || 'You', body: String(message).slice(0, 4000) }],
  });
  res.status(201).json(ticket);
});

router.get('/:id', async (req, res) => {
  const ticket = await Ticket.findOne({ _id: req.params.id, user: req.user._id }).populate('order', 'orderNumber').lean();
  if (!ticket) throw ApiError.notFound('Ticket not found');
  res.json(ticket);
});

router.post('/:id/messages', async (req, res) => {
  const ticket = await Ticket.findOne({ _id: req.params.id, user: req.user._id });
  if (!ticket) throw ApiError.notFound('Ticket not found');
  if (ticket.status === 'closed') throw ApiError.badRequest('This ticket is closed. Please open a new one');
  if (!req.body.body) throw ApiError.badRequest('Message cannot be empty');
  ticket.messages.push({ author: req.user._id, authorName: req.user.name || 'Customer', body: String(req.body.body).slice(0, 4000) });
  if (ticket.status === 'resolved') ticket.status = 'open';
  await ticket.save();
  res.json(ticket);
});

module.exports = router;
