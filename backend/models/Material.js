const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema({
  name: { type: String, required: true }, // 材质名称，如水晶、玉石、玻璃等
  grade: { type: String, enum: ['上品', '中品', '下品'], required: true }, // 品级
  description: { type: String }
});

module.exports = mongoose.model('Material', MaterialSchema); 