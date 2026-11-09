// usage: node run.js <url> <adapter.js> <out.json>
const { chromium } = require('playwright-core');
const fs = require('fs');
const [url, adapterPath, out, casesFile] = process.argv.slice(2);
const cases = require(require('path').resolve(__dirname, casesFile || './cases.js'));
// 固定时间与时区：地珠默认日期/时辰取当前时间，固定后结果可重复
const FIXED_TIME = '2026-11-06T10:30:00', TZ = 'Pacific/Honolulu';
const A = require(require('path').resolve(adapterPath));

(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const results = [];
  for (const c of cases) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, timezoneId: TZ });
    // 只固定“当前时间”（无参数 new Date() 与 Date.now()），带参数的日期计算不受影响
    await ctx.addInitScript(ms => { const R = Date; class D extends R { constructor(...a) { super(...(a.length ? a : [ms])); } static now() { return ms; } } D.UTC = R.UTC; D.parse = R.parse; window.Date = D; }, new Date(FIXED_TIME + '-10:00').getTime());
    const page = await ctx.newPage();
    const dialogs = [], errors = [];
    page.on('dialog', d => { dialogs.push(d.message()); d.dismiss(); });
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(url + (url.includes('?') ? '&' : '?') + 'lng=zh', { waitUntil: 'networkidle' });
    await page.waitForTimeout(80);
    const r = { id: c.id, name: c.name, steps: c.steps, snaps: [] };
    for (const [act, ...args] of c.steps) {
      if (act === 'sky' || act === 'earth') { for (let i = 0; i < 5; i++) await A[act + 'One'](page, i, String(args[0][i])); }
      else if (act === 'snap') r.snaps.push(await A.state(page));
      else if (act === 'print') r.print = await A.printText(page);
      else await A[act](page, ...args);
      await page.waitForTimeout(80);
    }
    r.state = await A.state(page);
    r.dialogs = dialogs; r.errors = errors;
    results.push(r);
    await ctx.close();
    process.stdout.write(c.id + ' ');
  }
  await b.close();
  fs.writeFileSync(out, JSON.stringify({ url, fixedTime: FIXED_TIME + ' ' + TZ, date: new Date().toISOString(), results }, null, 2));
  console.log('\nsaved', out);
})();
