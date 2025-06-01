const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const xlsx = require('xlsx');
const fs = require('fs');

// 新建订单
router.post('/', async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 查询所有订单
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 查询单个订单
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    res.json(order);
  } catch (err) {
    res.status(404).json({ error: 'Order not found' });
  }
});

// 删除订单
router.delete('/:id', async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 导出所有订单（Excel）
router.get('/export/all', async (req, res) => {
  try {
    const orders = await Order.find();
    const data = orders.map(o => ({
      gender: o.gender,
      totalPrice: o.totalPrice,
      totalLength: o.totalLength,
      createdAt: o.createdAt
      // 可根据需要展开更多字段
    }));
    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Orders');
    const filePath = 'orders_export.xlsx';
    xlsx.writeFile(workbook, filePath);
    res.download(filePath, filePath, err => {
      fs.unlinkSync(filePath);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 