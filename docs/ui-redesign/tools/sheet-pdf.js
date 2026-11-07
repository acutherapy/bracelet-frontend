// 打印单据：Letter / A4 生成 PDF + 打印媒体截图
const { chromium } = require('playwright-core'); const A = require('./adapter-new.js');
const [url, outDir, lng = 'zh', full = '1'] = process.argv.slice(2);
(async () => { const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage();
  await p.goto(url + '?lng=' + lng, { waitUntil: 'networkidle' });
  if (full === '1') {
    await A.birth(p, { y: 1978, m: 8, d: 8, h: 17 }); await A.autoSky(p); await A.earthDate(p, { y: 2026, m: 11, d: 6, h: 9 }); await A.autoEarth(p);
    await A.grade(p, '中品'); await A.unit(p, 'cm'); await A.len(p, '17.5'); await A.engrave(p, true); await A.engraveText(p, '和');
    await A.customer(p, { name: '测试客户 Test Customer', phone: '808-000-0000', email: 'test.customer@example.com', wechat: 'wx_test', address: '1650 Test Street, Suite 208', city: 'Honolulu', province: 'HI', zipcode: '96817' });
  }
  await p.waitForTimeout(300);
  for (const fmt of ['Letter', 'A4']) await p.pdf({ path: `${outDir}/sheet-${lng}-${full}-${fmt}.pdf`, format: fmt, printBackground: true, preferCSSPageSize: true });
  await p.emulateMedia({ media: 'print' }); await p.setViewportSize({ width: 726, height: 960 }); await p.waitForTimeout(200);
  const h = await p.evaluate(() => document.querySelector('.bc-sheet').getBoundingClientRect().height);
  await p.screenshot({ path: `${outDir}/sheet-${lng}-${full}.png`, fullPage: true }); console.log(lng, full, 'sheet height px', Math.round(h)); await b.close(); })();
