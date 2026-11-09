// 打印单据专项检查：各种情况都必须一页（Letter / A4），单据数值与屏幕结果一致
const { chromium } = require('playwright-core'); const A = require('./adapter-new.js'); const fs = require('fs');
const [url, out] = process.argv.slice(2);
const FIXED = new Date('2026-11-06T10:30:00-10:00').getTime();
const cust = { name: '测试客户 Test Customer', phone: '808-000-0000', email: 'test.customer@example.com', wechat: 'wx_test', address: '1650 Test Street, Suite 208', city: 'Honolulu', province: 'HI', zipcode: '96817' };
const longCust = { ...cust, name: '非常长的客户姓名用于测试换行 Very Long Customer Name For Wrapping', address: '98-211 Pali Momi Street, Suite 604, Building B, Aiea Medical Center' };
const scen = [
  ['默认（未填任何内容）', 'zh', async p => {}],
  ['完整订单 + 刻字 + 厘米', 'zh', async p => { await A.birth(p, { y: 1978, m: 8, d: 8, h: 17 }); await A.autoSky(p); await A.autoEarth(p); await A.grade(p, '中品'); await A.unit(p, 'cm'); await A.len(p, '17.5'); await A.engrave(p, true); await A.engraveText(p, '和'); await A.customer(p, cust); }],
  ['女 / 下品 / 英寸 / 长地址', 'zh', async p => { await A.gender(p, '女'); await A.grade(p, '下品'); await A.birth(p, { y: 1985, m: 12, d: 31, h: 23 }); await A.autoSky(p); await A.autoEarth(p); await A.unit(p, 'in'); await A.len(p, '7'); await A.customer(p, longCust); }],
  ['人珠 8 颗（300mm）+ 手动', 'zh', async p => { await A.birth(p, { y: 1990, m: 5, d: 15, h: 11 }); await A.autoSky(p); await A.autoEarth(p); await A.len(p, '300'); await A.renOne(p, 0, '0'); await A.customer(p, cust); }],
  ['英文', 'en', async p => { await A.birth(p, { y: 1978, m: 8, d: 8, h: 17 }); await A.autoSky(p); await A.autoEarth(p); await A.engrave(p, true); await A.engraveText(p, 'AB'); await A.customer(p, cust); }],
  ['德文（文字最长）', 'de', async p => { await A.birth(p, { y: 1978, m: 8, d: 8, h: 17 }); await A.autoSky(p); await A.autoEarth(p); await A.engrave(p, true); await A.engraveText(p, 'AB'); await A.customer(p, longCust); }],
  ['日文', 'ja', async p => { await A.birth(p, { y: 1978, m: 8, d: 8, h: 17 }); await A.autoSky(p); await A.autoEarth(p); await A.customer(p, cust); }],
];
const pages = buf => +((buf.toString('latin1').match(/\/Type\s*\/Pages[^>]*?\/Count\s+(\d+)/) || [])[1] || -1);
(async () => {
  const b = await chromium.launch({ channel: 'chrome' }); const rows = [];
  for (const [name, lng, fn] of scen) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, timezoneId: 'Pacific/Honolulu' });
    await ctx.addInitScript(ms => { const R = Date; class D extends R { constructor(...a) { super(...(a.length ? a : [ms])); } static now() { return ms; } } D.UTC = R.UTC; D.parse = R.parse; window.Date = D; }, FIXED);
    const p = await ctx.newPage(); await p.goto(url + '?lng=' + lng, { waitUntil: 'networkidle' }); await p.waitForTimeout(100);
    await fn(p); await p.waitForTimeout(200);
    const st = await A.state(p); const pr = await A.printText(p);
    const letter = pages(await p.pdf({ format: 'Letter', printBackground: true })), a4 = pages(await p.pdf({ format: 'A4', printBackground: true }));
    const statSame = pr.stats.join(',') === st.stat, priceSame = pr.price === st.price;
    const ok = letter === 1 && a4 === 1 && statSame && priceSame && pr.visible;
    rows.push(`| ${name} | ${lng} | ${letter} | ${a4} | ${pr.price} = ${st.price} ${priceSame ? '✅' : '❌'} | ${pr.stats.join(',')} ${statSame ? '✅' : '❌'} | ${ok ? '✅' : '❌'} |`);
    await ctx.close(); process.stdout.write('.');
  }
  await b.close();
  const md = `# 打印 / 保存 PDF 单据检查\n\n| 情况 | 语言 | Letter 页数 | A4 页数 | 价格（单据 = 屏幕） | 五色统计（单据 = 屏幕） | 结果 |\n|---|---|---|---|---|---|---|\n${rows.join('\n')}\n\n通过 ${rows.filter(r => r.endsWith('✅ |')).length}/${rows.length}\n`;
  fs.writeFileSync(out, md); console.log('\n' + md);
})();
