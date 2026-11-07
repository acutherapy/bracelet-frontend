# 和合珠定制 UI 改版：验证记录

基准版本：`e4a25f4`（线上 best-stable，`main.371090db.js` 与线上文件哈希一致）

## 结果摘要

| 项目 | 结果 | 文件 |
|---|---|---|
| 新旧对照（30 个用例，同输入） | 完全一致 27/30；已授权变更 3 条（C07=D2，C18/C28=D1）；意外差异 0 | [compare-old-vs-new.md](compare-old-vs-new.md) |
| D1 / D2 回归 | 14/14 通过 | [regress-d1-d2.md](regress-d1-d2.md) |
| 手机 / iPad / 桌面完整流程 | 94 项 ✅ 0 项 ❌ | [verify-devices.md](verify-devices.md) |
| 旧版自身可重复性（固定时间连跑两次） | 30/30 一致 | [data/old-repeatability.md](data/old-repeatability.md) |

已确认的业务调整（2026-11-07）：

- **长度单位显示**：结果统一显示毫米并注明换算来源（如「170.00 毫米 / 由 17 厘米换算」），数值不变。
- **D1**：人珠第一次手动调整即生效；手动选择保留到点击「智能匹配」。同时消除了页面空闲时的无限重渲染（空闲 3 秒 CPU：旧 3.00 秒 → 新 0.00 秒）。
- **D2**：不存在的日期（如 2 月 31 日）显示错误，并禁止用于生成天珠或地珠；有效日期继续使用原算法。

## 截图（screenshots/）

| 文件 | 内容 |
|---|---|
| phone-1-top.jpg | 手机首屏：直接从「1 性别/品级」开始，底部栏提示未选齐 |
| phone-2a-bar.jpg | 人珠还差 1 颗：卡片内说明 + 底部栏提示 |
| phone-3-customer.jpg | 客户信息展开，最后一个字段不被底部栏遮挡 |
| phone-d2-date-error-zh.jpg | 1990 年 2 月 31 日：错误提示 + 生成按钮禁用 |
| ipad-1-top.jpg / ipad-2-ren-short.jpg | iPad 820 宽 |
| desktop-5-sticky.jpg / laptop-5-sticky.jpg | 桌面 1440×900 / 1280×720：整页单一滚动，结果栏 sticky，价格常驻 |
| desktop-lang-en.jpg / desktop-d2-date-error-en.jpg | 英文界面 |

## 如何重跑

测试脚本在 `tools/`，需要本机安装 Google Chrome。

```sh
cd docs/ui-redesign/tools && npm install
# 分别以 /bracelet-frontend/ 子路径启动旧版、新版构建
node serve.js <旧版 build 目录> 5101 &
node serve.js <新版 build 目录> 5102 &
node run.js http://localhost:5101/bracelet-frontend/ adapter-old.js old.json
node run.js http://localhost:5102/bracelet-frontend/ adapter-new.js new.json
node compare.js old.json new.json compare.md
node regress.js http://localhost:5101/bracelet-frontend/ http://localhost:5102/bracelet-frontend/ regress.md
node verify.js <输出目录>   # 在该目录下写入 baseline/verify-v2.md 和 shots/v2/
```

`run.js` 与 `regress.js` 把「当前时间」固定为 2026-11-06 10:30（Pacific/Honolulu），地珠默认日期和时辰因此固定，结果可重复。
