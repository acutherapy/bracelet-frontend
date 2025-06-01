const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  gender: { type: String, enum: ['男', '女'], required: true },
  mainBead: {
    size: String,
    material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
    color: { type: mongoose.Schema.Types.ObjectId, ref: 'Color' },
    grade: String,
    price: Number,
    engraving: { type: Boolean, default: false }
  },
  skyBeads: [
    {
      size: String,
      material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
      color: { type: mongoose.Schema.Types.ObjectId, ref: 'Color' },
      grade: String,
      price: Number
    }
  ],
  earthBeads: [
    {
      size: String,
      material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
      color: { type: mongoose.Schema.Types.ObjectId, ref: 'Color' },
      grade: String,
      price: Number
    }
  ],
  artBeads: [
    {
      size: String,
      material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
      color: { type: mongoose.Schema.Types.ObjectId, ref: 'Color' },
      grade: String,
      price: Number
    }
  ],
  engraving: {
    enabled: { type: Boolean, default: false },
    price: { type: Number, default: 75 }
  },
  totalPrice: Number,
  totalLength: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema); 