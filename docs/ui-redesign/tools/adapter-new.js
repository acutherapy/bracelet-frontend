// 新版 DOM 适配器：按 data-testid 定位；输出字段与 adapter-old.js 完全同构
const tid = (p, id) => p.locator(`[data-testid="${id}"]`);
const pick = async (p, group, value) => { await tid(p, group).locator('label', { has: p.locator(`input[value="${value}"]`) }).click(); };
const sel = (p, id, v) => tid(p, id).selectOption(String(v));

module.exports = {
  async lang(p, v) { await sel(p, 'lang', v); },
  async gender(p, v) { await pick(p, 'gender', v); },
  async grade(p, v) { await pick(p, 'grade', v); },
  async renSize(p, v) { await pick(p, 'ren-size', String(v)); },
  async len(p, v) { await tid(p, 'len').fill(v); },
  async unit(p, v) { await pick(p, 'unit', v); },
  async skyOne(p, i, v) { await tid(p, 'sky').locator('input[type=number]').nth(i).fill(v); },
  async earthOne(p, i, v) { await tid(p, 'earth').locator('input[type=number]').nth(i).fill(v); },
  async renOne(p, i, v) { await tid(p, 'ren').locator('input[type=number]').nth(i).fill(v); },
  async birth(p, o) { for (const k of ['y', 'm', 'd', 'h']) if (o[k] !== undefined) await sel(p, 'birth-' + k, o[k]); },
  async earthDate(p, o) { for (const k of ['y', 'm', 'd', 'h']) if (o[k] !== undefined) await sel(p, 'earth-' + k, o[k]); },
  async autoSky(p) { await tid(p, 'auto-sky').click({ force: true }); },
  async autoEarth(p) { await tid(p, 'auto-earth').click({ force: true }); },
  async autoMatch(p) { await tid(p, 'auto-match').click(); },
  async engrave(p, v) { const c = tid(p, 'engrave'); if ((await c.isChecked()) !== v) await c.click(); },
  async engraveText(p, v) { await tid(p, 'engrave-text').fill(v); },
  async customer(p, o) { if ((await tid(p, 'customer-toggle').getAttribute('aria-expanded')) !== 'true') await tid(p, 'customer-toggle').click(); for (const k of Object.keys(o)) await tid(p, 'c-' + k).fill(o[k]); },

  async state(page) {
    return page.evaluate(() => {
      const T = id => document.querySelector(`[data-testid="${id}"]`);
      const nums = s => (s.match(/-?\d+(\.\d+)?/g) || []).map(Number);
      const vals = id => [...T(id).querySelectorAll('input[type=number]')].map(x => x.value);
      const radio = id => T(id)?.querySelector('input:checked')?.value;
      const txt = el => el.innerText.replace(/\s+/g, ' ').trim();
      const svg = T('svg');
      const balKey = T('balance').dataset.value;
      return {
        gender: radio('gender'), grade: radio('grade'),
        gradeNote: T('grade').querySelector('.is-selected .bc-choice-sub')?.innerText || '',
        mainColor: T('main-color').dataset.value,
        birth: ['y', 'm', 'd', 'h'].map(k => T('birth-' + k).value).join('-'),
        earthDate: ['y', 'm', 'd', 'h'].map(k => T('earth-' + k).value).join('-'),
        sky: vals('sky').join(','), earth: vals('earth').join(','),
        renSize: T('ren-size').querySelector('input') ? radio('ren-size') : '人珠尺寸：' + txt(T('ren-size').querySelector('.bc-chip')),
        renCount: Number(T('ren-count').dataset.value),
        ren: vals('ren').join(','),
        renManual: !!T('ren-manual'),
        lenInput: T('len').value, unit: radio('unit'),
        engraving: T('engrave').checked,
        engraveText: T('engrave-text')?.value ?? null,
        engraveError: T('engrave-error')?.innerText || '',
        price: T('price').innerText.trim(),
        lenOut: T('len-out').innerText.trim(),
        totalBeads: Number(T('total-beads').dataset.value),
        stat: nums(T('stat').textContent).join(','),
        balance: T('balance').innerText.trim(),
        beads: [...svg.querySelectorAll('circle')].map(c => `${c.getAttribute('r')}|${c.getAttribute('fill')}|${c.getAttribute('stroke-width')}`).join(' '),
        svgText: svg.querySelector('text')?.textContent || '',
        _balKey: balKey,
      };
    });
  },
  async printText(page) {
    await page.emulateMedia({ media: 'print' });
    const t = await page.evaluate(() => [...document.querySelectorAll('.print-only')].map(e => e.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean));
    await page.emulateMedia({ media: 'screen' });
    return t;
  },
};
