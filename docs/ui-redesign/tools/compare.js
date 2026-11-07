// usage: node compare.js old.json new.json out.md
const fs = require('fs');
const [oldF, newF, out] = process.argv.slice(2);
const A = require(require('path').resolve(oldF)).results, B = require(require('path').resolve(newF)).results;
const F = ['gender', 'grade', 'gradeNote', 'mainColor', 'birth', 'earthDate', 'sky', 'earth', 'renSize', 'renCount', 'ren', 'renManual',
  'lenInput', 'unit', 'engraving', 'engraveText', 'engraveError', 'price', 'lenOut', 'totalBeads', 'stat', 'balance', 'beads', 'svgText'];
// 打印内容：只比较信息集合（新版把生日加了“生日：”标签并移到地址之后）
const normPrint = a => (a || []).map(s => s.replace(/^(生日|Birthday)：\s*/, '')).sort();
const short = r => `价格 ${r.price}｜主珠 ${r.mainColor}｜天 ${r.sky}｜地 ${r.earth}｜人 ${r.renSize}mm×${r.renCount}: ${r.ren}${r.renManual ? '（手动）' : ''}｜长度 ${r.lenOut}｜共 ${r.totalBeads} 颗｜五色 ${r.stat}｜${r.balance}` +
  (r.engraving ? `｜刻字「${r.engraveText}」${r.engraveError ? ' 错误:' + r.engraveError : ''}` : '');
let rows = [], bad = 0, noted = 0, auth = 0;
// 用户已授权的业务修复（2026-11-07）：差异必须且只能出现在这些用例
const AUTHORIZED = {
  C07: 'D2：2 月 31 日不存在，新版显示错误并阻止生成天珠（旧版界面显示 1 日，实际按 3 月 3 日生成）',
  C18: 'D1：第一次手动输入（绿 3）立即生效；之后的红 3、黄 3 按原截断规则截为 0。旧版第一次输入被自动分配覆盖。最终点「智能匹配」后结果与旧版相同',
  C28: 'D1：第一次手动把绿色人珠改为 0 立即生效并保留（旧版被覆盖回 1，多收 1 颗）。缩短长度后手动选择仍保留，与旧版规则相同',
};
A.forEach((a, i) => {
  const b = B[i]; const diffs = [], notes = [];
  const pairs = [[a.state, b.state, '']].concat(a.snaps.map((s, k) => [s, b.snaps[k], 'snap' + k + '.']));
  for (const [x, y, pre] of pairs) for (const f of F) {
    if (String(x[f]) === String(y?.[f])) continue;
    // 长度结果：数值必须一致；单位文字属于已说明的显示修正（D3），单独记为“仅显示”
    if (f === 'lenOut' && parseFloat(x[f]) === parseFloat(y?.[f])) { notes.push(`${pre}长度数值相同 ${parseFloat(x[f])}，单位文字「${x[f]}」→「${y?.[f]}」`); continue; }
    diffs.push(`${pre}${f}: ${x[f]} → ${y?.[f]}`);
  }
  if (JSON.stringify(normPrint(a.print)) !== JSON.stringify(normPrint(b.print))) (a.state.lenInput && /[A-Za-z]/.test(a.state.balance) ? notes : diffs).push('print: ' + JSON.stringify(a.print) + ' → ' + JSON.stringify(b.print));
  if (JSON.stringify(a.dialogs) !== JSON.stringify(b.dialogs)) diffs.push('dialogs');
  if (b.errors.length) diffs.push('pageerror: ' + b.errors.join(';'));
  const why = AUTHORIZED[a.id];
  if (diffs.length && why) { auth++; rows.push(`| ${a.id} ${a.name} | ${short(a.state)} | ${short(b.state)}<br>差异：${diffs.join('<br>')} | 🔄 已授权变更：${why} |`); return; }
  if (!diffs.length && why) diffs.push('预期因修复而变化，但结果未变');
  if (diffs.length) bad++;
  rows.push(`| ${a.id} ${a.name} | ${short(a.state)} | ${diffs.length ? diffs.join('<br>') : (notes.length ? '计算同左；' + notes.join('<br>') : '同左')} | ${diffs.length ? '❌' : (notes.length ? '✅ 计算一致 / ⚠️ 显示文字修正' : '✅')} |`);
  if (notes.length) noted++;
});
const md = `| 输入 | 旧版结果 | 新版结果 | 是否一致 |\n|---|---|---|---|\n${rows.join('\n')}\n\n完全一致 ${A.length - bad - auth}/${A.length}（其中 ${noted} 条仅单位显示文字修正）；已授权变更 ${auth} 条；意外差异 ${bad} 条\n`;
fs.writeFileSync(out, md); console.log(md.trim().split('\n').pop()); if (bad) console.log(rows.filter(r => r.includes('❌')).join('\n'));
