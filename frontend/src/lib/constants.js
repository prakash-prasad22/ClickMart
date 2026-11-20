export const ORDER_STATUSES = ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];

// Tone → badge colour (see components/ui/Badge.js)
export const ORDER_STATUS_TONE = {
  pending: 'warning',
  confirmed: 'info',
  packed: 'info',
  shipped: 'info',
  out_for_delivery: 'accent',
  delivered: 'success',
  cancelled: 'danger',
  returned: 'neutral',
};

export const PAYMENT_STATUS_TONE = { pending: 'warning', paid: 'success', failed: 'danger', refunded: 'neutral' };
export const TICKET_STATUS_TONE = { open: 'warning', in_progress: 'info', resolved: 'success', closed: 'neutral' };
export const PRIORITY_TONE = { low: 'neutral', medium: 'info', high: 'warning', urgent: 'danger' };
export const REVIEW_STATUS_TONE = { pending: 'warning', approved: 'success', rejected: 'danger' };

export const TICKET_CATEGORIES = ['order', 'delivery', 'payment', 'return', 'product', 'account', 'other'];

// Customer-facing progress for an order
export const ORDER_TRACK_STEPS = ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
export const ORDER_STEP_LABEL = {
  pending: 'Order placed',
  confirmed: 'Confirmed',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};
