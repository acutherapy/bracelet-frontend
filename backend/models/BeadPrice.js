const mongoose = require('mongoose');

const BeadPriceSchema = new mongoose.Schema({
  size: { type: String, enum: ['12mm', '10mm', '8mm', '6mm'], required: true },
  material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  color: { type: mongoose.Schema.Types.ObjectId, ref: 'Color', required: true },
  price: { type: Number, required: true }
});

module.exports = mongoose.model('BeadPrice', BeadPriceSchema); 