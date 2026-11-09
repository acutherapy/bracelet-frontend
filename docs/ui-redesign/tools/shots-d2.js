const { chromium } = require('playwright-core');
const S = process.argv[2];
(async () => { const b = await chromium.launch({ channel: 'chrome' });
  for (const [n, vp, lng] of [['phone', { width: 390, height: 844 }, 'zh'], ['desktop', { width: 1440, height: 900 }, 'en']]) {
    const p = await (await b.newContext({ viewport: vp, deviceScaleFactor: n === 'phone' ? 2 : 1 })).newPage();
    await p.goto('http://localhost:5102/bracelet-frontend/?lng=' + lng, { waitUntil: 'networkidle' });
    const T = id => p.locator(`[data-testid="${id}"]`);
    await T('birth-d').selectOption('31'); await T('birth-m').selectOption('2'); await p.waitForTimeout(200);
    await p.evaluate(() => document.querySelector('#sec-sky').scrollIntoView()); await p.waitForTimeout(300);
    await p.screenshot({ path: `${S}/shots/v2/${n}-d2-date-error-${lng}.png` });
  } await b.close(); })();
