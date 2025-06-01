const mongoose = require('mongoose');

const ColorSchema = new mongoose.Schema({
  name: { type: String, required: true }
});

module.exports = mongoose.model('Color', ColorSchema); 