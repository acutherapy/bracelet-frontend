const express = require('express');
const router = express.Router();
const BeadPrice = require('../models/BeadPrice');
const multer = require('multer');
const xlsx = require('xlsx');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const Material = require('../models/Material');
const Color = require('../models/Color');

// 获取所有珠子价格
router.get('/', async (req, res) => {
  try {
    const prices = await BeadPrice.find().populate('material').populate('color');
    res.json(prices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 新增珠子价格
router.post('/', async (req, res) => {
  try {
    const price = new BeadPrice(req.body);
    await price.save();
    res.status(201).json(price);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 更新珠子价格
router.put('/:id', async (req, res) => {
  try {
    const price = await BeadPrice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(price);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 删除珠子价格
router.delete('/:id', async (req, res) => {
  try {
    await BeadPrice.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 批量导入珠子价格（Excel）
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);
    // 需将材质和颜色名称转为ObjectId
    const prices = [];
    for (const row of data) {
      const material = await Material.findOne({ name: row.material, grade: row.grade });
      const color = await Color.findOne({ name: row.color });
      if (material && color) {
        prices.push({
          size: row.size,
          material: material._id,
          color: color._id,
          price: row.price
        });
      }
    }
    const result = await require('../models/BeadPrice').insertMany(prices);
    fs.unlinkSync(req.file.path);
    res.json({ success: true, count: result.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 批量导出珠子价格（Excel）
router.get('/export', async (req, res) => {
  try {
    const prices = await require('../models/BeadPrice').find().populate('material').populate('color');
    const data = prices.map(p => ({
      size: p.size,
      material: p.material?.name,
      grade: p.material?.grade,
      color: p.color?.name,
      price: p.price
    }));
    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'BeadPrices');
    const filePath = 'bead_prices_export.xlsx';
    xlsx.writeFile(workbook, filePath);
    res.download(filePath, filePath, err => {
      fs.unlinkSync(filePath);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 