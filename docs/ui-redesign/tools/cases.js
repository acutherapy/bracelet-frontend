// 基准用例（虚构输入）。每个 step 是一个抽象动作，由 adapter 翻译成具体 DOM 操作。
// 动作：lang, gender, grade, renSize, len, unit, sky[i]=v, earth[i]=v, ren[i]=v,
//       birth{y,m,d,h}, earthDate{y,m,d,h}, autoSky, autoEarth, autoMatch, engrave(bool), engraveText
module.exports = [
  { id: 'C01', name: '默认加载（不做任何操作）', steps: [] },
  { id: 'C02', name: '男/上品/手填天珠2-1-1-2-1 地珠1-2-2-1-2/170mm', steps: [
    ['sky', [2, 1, 1, 2, 1]], ['earth', [1, 2, 2, 1, 2]] ] },
  { id: 'C03', name: '女/中品/同C02天地珠', steps: [
    ['gender', '女'], ['grade', '中品'], ['sky', [2, 1, 1, 2, 1]], ['earth', [1, 2, 2, 1, 2]] ] },
  { id: 'C04', name: '男/下品/人珠6mm/190mm', steps: [
    ['grade', '下品'], ['renSize', 6], ['len', '190'], ['sky', [1, 2, 2, 1, 1]], ['earth', [2, 2, 1, 1, 2]] ] },
  { id: 'C05', name: '自动天珠 1990-05-15 午时 + 自动地珠 2026-11-06 辰时 / 180mm', steps: [
    ['len', '180'], ['birth', { y: 1990, m: 5, d: 15, h: 11 }], ['autoSky'],
    ['earthDate', { y: 2026, m: 11, d: 6, h: 7 }], ['autoEarth'] ] },
  { id: 'C06', name: '女/自动天珠 1985-12-31 子时 + 自动地珠 2024-02-29 亥时', steps: [
    ['gender', '女'], ['birth', { y: 1985, m: 12, d: 31, h: 23 }], ['autoSky'],
    ['earthDate', { y: 2024, m: 2, d: 29, h: 21 }], ['autoEarth'] ] },
  { id: 'C07', name: '边界：先选31日再改2月，然后自动天珠', steps: [
    ['birth', { y: 2001, m: 1, d: 31, h: 5 }], ['birth', { m: 2 }], ['autoSky'] ] },
  { id: 'C08', name: '长度17.5厘米', steps: [['sky', [2, 1, 1, 2, 1]], ['earth', [1, 2, 2, 1, 2]], ['unit', 'cm'], ['len', '17.5']] },
  { id: 'C09', name: '长度7英寸', steps: [['sky', [2, 1, 1, 2, 1]], ['earth', [1, 2, 2, 1, 2]], ['unit', 'in'], ['len', '7']] },
  { id: 'C10', name: '长度下限100mm', steps: [['sky', [2, 1, 1, 2, 1]], ['earth', [1, 2, 2, 1, 2]], ['len', '100']] },
  { id: 'C11', name: '长度上限300mm（人珠封顶8）', steps: [['sky', [2, 1, 1, 2, 1]], ['earth', [1, 2, 2, 1, 2]], ['len', '300']] },
  { id: 'C12', name: '错误输入：长度50mm（低于min）', steps: [['len', '50']] },
  { id: 'C13', name: '错误输入：长度清空', steps: [['len', '']] },
  { id: 'C14', name: '错误输入：长度400mm（高于max）', steps: [['len', '400']] },
  { id: 'C15', name: '错误输入：天珠超量 绿5再红5', steps: [['skyOne', 0, '5'], ['skyOne', 1, '5']] },
  { id: 'C16', name: '错误输入：天珠负数 绿-2', steps: [['skyOne', 0, '-2']] },
  { id: 'C17', name: '错误输入：地珠小数 黄1.5', steps: [['earthOne', 2, '1.5']] },
  { id: 'C18', name: '人珠手动3-3-3超量截断，然后智能匹配恢复', steps: [
    ['sky', [2, 1, 1, 2, 1]], ['earth', [1, 2, 2, 1, 2]], ['renOne', 0, '3'], ['renOne', 1, '3'], ['renOne', 2, '3'], ['snap'], ['autoMatch']] },
  { id: 'C19', name: '刻字：AB', steps: [['engrave', true], ['engraveText', 'AB']] },
  { id: 'C20', name: '刻字：abc→截断', steps: [['engrave', true], ['engraveText', 'abc']] },
  { id: 'C21', name: '刻字：王小', steps: [['engrave', true], ['engraveText', '王小']] },
  { id: 'C22', name: '刻字：A王（混合）', steps: [['engrave', true], ['engraveText', 'A王']] },
  { id: 'C23', name: '刻字：12（数字）', steps: [['engrave', true], ['engraveText', '12']] },
  { id: 'C24', name: '刻字：输入后清空', steps: [['engrave', true], ['engraveText', 'AB'], ['engraveText', '']] },
  { id: 'C25', name: '刻字：输入后取消勾选', steps: [['engrave', true], ['engraveText', '福'], ['engrave', false]] },
  { id: 'C26', name: '性别 男→女→男（人珠尺寸是否回到8）', steps: [['gender', '女'], ['gender', '男']] },
  { id: 'C27', name: '自动天珠后手改天珠（主珠是否跟随）', steps: [
    ['birth', { y: 1990, m: 5, d: 15, h: 11 }], ['autoSky'], ['sky', [0, 0, 0, 0, 7]]] },
  { id: 'C28', name: '人珠手动后改长度150（人珠数是否保留）', steps: [
    ['sky', [2, 1, 1, 2, 1]], ['earth', [1, 2, 2, 1, 2]], ['renOne', 0, '0'], ['len', '150']] },
  { id: 'C29', name: '英文界面 + 17厘米（单位标签）', steps: [
    ['lang', 'en'], ['sky', [2, 1, 1, 2, 1]], ['earth', [1, 2, 2, 1, 2]], ['unit', 'cm'], ['len', '17']] },
  { id: 'C30', name: '完整订单 + 打印内容', steps: [
    ['customer', { name: '测试客户', phone: '808-000-0000', email: 'test@example.com', wechat: 'wx_test', address: '1 Test St', city: 'Honolulu', province: 'HI', zipcode: '96817' }],
    ['birth', { y: 1978, m: 8, d: 8, h: 17 }], ['autoSky'], ['earthDate', { y: 2026, m: 1, d: 1, h: 9 }], ['autoEarth'],
    ['grade', '中品'], ['engrave', true], ['engraveText', '和'], ['print']] },
];
