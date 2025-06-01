const express = require('express');
const router = express.Router();
const Material = require('../models/Material');
const multer = require('multer');
const xlsx = require('xlsx');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');

// 获取所有材质
router.get('/', async (req, res) => {
  try {
    const materials = await Material.find();
    res.json(materials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 新增材质
router.post('/', async (req, res) => {
  try {
    const material = new Material(req.body);
    await material.save();
    res.status(201).json(material);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 更新材质
router.put('/:id', async (req, res) => {
  try {
    const material = await Material.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(material);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 删除材质
router.delete('/:id', async (req, res) => {
  try {
    await Material.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 批量导入材质（Excel）
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);
    const materials = await Material.insertMany(data);
    fs.unlinkSync(req.file.path);
    res.json({ success: true, count: materials.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 批量导出材质（Excel）
router.get('/export', async (req, res) => {
  try {
    const materials = await Material.find();
    const data = materials.map(m => ({ name: m.name, grade: m.grade, description: m.description }));
    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Materials');
    const filePath = 'materials_export.xlsx';
    xlsx.writeFile(workbook, filePath);
    res.download(filePath, filePath, err => {
      fs.unlinkSync(filePath);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 