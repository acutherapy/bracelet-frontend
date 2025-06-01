const express = require('express');
const router = express.Router();
const Color = require('../models/Color');
const multer = require('multer');
const xlsx = require('xlsx');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');

// 获取所有颜色
router.get('/', async (req, res) => {
  try {
    const colors = await Color.find();
    res.json(colors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 新增颜色
router.post('/', async (req, res) => {
  try {
    const color = new Color(req.body);
    await color.save();
    res.status(201).json(color);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 更新颜色
router.put('/:id', async (req, res) => {
  try {
    const color = await Color.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(color);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 删除颜色
router.delete('/:id', async (req, res) => {
  try {
    await Color.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 批量导入颜色（Excel）
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);
    const colors = await Color.insertMany(data);
    fs.unlinkSync(req.file.path);
    res.json({ success: true, count: colors.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 批量导出颜色（Excel）
router.get('/export', async (req, res) => {
  try {
    const colors = await Color.find();
    const data = colors.map(c => ({ name: c.name }));
    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Colors');
    const filePath = 'colors_export.xlsx';
    xlsx.writeFile(workbook, filePath);
    res.download(filePath, filePath, err => {
      fs.unlinkSync(filePath);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 