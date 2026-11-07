// 手机 / iPad / 桌面完整流程验证 + 语言检查 + 滚动检查 + 截图
const { chromium } = require('playwright-core');
const S = process.argv[2], URL = 'http://localhost:5102/bracelet-frontend/';
const devices = [
  ['phone', { width: 390, height: 844 }, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
  ['ipad', { width: 820, height: 1180 }, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
  ['desktop', { width: 1440, height: 900 }, {}],
  ['laptop', { width: 1280, height: 720 }, {}],
];
const out = [];
const ok = (dev, name, pass, info = '') => out.push(`${pass ? '✅' : '❌'} [${dev}] ${name}${info ? '：' + info : ''}`);
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  for (const [dev, vp, opt] of devices) {
    const ctx = await b.newContext({ viewport: vp, ...opt });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    const T = id => p.locator(`[data-testid="${id}"]`);
    await p.goto(URL + '?lng=zh', { waitUntil: 'networkidle' }); await p.waitForTimeout(300);
    const geo = () => p.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: innerWidth, vh: innerHeight, sy: scrollY,
      scrollers: [...document.querySelectorAll('*')].filter(e => { const cs = getComputedStyle(e); return /(auto|scroll)/.test(cs.overflowY + cs.overflowX) && (e.scrollHeight > e.clientHeight + 1 || e.scrollWidth > e.clientWidth + 1) && e.tagName !== 'SELECT'; }).map(e => e.className || e.tagName),
      bar: (() => { const e = document.querySelector('.bc-bottombar'); return e && getComputedStyle(e).display !== 'none' ? e.getBoundingClientRect().top : null; })() }));
    let g = await geo();
    ok(dev, '无横向滚动', g.sw <= g.vw, `页面宽 ${g.sw} / 视口 ${g.vw}`);
    ok(dev, '只有整页一条滚动条（无内部滚动区）', g.scrollers.length === 0, g.scrollers.join(',') || '无');
    const firstTop = await p.evaluate(() => document.querySelector('#sec-basic').getBoundingClientRect().top);
    ok(dev, '首屏即可看到第 1 步（性别/品级）', firstTop < g.vh * 0.5, `第 1 步卡片顶部 y=${Math.round(firstTop)}`);
    ok(dev, '客户信息默认折叠、在定制选项之后', await p.evaluate(() => { const c = document.querySelector('#sec-customer'), e = document.querySelector('#sec-engrave'); return !c.classList.contains('is-open') && (e.compareDocumentPosition(c) & 4) > 0; }));
    await p.screenshot({ path: `${S}/shots/v2/${dev}-1-top.png` });

    // 定制流程
    await T('gender').locator('label', { has: p.locator('input[value="女"]') }).click();
    await T('grade').locator('label', { has: p.locator('input[value="中品"]') }).click();
    await T('birth-y').selectOption('1988'); await T('birth-m').selectOption('6'); await T('birth-d').selectOption('15'); await T('birth-h').selectOption('11');
    await T('auto-sky').click(); await T('auto-earth').click(); await p.waitForTimeout(150);
    const sky = await T('sky-count').innerText(), earth = await T('earth-count').innerText();
    ok(dev, '天珠/地珠状态说明', /已选 7 颗，需要 7 颗，已选齐/.test(sky) && /已选 8 颗，需要 8 颗，已选齐/.test(earth), `${sky.trim()}｜${earth.trim()}`);
    await T('len').fill('150'); await p.waitForTimeout(150);
    const target = Number(await T('ren-count').getAttribute('data-value'));
    // 人珠减 1 颗 → 应提示还差 1 颗
    const renInputs = T('ren').locator('input[type=number]');
    let idx = -1; for (let i = 0; i < 5; i++) if (Number(await renInputs.nth(i).inputValue()) > 0) { idx = i; break; }
    await T('ren').locator('.bc-color').nth(idx).locator('button').first().click(); await p.waitForTimeout(150);
    const renVals = await p.evaluate(() => [...document.querySelectorAll('[data-testid=ren] input[type=number]')].map(x => +x.value));
    const sel = renVals.reduce((a, c) => a + c, 0);
    const renStatus = (await T('ren-status').innerText()).trim();
    const expect = sel === target ? '已选齐' : `还差 ${target - sel} 颗`;
    ok(dev, '人珠第一次点「−」即生效（D1）', sel === target - 1, `目标 ${target}，点一次后已选 ${sel}`);
    ok(dev, '人珠数量说明与实际一致', renStatus.includes(`已选 ${sel} 颗，需要 ${target} 颗`) && renStatus.includes(expect), `目标 ${target}、已选 ${sel} → 「${renStatus}」`);
    if (sel < target) {
      const todo = (await T('todo').innerText()).replace(/\s+/g, ' ');
      ok(dev, '结果栏列出未选齐项 + 修改入口', todo.includes(`人珠还差 ${target - sel} 颗`), todo);
      if (g.bar !== null) {
        const warn = (await p.locator('.bc-bottombar-warn').innerText()).trim();
        ok(dev, '底部栏提示还差几颗', warn.includes(`还差 ${target - sel} 颗`), warn);
        await p.screenshot({ path: `${S}/shots/v2/${dev}-2a-bar.png` });
        await p.locator('.bc-bottombar-warn').click();
      } else await T('todo').locator('a').first().click();
      await p.waitForTimeout(700);
      const renTop = await p.evaluate(() => document.querySelector('#sec-ren').getBoundingClientRect().top);
      ok(dev, '点「修改」跳回人珠区域（卡片顶部进入屏幕上半部）', renTop >= -2 && renTop < g.vh / 2, `人珠卡片顶部 y=${Math.round(renTop)}`);
      await p.screenshot({ path: `${S}/shots/v2/${dev}-2-ren-short.png` });
    }
    const totalShown = Number(await T('total-beads').getAttribute('data-value'));
    const circles = await p.locator('[data-testid=svg] circle').count();
    const brk = await p.locator('.bc-kv-sub').last().innerText();
    ok(dev, '总珠数 = 示意图珠子数 = 分项相加', totalShown === circles && brk.replace(/[^\d+]/g, '').split('+').reduce((a, c) => a + Number(c), 0) === totalShown, `总数 ${totalShown}，示意图 ${circles} 颗，分项「${brk}」`);
    await T('auto-match').click(); await p.waitForTimeout(150);
    ok(dev, '智能匹配后人珠选齐', /已选齐/.test(await T('ren-status').innerText()));
    await T('engrave').click(); await T('engrave-text').fill('12'); await p.waitForTimeout(80);
    ok(dev, '刻字错误显示在输入框下方', await p.evaluate(() => { const i = document.querySelector('[data-testid=engrave-text]').getBoundingClientRect(), e = document.querySelector('[data-testid=engrave-error]').getBoundingClientRect(); return e.top >= i.bottom && e.top - i.bottom < 20; }));
    await T('engrave-text').fill('AB');
    // 客户信息：从结果栏「修改」展开
    await p.locator('.bc-choices a[href="#sec-customer"]').click(); await p.waitForTimeout(700);
    ok(dev, '从结果栏「修改」展开客户信息', await p.evaluate(() => document.querySelector('#sec-customer').classList.contains('is-open')));
    await T('c-name').fill('测试客户'); await T('c-zipcode').fill('96817'); await T('c-zipcode').focus(); await p.waitForTimeout(500);
    g = await geo();
    const zipBottom = await p.evaluate(() => document.querySelector('[data-testid=c-zipcode]').getBoundingClientRect().bottom);
    ok(dev, '最后一个字段聚焦时不被底部栏遮挡', g.bar === null || zipBottom <= g.bar, `字段底部 ${Math.round(zipBottom)} / 底部栏顶部 ${g.bar === null ? '无' : Math.round(g.bar)}`);
    await p.screenshot({ path: `${S}/shots/v2/${dev}-3-customer.png` });
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(700);
    g = await geo();
    const printBottom = await p.evaluate(() => document.querySelector('[data-testid=print-btn]').getBoundingClientRect().bottom);
    ok(dev, '滚到底时打印按钮完整可见', printBottom <= (g.bar ?? g.vh), `按钮底部 ${Math.round(printBottom)} / 可视底部 ${Math.round(g.bar ?? g.vh)}`);
    await p.screenshot({ path: `${S}/shots/v2/${dev}-4-bottom.png` });

    // 桌面 sticky
    if (g.bar === null) {
      const res = [];
      for (const f of [0.15, 0.4, 0.7]) { await p.evaluate(f => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f), f); await p.waitForTimeout(500);
        res.push(await p.evaluate(() => { const r = document.querySelector('#sec-result').getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom)]; })); }
      const vh = g.vh;
      const priceTop = await p.evaluate(() => document.querySelector('.bc-price-row').getBoundingClientRect().top);
      ok(dev, '滚动时价格始终可见', priceTop >= -1 && priceTop < 40, `价格行 y=${Math.round(priceTop)}`);
      ok(dev, '结果栏 sticky（滚动时保持可见，整页单一滚动）', res.slice(1).every(([t, bt]) => bt <= vh + 1 && bt > vh * 0.5), `视口高 ${vh}，结果栏位置 ${res.map(r => r.join('~')).join(' / ')}`);
      await p.evaluate(() => window.scrollTo(0, 500)); await p.waitForTimeout(400);
      await p.screenshot({ path: `${S}/shots/v2/${dev}-5-sticky.png` });
    }

    // 语言检查
    for (const lng of ['zh', 'en', 'ja', 'ko', 'es', 'de']) {
      await T('lang').selectOption(lng); await p.waitForTimeout(150);
      const txt = await p.evaluate(() => { const w = document.createTreeWalker(document.querySelector('.bc-app'), NodeFilter.SHOW_TEXT); const a = []; let n;
        while ((n = w.nextNode())) { const el = n.parentElement; if (el.closest('style,option,.print-only,.bc-print-title,.sr-only,[data-testid=lang]')) continue; if (el.closest('select')) continue; const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue; const s = n.textContent.trim(); if (s) a.push(s); }
        return a; });
      const all = txt.join(' | ');
      let bad = [];
      if (lng === 'en' || lng === 'es' || lng === 'de') bad = txt.filter(s => /[一-鿿぀-ヿ가-힯]/.test(s) && !/^(测试客户)$/.test(s) && !/和合珠/.test(s));
      if (lng === 'zh') bad = txt.filter(s => /[A-Za-z]{2,}/.test(s.replace(/AcuTherapy|Hehe Beads|PDF|AB/g, '')));
      const glued = all.match(/\d(piece|pieza|Stück|beads?|cuentas?|Perlen?)\b/g) || [];
      ok(dev, `语言 ${lng}：界面无混排/无「3piece」类写法`, bad.length === 0 && glued.length === 0, bad.concat(glued).slice(0, 6).join(' ‖ ') || '通过');
      if (dev === 'phone' || dev === 'desktop') { await p.evaluate(() => window.scrollTo(0, document.querySelector('#sec-ren').offsetTop - 10)); await p.waitForTimeout(300); await p.screenshot({ path: `${S}/shots/v2/${dev}-lang-${lng}.png` }); }
    }
    ok(dev, '无页面报错', errs.length === 0, errs.join(';'));
    await ctx.close();
  }
  await b.close();
  console.log(out.join('\n'));
  require('fs').mkdirSync(S + '/baseline', { recursive: true }); require('fs').writeFileSync(S + '/baseline/verify-v2.md', out.join('\n') + '\n');
})();
