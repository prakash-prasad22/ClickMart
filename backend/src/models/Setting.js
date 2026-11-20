const mongoose = require('mongoose');

// Singleton document holding store-wide configuration.
const settingSchema = new mongoose.Schema(
  {
    storeName: { type: String, default: 'ClickMart' },
    tagline: { type: String, default: 'Finest dry fruits & handloom sarees, delivered across Patna' },
    supportEmail: { type: String, default: 'support@example.com' },
    supportPhone: { type: String, default: '+91 00000 00000' },
    address: { type: String, default: 'Patna, Bihar, India' },
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    shippingFee: { type: Number, default: 49 },
    freeShippingAbove: { type: Number, default: 999 },
    taxRate: { type: Number, default: 0 }, // % added on top (keep 0 when prices are GST-inclusive)
    codEnabled: { type: Boolean, default: true },
    onlinePaymentEnabled: { type: Boolean, default: false },
    // Leave empty to deliver everywhere. Patna pincodes start with 800/801.
    serviceablePincodePrefixes: { type: [String], default: ['800', '801'] },
    storeLocation: { lat: { type: Number, default: 25.5941 }, lng: { type: Number, default: 85.1376 } },
    socials: { instagram: String, facebook: String, whatsapp: String },
    announcement: { type: String, default: 'Free delivery across Patna on orders above ₹999' },
  },
  { timestamps: true }
);

settingSchema.statics.get = async function get() {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

module.exports = mongoose.model('Setting', settingSchema);
