const Product = require('../models/Product');
const ApiError = require('./ApiError');

/**
 * Atomically decrement stock for each order line. If any line fails
 * (sold out between quote and checkout), previously reserved lines are released.
 */
async function reserveStock(lines) {
  const done = [];
  for (const l of lines) {
    const filter = l.variantId
      ? { _id: l.product, variants: { $elemMatch: { _id: l.variantId, stock: { $gte: l.qty } } } }
      : { _id: l.product, stock: { $gte: l.qty } };
    const update = l.variantId
      ? { $inc: { 'variants.$.stock': -l.qty, stock: -l.qty, soldCount: l.qty } }
      : { $inc: { stock: -l.qty, soldCount: l.qty } };
    const r = await Product.updateOne(filter, update);
    if (!r.modifiedCount) {
      await releaseStock(done);
      throw new ApiError(409, `${l.name}${l.variantName ? ` (${l.variantName})` : ''} just went out of stock`);
    }
    done.push(l);
  }
}

async function releaseStock(lines) {
  for (const l of lines) {
    const filter = l.variantId ? { _id: l.product, 'variants._id': l.variantId } : { _id: l.product };
    const update = l.variantId
      ? { $inc: { 'variants.$.stock': l.qty, stock: l.qty, soldCount: -l.qty } }
      : { $inc: { stock: l.qty, soldCount: -l.qty } };
    await Product.updateOne(filter, update);
  }
}

module.exports = { reserveStock, releaseStock };
