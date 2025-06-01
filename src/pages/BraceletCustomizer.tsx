import React, { useState, useMemo, useEffect } from 'react';

interface Material {
  _id: string;
  name: string;
  grade: string;
}
interface Color {
  _id: string;
  name: string;
}

interface BeadStructure {
  main: { size: number; count: number };
  sky: { size: number; count: number };
  earth: { size: number; count: number };
  art: { size: number; count: number[] };
}

const getBeadStructure = (gender: '男' | '女'): BeadStructure => {
  // 主珠: 男12mm/女10mm, 1颗
  // 天珠: 7颗，比主珠小2mm
  // 地珠: 8颗，比天珠小2mm
  // 术珠: 1-5颗，8mm或6mm（默认1颗8mm，后续可自定义）
  const mainSize = gender === '男' ? 12 : 10;
  const skySize = mainSize - 2;
  const earthSize = skySize - 2;
  return {
    main: { size: mainSize, count: 1 },
    sky: { size: skySize, count: 7 },
    earth: { size: earthSize, count: 8 },
    art: { size: 8, count: [1, 2, 3, 4, 5] } // 术珠数量后续可选
  };
};

const API_URL = process.env.REACT_APP_API_URL || '';

const BraceletCustomizer: React.FC = () => {
  const [gender, setGender] = useState<'男' | '女'>('男');
  const [engraving, setEngraving] = useState(false);
  const [artBeadCount, setArtBeadCount] = useState(1);
  const [artBeadSize, setArtBeadSize] = useState(8); // 8mm或6mm

  // 各类珠子的材质、颜色、品级选择
  const [mainBead, setMainBead] = useState({ material: '', color: '', grade: '' });
  const [skyBead, setSkyBead] = useState({ material: '', color: '', grade: '' });
  const [earthBead, setEarthBead] = useState({ material: '', color: '', grade: '' });
  const [artBead, setArtBead] = useState({ material: '', color: '', grade: '' });

  // 动态加载材质和颜色
  const [materials, setMaterials] = useState<Material[]>([]);
  const [colors, setColors] = useState<Color[]>([]);

  // 下单状态
  const [orderStatus, setOrderStatus] = useState<string | null>(null);

  // 价格表缓存
  const [beadPrices, setBeadPrices] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/materials`).then(res => res.json()).then(setMaterials);
    fetch(`${API_URL}/api/colors`).then(res => res.json()).then(setColors);
    fetch(`${API_URL}/api/bead-prices`).then(res => res.json()).then(setBeadPrices);
  }, []);

  // 价格查找函数
  function getBeadPrice(size: number, material: string, color: string, grade: string) {
    const mat = materials.find(m => m.name === material && m.grade === grade);
    const col = colors.find(c => c.name === color);
    if (!mat || !col) return 0;
    const priceObj = beadPrices.find(
      p => p.size === `${size}mm` && p.material._id === mat._id && p.color._id === col._id
    );
    return priceObj ? priceObj.price : 0;
  }

  const structure = useMemo(() => getBeadStructure(gender), [gender]);

  // 生成下拉选项
  const renderSelect = (value: string, setValue: (v: string) => void, options: { _id: string, name: string }[]) => (
    <select value={value} onChange={e => setValue(e.target.value)} style={{ marginLeft: 8 }}>
      <option value="">请选择</option>
      {options.map(opt => <option key={opt._id} value={opt.name}>{opt.name}</option>)}
    </select>
  );

  // 价格和长度计算
  const totalPrice = useMemo(() => {
    let price = 0;
    price += getBeadPrice(structure.main.size, mainBead.material, mainBead.color, mainBead.grade) * structure.main.count;
    price += getBeadPrice(structure.sky.size, skyBead.material, skyBead.color, skyBead.grade) * structure.sky.count;
    price += getBeadPrice(structure.earth.size, earthBead.material, earthBead.color, earthBead.grade) * structure.earth.count;
    price += getBeadPrice(artBeadSize, artBead.material, artBead.color, artBead.grade) * artBeadCount;
    if (engraving) price += 75;
    return price;
  }, [structure, mainBead, skyBead, earthBead, artBead, artBeadSize, artBeadCount, engraving, beadPrices, materials, colors]);

  const totalLength = useMemo(() => {
    let length = 0;
    length += structure.main.size * structure.main.count;
    length += structure.sky.size * structure.sky.count;
    length += structure.earth.size * structure.earth.count;
    length += artBeadSize * artBeadCount;
    return length;
  }, [structure, artBeadSize, artBeadCount]);

  // 下单函数
  const handleOrder = async () => {
    setOrderStatus(null);
    const order = {
      gender,
      mainBead: { ...mainBead, size: structure.main.size, count: structure.main.count },
      skyBeads: [{ ...skyBead, size: structure.sky.size, count: structure.sky.count }],
      earthBeads: [{ ...earthBead, size: structure.earth.size, count: structure.earth.count }],
      artBeads: [{ ...artBead, size: artBeadSize, count: artBeadCount }],
      engraving: { enabled: engraving, price: engraving ? 75 : 0 },
      totalPrice: totalPrice,
      totalLength: totalLength
    };
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      if (res.ok) {
        setOrderStatus('下单成功！');
      } else {
        setOrderStatus('下单失败，请检查信息');
      }
    } catch {
      setOrderStatus('下单失败，网络错误');
    }
  };

  // 五行颜色顺序和映射
  const fiveElements = [
    { name: '木', colorName: '绿色', color: '#4caf50' },
    { name: '火', colorName: '红色', color: '#e53935' },
    { name: '土', colorName: '黄色', color: '#fbc02d' },
    { name: '金', colorName: '白色', color: '#e0e0e0' },
    { name: '水', colorName: '黑色', color: '#222' },
  ];
  // 颜色名到五行色的映射
  const colorMap: Record<string, string> = {
    '绿色': '#4caf50',
    '红色': '#e53935',
    '黄色': '#fbc02d',
    '白色': '#e0e0e0',
    '黑色': '#222',
  };

  // 环状排列珠子
  const renderBraceletSVG = () => {
    // 组装所有珠子，主珠、天珠、地珠、术珠，按五行顺序分组
    type Bead = { size: number; color: string; isMain?: boolean };
    const beads: Bead[] = [];
    // 主珠
    beads.push({ size: structure.main.size, color: colorMap[mainBead.color] || '#e88f8f', isMain: true });
    // 天珠、地珠、术珠分组
    const groupBeads = (count: number, size: number, color: string) => Array(count).fill(0).map(() => ({ size, color: colorMap[color] || '#aaa' }));
    // 按五行顺序分组天珠
    fiveElements.forEach(fe => {
      if (skyBead.color === fe.colorName) beads.push(...groupBeads(structure.sky.count, structure.sky.size, fe.colorName));
    });
    // 地珠
    fiveElements.forEach(fe => {
      if (earthBead.color === fe.colorName) beads.push(...groupBeads(structure.earth.count, structure.earth.size, fe.colorName));
    });
    // 术珠
    fiveElements.forEach(fe => {
      if (artBead.color === fe.colorName) beads.push(...groupBeads(artBeadCount, artBeadSize, fe.colorName));
    });
    // 计算圆心和半径
    const N = beads.length;
    const cx = 180, cy = 110, r = 80;
    return (
      <svg width={360} height={220} style={{ background: '#fafafa' }}>
        {beads.map((b, i) => {
          // 主珠在12点钟方向
          const angle = (2 * Math.PI / N) * i - Math.PI / 2;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          return (
            <circle key={i} cx={x} cy={y} r={b.size * 2.2} fill={b.color} stroke={b.isMain ? '#333' : '#aaa'} strokeWidth={b.isMain ? 4 : 2} />
          );
        })}
      </svg>
    );
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <h1>珠宝手串定制</h1>
      <div style={{ marginBottom: 16 }}>
        <label>选择性别：</label>
        <select value={gender} onChange={e => setGender(e.target.value as '男' | '女')}>
          <option value="男">男</option>
          <option value="女">女</option>
        </select>
      </div>
      <div style={{ marginBottom: 16, background: '#f8f8f8', padding: 12, borderRadius: 6 }}>
        <strong>珠子结构：</strong>
        <div>
          主珠：{structure.main.size}mm × {structure.main.count} 颗
          材质：{renderSelect(mainBead.material, v => setMainBead(b => ({ ...b, material: v })), materials)}
          颜色：{renderSelect(mainBead.color, v => setMainBead(b => ({ ...b, color: v })), colors)}
          品级：
          <select value={mainBead.grade} onChange={e => setMainBead(b => ({ ...b, grade: e.target.value }))} style={{ marginLeft: 8 }}>
            <option value="">请选择</option>
            <option value="上品">上品</option>
            <option value="中品">中品</option>
            <option value="下品">下品</option>
          </select>
        </div>
        <div>
          天珠：{structure.sky.size}mm × {structure.sky.count} 颗
          材质：{renderSelect(skyBead.material, v => setSkyBead(b => ({ ...b, material: v })), materials)}
          颜色：{renderSelect(skyBead.color, v => setSkyBead(b => ({ ...b, color: v })), colors)}
          品级：
          <select value={skyBead.grade} onChange={e => setSkyBead(b => ({ ...b, grade: e.target.value }))} style={{ marginLeft: 8 }}>
            <option value="">请选择</option>
            <option value="上品">上品</option>
            <option value="中品">中品</option>
            <option value="下品">下品</option>
          </select>
        </div>
        <div>
          地珠：{structure.earth.size}mm × {structure.earth.count} 颗
          材质：{renderSelect(earthBead.material, v => setEarthBead(b => ({ ...b, material: v })), materials)}
          颜色：{renderSelect(earthBead.color, v => setEarthBead(b => ({ ...b, color: v })), colors)}
          品级：
          <select value={earthBead.grade} onChange={e => setEarthBead(b => ({ ...b, grade: e.target.value }))} style={{ marginLeft: 8 }}>
            <option value="">请选择</option>
            <option value="上品">上品</option>
            <option value="中品">中品</option>
            <option value="下品">下品</option>
          </select>
        </div>
        <div>
          术珠：{artBeadSize}mm × {artBeadCount} 颗
          材质：{renderSelect(artBead.material, v => setArtBead(b => ({ ...b, material: v })), materials)}
          颜色：{renderSelect(artBead.color, v => setArtBead(b => ({ ...b, color: v })), colors)}
          品级：
          <select value={artBead.grade} onChange={e => setArtBead(b => ({ ...b, grade: e.target.value }))} style={{ marginLeft: 8 }}>
            <option value="">请选择</option>
            <option value="上品">上品</option>
            <option value="中品">中品</option>
            <option value="下品">下品</option>
          </select>
        </div>
        <div style={{ marginTop: 8 }}>
          术珠数量：
          <select value={artBeadCount} onChange={e => setArtBeadCount(Number(e.target.value))}>
            {structure.art.count.map(n => <option key={n} value={n}>{n} 颗</option>)}
          </select>
          <select value={artBeadSize} onChange={e => setArtBeadSize(Number(e.target.value))} style={{ marginLeft: 8 }}>
            <option value={8}>8mm</option>
            <option value={6}>6mm</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>
          <input type="checkbox" checked={engraving} onChange={e => setEngraving(e.target.checked)} />
          主珠刻字（+ $75）
        </label>
      </div>
      {/* 价格、长度、示意图等展示区域 */}
      <div style={{ marginTop: 32 }}>
        <strong>合计价格：</strong> <span>￥{totalPrice.toFixed(2)}</span>
      </div>
      <div style={{ marginTop: 8 }}>
        <strong>手链长度：</strong> <span>{totalLength.toFixed(2)} mm</span>
      </div>
      <div style={{ marginTop: 32, border: '1px solid #eee', padding: 16 }}>
        <strong>手链结构示意图</strong>
        {renderBraceletSVG()}
      </div>
      <div style={{ marginTop: 32 }}>
        <button onClick={handleOrder} style={{ padding: '8px 24px', fontSize: 16 }}>提交订单</button>
        {orderStatus && <div style={{ marginTop: 12, color: orderStatus.includes('成功') ? 'green' : 'red' }}>{orderStatus}</div>}
      </div>
    </div>
  );
};

export default BraceletCustomizer; 