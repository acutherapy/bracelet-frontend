// 旧版（线上 best-stable）DOM 适配器：按 #print-area 子元素位置定位
const IDX = { customer: 1, gender: 2, grade: 3, main: 4, auto: 5, sky: 6, earth: 7, renSize: 8, ren: 9, len: 10, engrave: 11,
  price: 12, lenOut: 13, beads: 14, stat: 15, balance: 16, svg: 17 };

const el = (page, i) => page.evaluateHandle(i => document.querySelector('#print-area').children[i], i);
const q = async (page, i, sel, n = 0) => (await (await el(page, i)).$$(sel))[n];

module.exports = {
  async lang(page, v) { await page.selectOption('select >> nth=0', v); },
  async gender(page, v) { await (await q(page, IDX.gender, 'select')).selectOption(v); },
  async grade(page, v) { await (await q(page, IDX.grade, 'select')).selectOption(v); },
  async renSize(page, v) { await (await q(page, IDX.renSize, 'select')).selectOption(String(v)); },
  async len(page, v) { await (await q(page, IDX.len, 'input')).fill(v); },
  async unit(page, v) { await (await q(page, IDX.len, 'select')).selectOption(v); },
  async skyOne(page, i, v) { await (await q(page, IDX.sky, 'input', i)).fill(v); },
  async earthOne(page, i, v) { await (await q(page, IDX.earth, 'input', i)).fill(v); },
  async renOne(page, i, v) { await (await q(page, IDX.ren, 'input', i)).fill(v); },
  async birth(page, o) {
    const keys = ['y', 'm', 'd', 'h'];
    for (let k = 0; k < 4; k++) if (o[keys[k]] !== undefined) await (await q(page, IDX.customer, 'select', k)).selectOption(String(o[keys[k]]));
  },
  async earthDate(page, o) {
    const keys = ['y', 'm', 'd', 'h'];
    for (let k = 0; k < 4; k++) if (o[keys[k]] !== undefined) await (await q(page, IDX.auto, 'select', k)).selectOption(String(o[keys[k]]));
  },
  async autoSky(page) { await (await q(page, IDX.auto, 'button', 0)).click(); },
  async autoEarth(page) { await (await q(page, IDX.auto, 'button', 1)).click(); },
  async autoMatch(page) { await (await q(page, IDX.ren, 'button')).click(); },
  async engrave(page, v) { const c = await q(page, IDX.engrave, 'input[type=checkbox]'); if ((await c.isChecked()) !== v) await c.click(); },
  async engraveText(page, v) { await (await q(page, IDX.engrave, 'input[type=text]')).fill(v); },
  async customer(page, o) {
    const order = ['name', 'phone', null, 'email', 'wechat', 'address', 'city', 'province', 'zipcode'];
    const inputs = await (await el(page, IDX.customer)).$$('.customer-form input');
    let j = 0;
    for (const k of order) { if (!k) continue; await inputs[j++].fill(o[k]); }
  },

  // 读取全部可见结果（规范化为与界面无关的字段）
  async state(page) {
    return page.evaluate((IDX) => {
      const pa = document.querySelector('#print-area').children;
      const nums = s => (s.match(/-?\d+(\.\d+)?/g) || []).map(Number);
      const vals = i => [...pa[i].querySelectorAll('input')].map(x => x.value);
      const txt = i => pa[i].innerText.replace(/\s+/g, ' ').trim();
      const eng = pa[IDX.engrave];
      const errSpan = [...eng.querySelectorAll('span span')].find(s => s.style.color === 'red');
      const circles = [...pa[IDX.svg].querySelectorAll('circle')].map(c => `${c.getAttribute('r')}|${c.getAttribute('fill')}|${c.getAttribute('stroke-width')}`);
      const sel = (i, n) => pa[i].querySelectorAll('select')[n]?.value;
      const renSel = pa[IDX.renSize].querySelector('select');
      return {
        gender: sel(IDX.gender, 0), grade: sel(IDX.grade, 0), gradeNote: pa[IDX.grade].querySelector('span')?.innerText || '',
        mainColor: sel(IDX.main, 0),
        birth: [0, 1, 2, 3].map(n => sel(IDX.customer, n)).join('-'),
        earthDate: [0, 1, 2, 3].map(n => sel(IDX.auto, n)).join('-'),
        sky: vals(IDX.sky).join(','), earth: vals(IDX.earth).join(','),
        renSize: renSel ? renSel.value : txt(IDX.renSize),
        renCount: nums(pa[IDX.ren].querySelector('strong').innerText)[0],
        ren: vals(IDX.ren).join(','),
        renManual: /手动|manual/i.test(txt(IDX.ren)),
        lenInput: pa[IDX.len].querySelector('input').value, unit: sel(IDX.len, 0),
        engraving: eng.querySelector('input[type=checkbox]').checked,
        engraveText: eng.querySelector('input[type=text]')?.value ?? null,
        engraveError: errSpan ? errSpan.innerText : '',
        price: txt(IDX.price).split(/[：:]/).pop().trim(),
        lenOut: txt(IDX.lenOut).split(/[：:]/).pop().trim(),
        totalBeads: nums(txt(IDX.beads))[0],
        stat: nums(txt(IDX.stat)).join(','),
        balance: txt(IDX.balance).split(/[：:]/)[1].trim().split(' ')[0],
        beads: circles.join(' '),
        svgText: pa[IDX.svg].querySelector('text')?.textContent || '',
      };
    }, IDX);
  },
  async printText(page) {
    await page.emulateMedia({ media: 'print' });
    const t = await page.evaluate(() => [...document.querySelectorAll('.print-only')].map(e => e.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean));
    await page.emulateMedia({ media: 'screen' });
    return t;
  },
};
