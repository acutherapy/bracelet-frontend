// D1 / D2 针对性回归验证
// usage: node regress.js <oldUrl> <newUrl> <out.md>
// 固定“当前时间”为 2026-11-06 10:30（Pacific/Honolulu），结果可重复
const { chromium } = require('playwright-core');
const fs = require('fs');
const OLD = require('./adapter-old.js'), NEW = require('./adapter-new.js');
const [oldUrl, newUrl, out] = process.argv.slice(2);
const FIXED = new Date('2026-11-06T10:30:00-10:00').getTime();
const rows = [];
let browser;

async function open(url, lng = 'zh') {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, timezoneId: 'Pacific/Honolulu' });
  await ctx.addInitScript(ms => { const R = Date; class D extends R { constructor(...a) { super(...(a.length ? a : [ms])); } static now() { return ms; } } D.UTC = R.UTC; D.parse = R.parse; window.Date = D; }, FIXED);
  const p = await ctx.newPage();
  p._errors = []; p.on('pageerror', e => p._errors.push(e.message));
  await p.goto(url + '?lng=' + lng, { waitUntil: 'networkidle' });
  await p.waitForTimeout(100);
  return p;
}
const wait = (p, ms = 120) => p.waitForTimeout(ms);
const close = p => p.context().close();
async function setColors(A, p, kind, arr) { for (let i = 0; i < 5; i++) { await A[kind + 'One'](p, i, String(arr[i])); await wait(p, 60); } }
async function base(A, url) { // 天珠 2-1-1-2-1、地珠 1-2-2-1-2、170mm → 人珠目标 3 颗，自动分配 1-0-1-1-0
  const p = await open(url);
  await setColors(A, p, 'sky', [2, 1, 1, 2, 1]); await setColors(A, p, 'earth', [1, 2, 2, 1, 2]); await wait(p);
  return p;
}
const add = (id, name, oldV, newV, pass) => rows.push({ id, name, oldV, newV, pass });
const fmt = s => `价格 ${s.price}｜人珠 ${s.renCount}颗目标: ${s.ren}${s.renManual ? '（手动）' : ''}`;

(async () => {
  browser = await (chromium.launch({ channel: 'chrome' }));

  // ---------- D1 ----------
  // R01 第一次直接输入人珠数量即生效，且 1 秒后仍保留
  {
    const res = {};
    for (const [k, A, url] of [['old', OLD, oldUrl], ['new', NEW, newUrl]]) {
      const p = await base(A, url);
      await A.renOne(p, 0, '0'); await wait(p, 1000);
      res[k] = await A.state(p); await close(p);
    }
    add('R01', 'D1 第一次手动输入人珠（绿色 1→0）立即生效，1 秒后仍保留', fmt(res.old), fmt(res.new), res.new.ren === '0,0,1,1,0' && res.new.renManual);
  }
  // R02 新版：第一次点「−」即生效
  {
    const p = await base(NEW, newUrl);
    await p.locator('[data-testid=ren] .bc-color').nth(0).locator('button').first().click(); await wait(p, 1000);
    const s = await NEW.state(p); const st = (await p.locator('[data-testid=ren-status]').innerText()).trim(); await close(p);
    add('R02', 'D1 第一次点人珠「−」立即生效，并提示还差 1 颗', '旧版无此按钮', `${fmt(s)}｜${st}`, s.ren === '0,0,1,1,0' && s.renManual && st.includes('还差 1 颗'));
  }
  // R03 手动后：改天珠、地珠、品级、性别、刻字、加长长度，都不覆盖手动结果
  {
    const p = await base(NEW, newUrl);
    await NEW.renOne(p, 0, '0'); await wait(p);
    const before = (await NEW.state(p)).ren;
    const log = [];
    const check = async label => { await wait(p); const s = await NEW.state(p); log.push(`${label}→${s.ren}`); return s.ren === before; };
    let ok = true;
    await NEW.skyOne(p, 0, '1'); ok = (await check('改天珠')) && ok;
    await NEW.earthOne(p, 1, '1'); ok = (await check('改地珠')) && ok;
    await NEW.grade(p, '中品'); ok = (await check('改品级')) && ok;
    await NEW.gender(p, '女'); ok = (await check('改性别女')) && ok;
    await NEW.gender(p, '男'); ok = (await check('改回男')) && ok;
    await NEW.engrave(p, true); await NEW.engraveText(p, 'AB'); ok = (await check('刻字')) && ok;
    await NEW.len(p, '190'); ok = (await check('长度190')) && ok;
    await NEW.birth(p, { y: 1988, m: 6, d: 15, h: 11 }); await NEW.autoEarth(p); ok = (await check('生成地珠')) && ok;
    const s = await NEW.state(p); await close(p);
    add('R03', 'D1 手动后改天珠/地珠/品级/性别/刻字/长度/生成地珠，手动人珠不被覆盖', '—', log.join('；'), ok && s.renManual);
  }
  // R04 点「智能匹配」才恢复自动分配，结果与从未手动过的自动结果相同
  {
    const p = await base(NEW, newUrl);
    await NEW.renOne(p, 0, '0'); await wait(p); await NEW.autoMatch(p); await wait(p, 300);
    const a = await NEW.state(p); await close(p);
    const q = await base(OLD, oldUrl); const b = await OLD.state(q); await close(q);
    add('R04', 'D1 手动后点「智能匹配」恢复自动分配，结果 = 旧版自动结果', fmt(b), fmt(a), a.ren === b.ren && !a.renManual && a.price === b.price);
  }
  // R05 自动模式（未手动）下改长度，仍自动重新分配
  {
    const res = {};
    for (const [k, A, url] of [['old', OLD, oldUrl], ['new', NEW, newUrl]]) {
      const p = await base(A, url); await A.len(p, '190'); await wait(p, 300); res[k] = await A.state(p); await close(p);
    }
    add('R05', 'D1 未手动时改长度 190mm，人珠仍按原规则自动分配', fmt(res.old), fmt(res.new), res.old.ren === res.new.ren && res.old.price === res.new.price);
  }
  // R06 手动后缩短长度（目标 0 颗）：保留手动选择，并提示多出数量
  {
    const p = await base(NEW, newUrl);
    await NEW.renOne(p, 0, '0'); await wait(p); await NEW.len(p, '150'); await wait(p, 300);
    const s = await NEW.state(p); const st = (await p.locator('[data-testid=ren-status]').innerText()).trim(); await close(p);
    add('R06', 'D1 手动后缩短长度到 150mm（目标 0 颗）：保留手动选择，提示多出', '—', `${fmt(s)}｜${st}`, s.ren === '0,0,1,1,0' && st.includes('多了 2 颗'));
  }
  // R07 空闲 CPU（无限重渲染已消除）
  {
    const r = {};
    for (const [k, url] of [['old', oldUrl], ['new', newUrl]]) {
      const p = await open(url); const c = await p.context().newCDPSession(p); await c.send('Performance.enable');
      const g = async () => Object.fromEntries((await c.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
      const a = await g(); await p.waitForTimeout(3000); const z = await g(); r[k] = (z.TaskDuration - a.TaskDuration); await close(p);
    }
    add('R07', 'D1 打开页面不操作 3 秒的 CPU 时间', `${r.old.toFixed(2)} 秒`, `${r.new.toFixed(2)} 秒`, r.new < 0.5);
  }

  // ---------- D2 ----------
  const dateState = async (p, kind) => p.evaluate(k => {
    const T = id => document.querySelector(`[data-testid="${id}"]`);
    return { day: T(k + '-d').value, shown: T(k + '-d').selectedOptions[0]?.textContent, err: T(k + '-error')?.innerText || '', disabled: T(k === 'birth' ? 'auto-sky' : 'auto-earth').disabled };
  }, kind);
  // R10 1990-01-31 → 改 2 月：显示错误、按钮禁用、强制点击也不生成
  {
    const p = await open(newUrl);
    await NEW.birth(p, { y: 1990, m: 1, d: 31 }); await NEW.birth(p, { m: 2 }); await wait(p);
    const d = await dateState(p, 'birth');
    await NEW.autoSky(p); await wait(p);
    const s = await NEW.state(p); await close(p);
    const q = await open(oldUrl); await OLD.birth(q, { y: 1990, m: 1, d: 31 }); await OLD.birth(q, { m: 2 }); await wait(q);
    const shownOld = await q.evaluate(() => { const sel = [...document.querySelectorAll('select')][3]; return sel.selectedOptions[0]?.textContent || '(空)'; });
    await OLD.autoSky(q); await wait(q); const o = await OLD.state(q); await close(q);
    add('R10', 'D2 1990-01-31 改成 2 月：显示错误、禁止生成天珠', `日显示「${shownOld}」，无提示；生成 天 ${o.sky} 主珠 ${o.mainColor}（按 3 月 3 日计算）`,
      `日=${d.shown}｜「${d.err}」｜按钮禁用=${d.disabled}｜强制点击后 天 ${s.sky} 主珠 ${s.mainColor}`,
      d.day === '31' && d.err.includes('1990年2月只有 28 天') && d.disabled && s.sky === '0,0,0,0,0' && s.mainColor === 'red');
  }
  // R11 改回有效日期后恢复，结果 = 旧版同一有效日期
  {
    const p = await open(newUrl);
    await NEW.birth(p, { y: 1990, m: 1, d: 31 }); await NEW.birth(p, { m: 2 }); await NEW.birth(p, { d: 28 }); await wait(p);
    const d = await dateState(p, 'birth'); await NEW.autoSky(p); await wait(p); const a = await NEW.state(p); await close(p);
    const q = await open(oldUrl); await OLD.birth(q, { y: 1990, m: 2, d: 28 }); await OLD.autoSky(q); await wait(q); const b = await OLD.state(q); await close(q);
    add('R11', 'D2 改回 2 月 28 日：错误消失，生成结果 = 旧版同一日期', `天 ${b.sky} 主珠 ${b.mainColor}`, `错误「${d.err}」｜天 ${a.sky} 主珠 ${a.mainColor}`,
      !d.err && !d.disabled && a.sky === b.sky && a.mainColor === b.mainColor);
  }
  // R12 闰年：2024-02-29 有效 → 2023 无效 → 2000 有效 → 1900 无效
  {
    const p = await open(newUrl); const log = []; let ok = true;
    for (const [y, valid] of [[2024, true], [2023, false], [2000, true], [1900, false], [2024, true]]) {
      if (y === 2024 && !log.length) await NEW.birth(p, { y, m: 2, d: 29 }); else await NEW.birth(p, { y });
      await wait(p); const d = await dateState(p, 'birth');
      log.push(`${y}-2-29 ${d.err ? '❗' + d.err : '有效'}`); ok = ok && (valid ? !d.err && !d.disabled : !!d.err && d.disabled);
    }
    await close(p);
    add('R12', 'D2 闰年：2024/2000 年 2 月 29 日有效，2023/1900 年无效', '—', log.join('；'), ok);
  }
  // R13 大小月：3-31 → 4 月无效 → 5 月有效 → 6 月无效 → 12 月有效
  {
    const p = await open(newUrl); const log = []; let ok = true;
    await NEW.birth(p, { y: 1990, m: 3, d: 31 });
    for (const [m, valid] of [[3, true], [4, false], [5, true], [6, false], [9, false], [11, false], [12, true]]) {
      await NEW.birth(p, { m }); await wait(p); const d = await dateState(p, 'birth');
      log.push(`${m}月31日 ${d.err ? '无效' : '有效'}`); ok = ok && (valid ? !d.err : d.err.includes('只有 30 天'));
    }
    await close(p);
    add('R13', 'D2 大小月：31 日在 4/6/9/11 月无效，在 3/5/12 月有效', '—', log.join('；'), ok);
  }
  // R14 地珠日期同样校验
  {
    const p = await open(newUrl);
    const before = (await NEW.state(p)).earth;
    await NEW.earthDate(p, { y: 2026, m: 1, d: 31 }); await NEW.earthDate(p, { m: 2 }); await wait(p);
    const d = await dateState(p, 'earth'); await NEW.autoEarth(p); await wait(p); const s = await NEW.state(p); await close(p);
    add('R14', 'D2 地珠日期 2026-01-31 改 2 月：显示错误、禁止生成地珠', '同 D2，按 3 月 3 日生成', `「${d.err}」｜按钮禁用=${d.disabled}｜地 ${s.earth}`,
      d.err.includes('2026年2月只有 28 天') && d.disabled && s.earth === before);
  }
  // R15 有效日期：新旧结果完全一致（原算法）
  {
    const dates = [[2024, 2, 29, 11], [2000, 2, 29, 23], [1990, 4, 30, 5], [1985, 12, 31, 23], [1990, 5, 15, 11], [1900, 2, 28, 1]];
    const log = []; let ok = true;
    for (const [y, m, d, h] of dates) {
      const r = {};
      for (const [k, A, url] of [['old', OLD, oldUrl], ['new', NEW, newUrl]]) {
        const p = await open(url);
        await A.birth(p, { y, m, d, h }); await A.autoSky(p); await A.earthDate(p, { y, m, d, h }); await A.autoEarth(p); await wait(p);
        r[k] = await A.state(p); await close(p);
      }
      const same = ['sky', 'earth', 'mainColor', 'ren', 'price', 'stat', 'balance', 'beads'].every(f => String(r.old[f]) === String(r.new[f]));
      ok = ok && same; log.push(`${y}-${m}-${d} ${h}时：天 ${r.new.sky} 地 ${r.new.earth} 主珠 ${r.new.mainColor} ${r.new.price} ${same ? '✅' : '❌'}`);
    }
    add('R15', 'D2 有效日期（含闰日、月末）天珠/地珠/价格与旧版完全一致', '旧版同输入', log.join('<br>'), ok);
  }
  // R16 英文界面错误文字
  {
    const p = await open(newUrl, 'en');
    await NEW.birth(p, { y: 2023, m: 1, d: 29 }); await NEW.birth(p, { m: 2 }); await wait(p);
    const d = await dateState(p, 'birth'); await close(p);
    add('R16', 'D2 英文界面的日期错误提示', '—', `日=${d.shown}｜「${d.err}」`, d.err.startsWith('This date does not exist: Feb 2023 has only 28 days') && /invalid/.test(d.shown));
  }

  await browser.close();
  const pass = rows.filter(r => r.pass).length;
  const md = `# D1 / D2 回归验证\n\n固定当前时间：2026-11-06 10:30（Pacific/Honolulu）\n\n| 编号 | 验证内容 | 旧版 | 新版 | 结果 |\n|---|---|---|---|---|\n` +
    rows.map(r => `| ${r.id} | ${r.name} | ${r.oldV} | ${r.newV} | ${r.pass ? '✅' : '❌'} |`).join('\n') + `\n\n通过 ${pass}/${rows.length}\n`;
  fs.writeFileSync(out, md);
  console.log(rows.map(r => `${r.pass ? '✅' : '❌'} ${r.id} ${r.name}\n    旧：${r.oldV}\n    新：${r.newV}`).join('\n'));
  console.log(`通过 ${pass}/${rows.length}`);
})();
