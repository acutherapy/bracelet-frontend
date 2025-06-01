import React, { useState, useMemo } from 'react';

// 五行色
const FIVE_COLORS = [
  { name: '绿色', color: '#4caf50' },
  { name: '红色', color: '#e53935' },
  { name: '黄色', color: '#fbc02d' },
  { name: '白色', color: '#e0e0e0' },
  { name: '黑色', color: '#222' },
];

// 品级
const GRADES = [
  { value: '上品', label: '上品' },
  { value: '中品', label: '中品' },
  { value: '下品', label: '下品' },
];

// 主珠可选颜色
const MAIN_COLORS = [
  ...FIVE_COLORS,
  { name: '粉色', color: '#e88f8f' },
  { name: '蓝色', color: '#2196f3' },
  { name: '紫色', color: '#9c27b0' },
  { name: '棕色', color: '#795548' },
];

// 价格表（玛瑙，单位：美元/颗）
const PRICE_TABLE: Record<string, Record<string, Record<string, number>>> = {
  '12': {
    '上品': { '绿色': 50, '红色': 45, '黄色': 40, '白色': 45, '黑色': 60 },
    '中品': { '绿色': 45, '红色': 40, '黄色': 30, '白色': 40, '黑色': 50 },
    '下品': { '绿色': 40, '红色': 35, '黄色': 20, '白色': 35, '黑色': 40 },
  },
  '10': {
    '上品': { '绿色': 45, '红色': 45, '黄色': 30, '白色': 35, '黑色': 50 },
    '中品': { '绿色': 40, '红色': 40, '黄色': 25, '白色': 35, '黑色': 45 },
    '下品': { '绿色': 35, '红色': 35, '黄色': 20, '白色': 30, '黑色': 40 },
  },
  '8': {
    '上品': { '绿色': 35, '红色': 30, '黄色': 25, '白色': 30, '黑色': 45 },
    '中品': { '绿色': 35, '红色': 25, '黄色': 20, '白色': 25, '黑色': 40 },
    '下品': { '绿色': 30, '红色': 20, '黄色': 15, '白色': 20, '黑色': 35 },
  },
  '6': {
    '上品': { '绿色': 25, '红色': 30, '黄色': 20, '白色': 25, '黑色': 35 },
    '中品': { '绿色': 20, '红色': 20, '黄色': 15, '白色': 20, '黑色': 30 },
    '下品': { '绿色': 15, '红色': 20, '黄色': 10, '白色': 15, '黑色': 20 },
  },
};

// 时辰及时间段
const SHICHEN = [
  { value: '子', label: '子（23:00-0:59）' },
  { value: '丑', label: '丑（1:00-2:59）' },
  { value: '寅', label: '寅（3:00-4:59）' },
  { value: '卯', label: '卯（5:00-6:59）' },
  { value: '辰', label: '辰（7:00-8:59）' },
  { value: '巳', label: '巳（9:00-10:59）' },
  { value: '午', label: '午（11:00-12:59）' },
  { value: '未', label: '未（13:00-14:59）' },
  { value: '申', label: '申（15:00-16:59）' },
  { value: '酉', label: '酉（17:00-18:59）' },
  { value: '戌', label: '戌（19:00-20:59）' },
  { value: '亥', label: '亥（21:00-22:59）' },
];

const getSizes = (gender: '男' | '女', artBeadSize: number) => {
  if (gender === '男') {
    return { main: 12, sky: 10, earth: 8, art: artBeadSize };
  } else {
    return { main: 10, sky: 8, earth: 6, art: 6 };
  }
};

const maxSky = 7, maxEarth = 8, maxArt = 8;

const BraceletCustomizer: React.FC = () => {
  const [gender, setGender] = useState<'男' | '女'>('男');
  const [grade, setGrade] = useState('上品');
  // 主珠颜色自动跟随天珠最多的颜色
  const [mainColor, setMainColor] = useState('红色');
  const [skyColors, setSkyColors] = useState(FIVE_COLORS.map(() => 0));
  const [earthColors, setEarthColors] = useState(FIVE_COLORS.map(() => 0));
  const [artColors, setArtColors] = useState(FIVE_COLORS.map(() => 0));
  const [artBeadSize, setArtBeadSize] = useState(8); // 男可选8/6，女固定6
  const [engraving, setEngraving] = useState(false);
  const [engravingText, setEngravingText] = useState('');
  const [braceletLength, setBraceletLength] = useState(170); // 默认170mm
  const [lengthUnit, setLengthUnit] = useState<'mm' | 'cm' | 'in'>('mm');
  const [orderStatus, setOrderStatus] = useState<string | null>(null);

  // 客户信息
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    birthday: '',
    shichen: '',
    email: '',
    wechat: '',
    address: '',
    city: '',
    province: '',
    zipcode: '',
  });

  // 刻字输入校验
  const [engravingError, setEngravingError] = useState('');
  const handleEngravingInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // 判断是否全是英文字母
    if (/^[A-Za-z]*$/.test(val)) {
      val = val.replace(/[^A-Za-z]/g, '').slice(0, 2);
      setEngravingError(val.length > 0 && val.length <= 2 ? '' : '只能输入2个英文字母');
    } else {
      // 只保留第一个汉字
      const chinese = val.replace(/[^\u4e00-\u9fa5]/g, '');
      val = chinese.slice(0, 1);
      setEngravingError(val.length === 1 ? '' : '只能输入1个汉字');
    }
    setEngravingText(val);
  };

  // 性别切换时重置术珠尺寸
  React.useEffect(() => {
    if (gender === '女') setArtBeadSize(6);
  }, [gender]);

  // 尺寸
  const sizes = getSizes(gender, artBeadSize);

  // 天珠最多的颜色自动设为主珠颜色
  React.useEffect(() => {
    const maxSkyCount = Math.max(...skyColors);
    const idx = skyColors.findIndex(c => c === maxSkyCount);
    if (maxSkyCount > 0) setMainColor(FIVE_COLORS[idx].name);
  }, [skyColors]);

  // 主珠
  const mainBead = { size: sizes.main, color: mainColor };

  // 天珠、地珠、术珠五行色分配
  const skyTotal = skyColors.reduce((a, b) => a + b, 0);
  const earthTotal = earthColors.reduce((a, b) => a + b, 0);
  const artTotal = artColors.reduce((a, b) => a + b, 0);

  // 用户输入长度转为mm
  const userLengthMM = useMemo(() => {
    if (lengthUnit === 'mm') return braceletLength;
    if (lengthUnit === 'cm') return braceletLength * 10;
    if (lengthUnit === 'in') return braceletLength * 25.4;
    return braceletLength;
  }, [braceletLength, lengthUnit]);

  // 固定珠子总长
  const fixedLength = mainBead.size + sizes.sky * maxSky + sizes.earth * maxEarth;

  // 自动计算术珠数量（剩余长度/术珠直径，向下取整，最大8，最小0）
  const autoArtCount = Math.max(0, Math.min(maxArt, Math.floor((userLengthMM - fixedLength) / sizes.art)));

  // 术珠分配校验
  React.useEffect(() => {
    if (artTotal !== autoArtCount) {
      // 自动分配第一个颜色
      const arr = [autoArtCount, 0, 0, 0, 0];
      setArtColors(arr);
    }
    // eslint-disable-next-line
  }, [autoArtCount]);

  // 价格计算
  function getBeadPrice(size: number, color: string) {
    return PRICE_TABLE[String(size)][grade][color] || 0;
  }
  const totalPrice = useMemo(() => {
    let price = 0;
    price += getBeadPrice(mainBead.size, mainBead.color);
    FIVE_COLORS.forEach((c, i) => {
      price += getBeadPrice(sizes.sky, c.name) * skyColors[i];
      price += getBeadPrice(sizes.earth, c.name) * earthColors[i];
      price += getBeadPrice(sizes.art, c.name) * artColors[i];
    });
    if (engraving) price += 75;
    return price;
  }, [mainBead, sizes, skyColors, earthColors, artColors, grade, engraving]);

  // 珠子总数
  const totalBeads = 1 + skyTotal + earthTotal + artTotal;

  // 五色珠子统计
  const colorStats = FIVE_COLORS.map((c, i) => skyColors[i] + earthColors[i] + artColors[i] + (mainColor === c.name ? 1 : 0));

  // 五色平衡度（最大最小差）
  const maxCount = Math.max(...colorStats);
  const minCount = Math.min(...colorStats);
  const balanceScore = maxCount - minCount;

  // 示意图，主珠后优先排同色珠子
  const renderBraceletSVG = () => {
    // 组装所有珠子
    type Bead = { size: number; color: string; isMain?: boolean };
    const mainColorObj = FIVE_COLORS.find(c => c.name === mainBead.color) || FIVE_COLORS[0];
    const beads: Bead[] = [];
    beads.push({ size: mainBead.size, color: mainColorObj.color, isMain: true });
    // 先排主珠同色的天珠、地珠、术珠
    const idx = FIVE_COLORS.findIndex(c => c.name === mainBead.color);
    for (let j = 0; j < skyColors[idx]; j++) beads.push({ size: sizes.sky, color: mainColorObj.color });
    for (let j = 0; j < earthColors[idx]; j++) beads.push({ size: sizes.earth, color: mainColorObj.color });
    for (let j = 0; j < artColors[idx]; j++) beads.push({ size: sizes.art, color: mainColorObj.color });
    // 其余颜色顺序不变
    FIVE_COLORS.forEach((c, i) => {
      if (i === idx) return;
      for (let j = 0; j < skyColors[i]; j++) beads.push({ size: sizes.sky, color: c.color });
      for (let j = 0; j < earthColors[i]; j++) beads.push({ size: sizes.earth, color: c.color });
      for (let j = 0; j < artColors[i]; j++) beads.push({ size: sizes.art, color: c.color });
    });
    // 计算圆心和半径，使珠子不重叠
    const N = beads.length;
    const maxR = Math.max(...beads.map(b => b.size));
    const sumD = beads.reduce((s, b) => s + b.size * 2, 0);
    const r = sumD / (2 * Math.PI) + maxR + 8;
    const cx = 180, cy = 110;
    return (
      <svg width={360} height={220} style={{ background: '#fafafa' }}>
        {beads.map((b, i) => {
          const angle = (2 * Math.PI / N) * i - Math.PI / 2;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          // 主珠刻字颜色
          let textColor = '#222';
          if (b.isMain && mainBead.color === '黑色') textColor = '#fff';
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={b.size} fill={b.color} stroke={b.isMain ? '#333' : '#aaa'} strokeWidth={b.isMain ? 4 : 2} />
              {b.isMain && engraving && engravingText && (
                <text x={x} y={y+4} textAnchor="middle" fontSize={b.size} fill={textColor}>{engravingText}</text>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  // 渲染五行色分配
  const renderColorInputs = (colors: number[], setColors: (arr: number[]) => void, max: number, label: string) => (
    <div style={{ marginBottom: 8 }}>
      <strong>{label}：</strong>
      {FIVE_COLORS.map((c, i) => (
        <span key={c.name} style={{ marginLeft: 8 }}>
          {c.name}
          <input
            type="number"
            min={0}
            max={max}
            value={colors[i]}
            onChange={e => {
              const arr = [...colors];
              let v = Number(e.target.value);
              // 限制总和
              const sum = colors.reduce((a, b, idx) => a + (idx === i ? 0 : b), 0) + v;
              if (sum > max) v = max - (sum - v);
              arr[i] = v;
              setColors(arr);
            }}
            style={{ width: 40, marginLeft: 2 }}
          />
        </span>
      ))}
      <span style={{ marginLeft: 8, color: (colors.reduce((a, b) => a + b, 0) !== max) ? 'red' : '#888' }}>
        共{colors.reduce((a, b) => a + b, 0)}颗 / {max}颗
      </span>
    </div>
  );

  // 渲染五色统计条
  const renderBalanceBar = () => {
    const maxBar = 120;
    const maxVal = Math.max(...colorStats);
    return (
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
        {FIVE_COLORS.map((c, i) => (
          <div key={c.name} style={{ marginRight: 8, textAlign: 'center' }}>
            <div style={{ background: c.color, width: maxBar * (colorStats[i] / maxVal || 0.05), height: 12, borderRadius: 4, marginBottom: 2 }}></div>
            <div style={{ fontSize: 12 }}>{c.name}</div>
            <div style={{ fontSize: 12 }}>{colorStats[i]}颗</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      {/* 打印区域开始 */}
      <div id="print-area">
        <h1>珠宝手串定制</h1>
        {/* 客户信息表单（可填写，打印时只显示文本） */}
        <div style={{ marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 8, boxShadow: '0 1px 4px #eee' }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>客户信息</h2>
          <div className="customer-form" style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: '1 1 200px' }}>
              <label>名字：</label>
              <span className="print-hide"><input type="text" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} style={{ width: '100%' }} /></span>
              <span className="print-only">{customer.name}</span>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label>电话：</label>
              <span className="print-hide"><input type="text" value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} style={{ width: '100%' }} /></span>
              <span className="print-only">{customer.phone}</span>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label>生日：</label>
              <span className="print-hide"><input type="date" value={customer.birthday} onChange={e => setCustomer({ ...customer, birthday: e.target.value })} style={{ width: '100%' }} /></span>
              <span className="print-only">{customer.birthday}</span>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label>时辰：</label>
              <span className="print-hide"><select value={customer.shichen} onChange={e => setCustomer({ ...customer, shichen: e.target.value })} style={{ width: '100%' }}>
                <option value="">请选择</option>
                {SHICHEN.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select></span>
              <span className="print-only">{SHICHEN.find(s=>s.value===customer.shichen)?.label||''}</span>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label>电子邮件：</label>
              <span className="print-hide"><input type="email" value={customer.email} onChange={e => setCustomer({ ...customer, email: e.target.value })} style={{ width: '100%' }} /></span>
              <span className="print-only">{customer.email}</span>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label>微信：</label>
              <span className="print-hide"><input type="text" value={customer.wechat} onChange={e => setCustomer({ ...customer, wechat: e.target.value })} style={{ width: '100%' }} /></span>
              <span className="print-only">{customer.wechat}</span>
            </div>
            <div style={{ flex: '2 1 400px' }}>
              <label>通信地址：</label>
              <span className="print-hide"><input type="text" value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} style={{ width: '100%' }} /></span>
              <span className="print-only">{customer.address}</span>
            </div>
            <div style={{ flex: '1 1 150px' }}>
              <label>城市：</label>
              <span className="print-hide"><input type="text" value={customer.city} onChange={e => setCustomer({ ...customer, city: e.target.value })} style={{ width: '100%' }} /></span>
              <span className="print-only">{customer.city}</span>
            </div>
            <div style={{ flex: '1 1 150px' }}>
              <label>省：</label>
              <span className="print-hide"><input type="text" value={customer.province} onChange={e => setCustomer({ ...customer, province: e.target.value })} style={{ width: '100%' }} /></span>
              <span className="print-only">{customer.province}</span>
            </div>
            <div style={{ flex: '1 1 150px' }}>
              <label>邮编：</label>
              <span className="print-hide"><input type="text" value={customer.zipcode} onChange={e => setCustomer({ ...customer, zipcode: e.target.value })} style={{ width: '100%' }} /></span>
              <span className="print-only">{customer.zipcode}</span>
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>选择性别：</label>
          <select value={gender} onChange={e => setGender(e.target.value as '男' | '女')}>
            <option value="男">男</option>
            <option value="女">女</option>
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>品级：</label>
          <select value={grade} onChange={e => setGrade(e.target.value)}>
            {GRADES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>主珠颜色：</label>
          <select value={mainColor} onChange={e => setMainColor(e.target.value)} disabled>
            {MAIN_COLORS.map(opt => <option key={opt.name} value={opt.name}>{opt.name}</option>)}
          </select>
          <span style={{ color: '#888', marginLeft: 8 }}>(自动跟随天珠最多颜色)</span>
        </div>
        {renderColorInputs(skyColors, setSkyColors, maxSky, '天珠（7颗）')}
        {renderColorInputs(earthColors, setEarthColors, maxEarth, '地珠（8颗）')}
        <div style={{ marginBottom: 8 }}>
          <strong>术珠尺寸：</strong>
          {gender === '男' ? (
            <select value={artBeadSize} onChange={e => setArtBeadSize(Number(e.target.value))}>
              <option value={8}>8mm</option>
              <option value={6}>6mm</option>
            </select>
          ) : (
            <span>6mm</span>
          )}
        </div>
        {renderColorInputs(artColors, setArtColors, autoArtCount, `术珠（${autoArtCount}颗，自动计算）`)}
        <div style={{ marginBottom: 16 }}>
          <label>手链长度：</label>
          <input
            type="number"
            min={100}
            max={300}
            value={braceletLength}
            onChange={e => setBraceletLength(Number(e.target.value))}
            style={{ width: 80, marginLeft: 8 }}
          />
          <select value={lengthUnit} onChange={e => setLengthUnit(e.target.value as any)} style={{ marginLeft: 8 }}>
            <option value="mm">毫米</option>
            <option value="cm">厘米</option>
            <option value="in">英寸</option>
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>
            <input type="checkbox" checked={engraving} onChange={e => setEngraving(e.target.checked)} />
            主珠刻字（+ $75）
          </label>
          {engraving && (
            <span>
              <input
                type="text"
                value={engravingText}
                onChange={handleEngravingInput}
                placeholder="1汉字或2英文字母"
                style={{ marginLeft: 12, padding: 4, width: 80 }}
              />
              {engravingError && <span style={{ color: 'red', marginLeft: 8 }}>{engravingError}</span>}
            </span>
          )}
        </div>
        <div style={{ marginTop: 32 }}>
          <strong>合计价格：</strong> <span>${totalPrice.toFixed(2)}</span>
        </div>
        <div style={{ marginTop: 8 }}>
          <strong>手链长度：</strong> <span>{userLengthMM.toFixed(2)} mm</span>
        </div>
        <div style={{ marginTop: 8 }}>
          <strong>珠子总数：</strong> <span>{totalBeads} 颗</span>
        </div>
        <div style={{ marginTop: 8 }}>
          <strong>五色珠子统计：</strong>
          <span style={{ marginLeft: 8 }}>
            {FIVE_COLORS.map((c, i) => (
              <span key={c.name} style={{ marginRight: 12, color: c.color }}>
                {c.name}{colorStats[i]}颗
              </span>
            ))}
          </span>
        </div>
        <div style={{ marginTop: 8 }}>
          <strong>五色平衡度：</strong> <span>{balanceScore === 0 ? '极佳' : balanceScore === 1 ? '良好' : balanceScore === 2 ? '一般' : '失衡'}</span>
          {renderBalanceBar()}
        </div>
        <div style={{ marginTop: 32, border: '1px solid #eee', padding: 16 }}>
          <strong>手链结构示意图</strong>
          {renderBraceletSVG()}
        </div>
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <button onClick={() => window.print()} style={{ fontSize: 18, padding: '10px 36px', background: '#222', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            打印/保存PDF
          </button>
        </div>
        {orderStatus && <div style={{ marginTop: 12, color: orderStatus.includes('成功') ? 'green' : 'red' }}>{orderStatus}</div>}
      </div>
      {/* 打印区域结束 */}
      {/* 其它内容（如按钮、交互）打印时隐藏 */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area { position: absolute; left: 0; top: 0; width: 100vw; background: white; z-index: 9999; }
          .print-hide { display: none !important; }
          .print-only { display: inline !important; }
          button, input, select, textarea { display: none !important; }
        }
        .print-only { display: none; }
      `}</style>
    </div>
  );
};

export default BraceletCustomizer; 