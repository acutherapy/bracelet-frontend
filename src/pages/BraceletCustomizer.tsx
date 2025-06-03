import React, { useState, useMemo } from 'react';
import { calculateBazi, calculateFiveElementsStats, BirthDateTime } from '../utils/bazi/calculateBazi';
import { useTranslation } from 'react-i18next';

// 品级
const GRADES = [
  { value: '上品', label: '上品' },
  { value: '中品', label: '中品' },
  { value: '下品', label: '下品' },
];

const BraceletCustomizer: React.FC = () => {
  const { t, i18n } = useTranslation();
  // 颜色key
  const FIVE_COLOR_KEYS = ['green', 'red', 'yellow', 'white', 'black'];
  // key到五行名
  const wuxingMap: Record<string, string> = {
    green: '木',
    red: '火',
    yellow: '土',
    white: '金',
    black: '水',
  };
  // key到色值
  const COLOR_MAP: Record<string, string> = {
    green: '#4caf50',
    red: '#e53935',
    yellow: '#fbc02d',
    white: '#e0e0e0',
    black: '#222',
  };
  // key到多语言文本
  const colorLabel = (key: string) => t(`color.${key}`);
  // 主珠可选颜色（key）
  const MAIN_COLOR_KEYS = [...FIVE_COLOR_KEYS, 'pink', 'blue', 'purple', 'brown'];
  const MAIN_COLORS = [
    ...FIVE_COLOR_KEYS.map(key => ({ name: key, color: COLOR_MAP[key] })),
    { name: 'pink', color: '#e88f8f' },
    { name: 'blue', color: '#2196f3' },
    { name: 'purple', color: '#9c27b0' },
    { name: 'brown', color: '#795548' },
  ];
  // 年、月、日、时辰选项（国际化）
  const years = useMemo(() => Array.from({ length: 201 }, (_, i) => 1900 + i), []);
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();
  const hours = [
    { branch: '子', label: t('hourLabel', { label: '23:00-0:59' }), value: 23 },
    { branch: '丑', label: t('hourLabel', { label: '1:00-2:59' }), value: 1 },
    { branch: '寅', label: t('hourLabel', { label: '3:00-4:59' }), value: 3 },
    { branch: '卯', label: t('hourLabel', { label: '5:00-6:59' }), value: 5 },
    { branch: '辰', label: t('hourLabel', { label: '7:00-8:59' }), value: 7 },
    { branch: '巳', label: t('hourLabel', { label: '9:00-10:59' }), value: 9 },
    { branch: '午', label: t('hourLabel', { label: '11:00-12:59' }), value: 11 },
    { branch: '未', label: t('hourLabel', { label: '13:00-14:59' }), value: 13 },
    { branch: '申', label: t('hourLabel', { label: '15:00-16:59' }), value: 15 },
    { branch: '酉', label: t('hourLabel', { label: '17:00-18:59' }), value: 17 },
    { branch: '戌', label: t('hourLabel', { label: '19:00-20:59' }), value: 19 },
    { branch: '亥', label: t('hourLabel', { label: '21:00-22:59' }), value: 21 }
  ];
  const getSizes = (gender: '男' | '女', artBeadSize: number) => {
    if (gender === '男') {
      return { main: 12, sky: 10, earth: 8, art: artBeadSize };
    } else {
      return { main: 10, sky: 8, earth: 6, art: 6 };
    }
  };
  const maxSky = 7, maxEarth = 8, maxRen = 8;

  // 价格表（玛瑙，单位：美元/颗）
  const PRICE_TABLE: Record<string, Record<string, Record<string, number>>> = {
    '12': {
      '上品': { green: 50, red: 45, yellow: 40, white: 45, black: 60 },
      '中品': { green: 45, red: 40, yellow: 30, white: 40, black: 50 },
      '下品': { green: 40, red: 35, yellow: 20, white: 35, black: 40 },
    },
    '10': {
      '上品': { green: 45, red: 45, yellow: 30, white: 35, black: 50 },
      '中品': { green: 40, red: 40, yellow: 25, white: 35, black: 45 },
      '下品': { green: 35, red: 35, yellow: 20, white: 30, black: 40 },
    },
    '8': {
      '上品': { green: 35, red: 30, yellow: 25, white: 30, black: 45 },
      '中品': { green: 35, red: 25, yellow: 20, white: 25, black: 40 },
      '下品': { green: 30, red: 20, yellow: 15, white: 20, black: 35 },
    },
    '6': {
      '上品': { green: 25, red: 30, yellow: 20, white: 25, black: 35 },
      '中品': { green: 20, red: 20, yellow: 15, white: 20, black: 30 },
      '下品': { green: 15, red: 20, yellow: 10, white: 15, black: 20 },
    },
  };

  const [gender, setGender] = useState<'男' | '女'>('男');
  const [grade, setGrade] = useState('上品');
  // 主珠颜色自动跟随天珠最多的颜色
  const [mainColor, setMainColor] = useState('red');
  const [skyColors, setSkyColors] = useState(FIVE_COLOR_KEYS.map(() => 0));
  const [earthColors, setEarthColors] = useState(FIVE_COLOR_KEYS.map(() => 0));
  const [renColors, setRenColors] = useState(FIVE_COLOR_KEYS.map(() => 0));
  const [renBeadSize, setRenBeadSize] = useState(8); // 男可选8/6，女固定6
  const [renManual, setRenManual] = useState(false); // 是否手动调整过
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
    if (gender === '女') setRenBeadSize(6);
  }, [gender]);

  // 尺寸
  const sizes = getSizes(gender, renBeadSize);

  // 天珠最多的颜色自动设为主珠颜色
  // ... existing code ...

  // 主珠
  const mainBead = { size: sizes.main, color: mainColor };

  // 天珠、地珠、术珠五行色分配
  const skyTotal = skyColors.reduce((a, b) => a + b, 0);
  const earthTotal = earthColors.reduce((a, b) => a + b, 0);
  const renTotal = renColors.reduce((a, b) => a + b, 0);

  // 用户输入长度转为mm
  const userLengthMM = useMemo(() => {
    if (lengthUnit === 'mm') return braceletLength;
    if (lengthUnit === 'cm') return braceletLength * 10;
    if (lengthUnit === 'in') return braceletLength * 25.4;
    return braceletLength;
  }, [braceletLength, lengthUnit]);

  // 固定珠子总长
  const fixedLength = mainBead.size + sizes.sky * maxSky + sizes.earth * maxEarth;

  // 需要分配的人珠数量（自动计算）
  const renCount = useMemo(() => Math.max(0, Math.min(maxRen, Math.floor((userLengthMM - (mainBead.size + sizes.sky * maxSky + sizes.earth * maxEarth)) / renBeadSize))), [userLengthMM, mainBead.size, sizes.sky, sizes.earth, maxSky, maxEarth, renBeadSize]);

  // 智能分配人珠（自动执行，除非用户手动调整）
  React.useEffect(() => {
    if (renManual) return; // 用户手动调整后不再自动分配
    // 统计主珠、天珠、地珠五色数量
    const baseStats = FIVE_COLOR_KEYS.map((key, i) =>
      skyColors[i] + earthColors[i] + (mainColor === key ? 1 : 0)
    );
    // 目标：让五色总数尽量平衡
    let renArr = [0, 0, 0, 0, 0];
    let stats = [...baseStats];
    for (let i = 0; i < renCount; i++) {
      // 找到当前最少的颜色分配一个人珠
      const minIdx = stats.indexOf(Math.min(...stats));
      renArr[minIdx]++;
      stats[minIdx]++;
    }
    setRenColors(renArr);
  }, [mainColor, skyColors, earthColors, userLengthMM, sizes, mainBead.size, renBeadSize, renManual, renCount]);

  // 人珠手动调整（总和不能超过renCount）
  const handleRenColorChange = (arr: number[]) => {
    let sum = arr.reduce((a, b) => a + b, 0);
    if (sum > renCount) {
      // 超出自动截断
      let left = renCount;
      arr = arr.map((v, i) => {
        if (left <= 0) return 0;
        if (v > left) { const t = left; left = 0; return t; }
        left -= v; return v;
      });
    }
    setRenColors(arr);
    setRenManual(true);
  };

  // 智能匹配按钮
  const handleRenAutoMatch = () => {
    setRenManual(false);
  };

  // 价格计算
  function getBeadPrice(size: number, color: string) {
    return PRICE_TABLE[String(size)][grade][color] || 0;
  }
  const totalPrice = useMemo(() => {
    let price = 0;
    price += getBeadPrice(mainBead.size, mainBead.color);
    FIVE_COLOR_KEYS.forEach((key, i) => {
      price += getBeadPrice(sizes.sky, key) * skyColors[i];
      price += getBeadPrice(sizes.earth, key) * earthColors[i];
      price += getBeadPrice(renBeadSize, key) * renColors[i];
    });
    if (engraving) price += 75;
    return price;
  }, [mainBead, sizes, skyColors, earthColors, renColors, grade, engraving, renBeadSize]);

  // 珠子总数
  const totalBeads = 1 + skyTotal + earthTotal + renTotal;

  // 五色珠子统计
  const colorStats = FIVE_COLOR_KEYS.map((key, i) => skyColors[i] + earthColors[i] + renColors[i] + (mainColor === key ? 1 : 0));

  // 五色平衡度（最大最小差）
  const maxCount = Math.max(...colorStats);
  const minCount = Math.min(...colorStats);
  const balanceScore = maxCount - minCount;

  // 示意图，主珠在12点，紧跟主珠色所有珠子，然后依次排主珠色下一个五行色的所有珠子，直到五色循环一圈
  const renderBraceletSVG = () => {
    type Bead = { size: number; color: string; isMain?: boolean };
    const beads: Bead[] = [];
    // 主珠
    const mainIdx = FIVE_COLOR_KEYS.findIndex(key => key === mainBead.color);
    beads.push({ size: mainBead.size, color: MAIN_COLORS[mainIdx]?.color || '#e88f8f', isMain: true });
    // 统计每种五行色的珠子数量（天珠+地珠+人珠）
    const colorCounts = FIVE_COLOR_KEYS.map((key, i) => skyColors[i] + earthColors[i] + renColors[i]);
    // 按主珠色开始的五行顺序分组排列
    for (let offset = 0; offset < 5; offset++) {
      const idx = (mainIdx + offset) % 5;
      let count = colorCounts[idx];
      let usedSky = 0, usedEarth = 0, usedRen = 0;
      for (let j = 0; j < count; j++) {
        let size = 0;
        if (usedSky < skyColors[idx]) { size = sizes.sky; usedSky++; }
        else if (usedEarth < earthColors[idx]) { size = sizes.earth; usedEarth++; }
        else { size = renBeadSize; usedRen++; }
        beads.push({ size, color: MAIN_COLORS[idx]?.color || '#e88f8f' });
      }
    }
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
          let textColor = '#222';
          if (b.isMain && mainBead.color === 'black') textColor = '#fff';
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

  // 渲染五行色分配（天珠/地珠）
  const renderColorInputs = (colors: number[], setColors: (arr: number[]) => void, max: number, label: string) => (
    <div style={{ marginBottom: 8 }}>
      <strong>{label}：</strong>
      {FIVE_COLOR_KEYS.map((key, i) => (
        <span key={key} style={{ marginLeft: 8 }}>
          {colorLabel(key)}
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
        {t('beadSummary', { count: colors.reduce((a, b) => a + b, 0), total: max, unit: t('unit.piece') })}
      </span>
    </div>
  );

  // 渲染五行色分配（人珠）
  const renderRenColorInputs = (colors: number[], setColors: (arr: number[]) => void, max: number, label: string) => {
    // 去掉"，自动计算"
    const labelNoAuto = label.replace(/，自动计算/, '');
    return (
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
        <strong>{labelNoAuto}：</strong>
        {FIVE_COLOR_KEYS.map((key, i) => (
          <span key={key} style={{ marginLeft: 8 }}>
            {colorLabel(key)}
            <input
              type="number"
              min={0}
              max={max}
              value={colors[i]}
              onChange={e => {
                const arr = [...colors];
                let v = Number(e.target.value);
                // 限制总和
                arr[i] = v;
                handleRenColorChange(arr);
              }}
              style={{ width: 40, marginLeft: 2 }}
            />
          </span>
        ))}
        <span style={{ marginLeft: 8, color: (colors.reduce((a, b) => a + b, 0) !== max) ? 'red' : '#888' }}>
          {t('beadSummary', { count: colors.reduce((a, b) => a + b, 0), total: max, unit: t('unit.piece') })}
        </span>
        <button onClick={handleRenAutoMatch} style={{ marginLeft: 16, padding: '2px 12px', fontSize: 14, background: renManual ? '#ff9800' : '#eee', color: renManual ? '#fff' : '#333', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          {t('autoMatch')}
        </button>
        {renManual && <span style={{ color: '#ff9800', marginLeft: 8 }}>{t('manualMatch')}</span>}
      </div>
    );
  };

  // 渲染五色统计条
  const renderBalanceBar = () => {
    const maxBar = 120;
    const maxVal = Math.max(...colorStats);
    return (
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
        {FIVE_COLOR_KEYS.map((key, i) => (
          <div key={key} style={{ marginRight: 8, textAlign: 'center' }}>
            <div style={{ background: MAIN_COLORS[i]?.color, width: maxBar * (colorStats[i] / maxVal || 0.05), height: 12, borderRadius: 4, marginBottom: 2 }}></div>
            <div style={{ fontSize: 12 }}>{colorLabel(key)}</div>
            <div style={{ fontSize: 12 }}>{colorStats[i]}{t('unit.piece')}</div>
          </div>
        ))}
      </div>
    );
  };

  // 新增state
  const [birthYear, setBirthYear] = useState<number>(1990);
  const [birthMonth, setBirthMonth] = useState<number>(1);
  const [birthDay, setBirthDay] = useState<number>(1);
  const [birthHour, setBirthHour] = useState<number>(23);

  // 动态天数
  const daysInMonth = getDaysInMonth(birthYear, birthMonth);

  // 自动生成天珠（根据客户生日和时辰，主珠与天珠联动）
  const handleAutoSky = () => {
    if (!birthYear || !birthMonth || !birthDay || !birthHour) {
      alert('请先填写生日和时辰');
      return;
    }
    const birth: BirthDateTime = { year: birthYear, month: birthMonth, day: birthDay, hour: birthHour };
    const bazi = calculateBazi(birth);
    const stats = calculateFiveElementsStats(bazi);
    // 1. 统计五行分布（8颗）
    let arr = FIVE_COLOR_KEYS.map(key => {
      const wuxing = wuxingMap[key];
      return stats.find(s => s.element === wuxing)?.count || 0;
    });
    // 2. 主珠占用最多的五行（如有并列取第一个）
    const maxCount = Math.max(...arr);
    const mainIdx = arr.findIndex(v => v === maxCount);
    const mainColorKey = FIVE_COLOR_KEYS[mainIdx];
    // 3. 主珠直接设为该key，并从该五行数量中减去1
    arr[mainIdx] = Math.max(0, arr[mainIdx] - 1);
    // 4. 补齐到7颗
    let sum = arr.reduce((a, b) => a + b, 0);
    const wuxingSheng = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
    while (sum < 7) {
      const maxIdx = arr.indexOf(Math.max(...arr));
      const maxWuxing = wuxingMap[FIVE_COLOR_KEYS[maxIdx]];
      const shengWuxing = wuxingSheng[maxWuxing as keyof typeof wuxingSheng];
      const shengIdx = FIVE_COLOR_KEYS.findIndex(key => wuxingMap[key] === shengWuxing);
      if (shengIdx >= 0) {
        arr[shengIdx]++;
      } else {
        arr[maxIdx]++;
      }
      sum = arr.reduce((a, b) => a + b, 0);
    }
    while (sum > 7) {
      const maxIdx = arr.indexOf(Math.max(...arr));
      arr[maxIdx]--;
      sum = arr.reduce((a, b) => a + b, 0);
    }
    setMainColor(mainColorKey);
    setSkyColors(arr);
  };

  // 新增state
  const [earthYear, setEarthYear] = useState<number>(new Date().getFullYear());
  const [earthMonth, setEarthMonth] = useState<number>(new Date().getMonth() + 1);
  const [earthDay, setEarthDay] = useState<number>(new Date().getDate());
  const [earthHour, setEarthHour] = useState<number>(() => {
    const now = new Date();
    const hour = now.getHours();
    // 匹配最近的时辰
    let closest = hours[0].value;
    let minDiff = Math.abs(hour - hours[0].value);
    for (let h of hours) {
      const diff = Math.abs(hour - h.value);
      if (diff < minDiff) { minDiff = diff; closest = h.value; }
    }
    return closest;
  });
  const earthDaysInMonth = getDaysInMonth(earthYear, earthMonth);

  // 修改handleAutoEarth，使用earthYear, earthMonth, earthDay, earthHour
  const handleAutoEarth = () => {
    const birth: BirthDateTime = { year: earthYear, month: earthMonth, day: earthDay, hour: earthHour };
    const bazi = calculateBazi(birth);
    const stats = calculateFiveElementsStats(bazi);
    let arr = FIVE_COLOR_KEYS.map(key => {
      const wuxing = wuxingMap[key];
      return stats.find(s => s.element === wuxing)?.count || 0;
    });
    let sum = arr.reduce((a, b) => a + b, 0);
    while (sum < 8) {
      const maxIdx = arr.indexOf(Math.max(...arr));
      arr[maxIdx]++;
      sum = arr.reduce((a, b) => a + b, 0);
    }
    while (sum > 8) {
      const maxIdx = arr.indexOf(Math.max(...arr));
      arr[maxIdx]--;
      sum = arr.reduce((a, b) => a + b, 0);
    }
    setEarthColors(arr);
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      {/* 语言切换控件 */}
      <div style={{ textAlign: 'right', marginBottom: 8 }}>
        <select value={i18n.language} onChange={e => i18n.changeLanguage(e.target.value)}>
          <option value="zh">中文</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
          <option value="ko">한국어</option>
          <option value="es">Español</option>
          <option value="de">Deutsch</option>
        </select>
      </div>
      {/* 打印区域开始 */}
      <div id="print-area">
        <h1>{t('title')}</h1>
        {/* 客户信息表单（可填写，打印时只显示文本） */}
        <div style={{ marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 8, boxShadow: '0 1px 4px #eee' }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>{t('customerInfo')}</h2>
          <div className="customer-form" style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: '1 1 200px' }}>
              <label>{t('name')}：</label>
              <span className="print-hide"><input type="text" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} style={{ width: '100%' }} /></span>
              <span className="print-only">{customer.name}</span>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label>{t('phone')}：</label>
              <span className="print-hide"><input type="text" value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} style={{ width: '100%' }} /></span>
              <span className="print-only">{customer.phone}</span>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label>{t('birthday')}：</label>
              <span className="print-hide">
                <select value={birthYear} onChange={e => setBirthYear(Number(e.target.value))} style={{ width: 80, marginRight: 4 }}>
                  {years.map(y => <option key={y} value={y}>{t('time.year', { year: y })}</option>)}
                </select>
                <select value={birthMonth} onChange={e => setBirthMonth(Number(e.target.value))} style={{ width: 60, marginRight: 4 }}>
                  {months.map(m => <option key={m} value={m}>{t('time.month', { month: m })}</option>)}
                </select>
                <select value={birthDay} onChange={e => setBirthDay(Number(e.target.value))} style={{ width: 60, marginRight: 4 }}>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => <option key={d} value={d}>{t('time.day', { day: d })}</option>)}
                </select>
                <select value={birthHour} onChange={e => setBirthHour(Number(e.target.value))} style={{ width: 120 }}>
                  {hours.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                </select>
              </span>
              <span className="print-only">{birthYear}-{birthMonth}-{birthDay} {hours.find(h=>h.value===birthHour)?.label||''}</span>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label>{t('email')}：</label>
              <span className="print-hide"><input type="email" value={customer.email} onChange={e => setCustomer({ ...customer, email: e.target.value })} style={{ width: '100%' }} /></span>
              <span className="print-only">{customer.email}</span>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label>{t('wechat')}：</label>
              <span className="print-hide"><input type="text" value={customer.wechat} onChange={e => setCustomer({ ...customer, wechat: e.target.value })} style={{ width: '100%' }} /></span>
              <span className="print-only">{customer.wechat}</span>
            </div>
            <div style={{ flex: '2 1 400px' }}>
              <label>{t('address')}：</label>
              <span className="print-hide"><input type="text" value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} style={{ width: '100%' }} /></span>
              <span className="print-only">{customer.address}</span>
            </div>
            <div style={{ flex: '1 1 150px' }}>
              <label>{t('city')}：</label>
              <span className="print-hide"><input type="text" value={customer.city} onChange={e => setCustomer({ ...customer, city: e.target.value })} style={{ width: '100%' }} /></span>
              <span className="print-only">{customer.city}</span>
            </div>
            <div style={{ flex: '1 1 150px' }}>
              <label>{t('province')}：</label>
              <span className="print-hide"><input type="text" value={customer.province} onChange={e => setCustomer({ ...customer, province: e.target.value })} style={{ width: '100%' }} /></span>
              <span className="print-only">{customer.province}</span>
            </div>
            <div style={{ flex: '1 1 150px' }}>
              <label>{t('zipcode')}：</label>
              <span className="print-hide"><input type="text" value={customer.zipcode} onChange={e => setCustomer({ ...customer, zipcode: e.target.value })} style={{ width: '100%' }} /></span>
              <span className="print-only">{customer.zipcode}</span>
            </div>
          </div>
          {/* 打印时显示性别、品级、五色珠子数目 */}
          <div className="print-only" style={{ marginTop: 16, fontSize: 16 }}>
            <div><strong>{t('genderLabel')}：</strong>{gender}</div>
            <div><strong>{t('gradeLabel')}：</strong>{grade}</div>
            <div><strong>{t('stat')}：</strong>
              {FIVE_COLOR_KEYS.map((key, i) => (
                <span key={key} style={{ marginRight: 12, color: MAIN_COLORS[i]?.color }}>
                  {colorLabel(key)}{skyColors[i] + earthColors[i] + renColors[i] + (mainColor === key ? 1 : 0)}{t('unit.piece')}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>{t('genderLabel')}：</label>
          <select value={gender} onChange={e => setGender(e.target.value as '男' | '女')}>
            <option value="男">{t('gender.male')}</option>
            <option value="女">{t('gender.female')}</option>
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>{t('gradeLabel')}：</label>
          <select value={grade} onChange={e => setGrade(e.target.value)}>
            <option value="上品">{t('grade.high')}</option>
            <option value="中品">{t('grade.mid')}</option>
            <option value="下品">{t('grade.low')}</option>
          </select>
          <span style={{ color: '#888', marginLeft: 8 }}>
            {grade === '上品' && t('gradeMaterial.high')}
            {grade === '中品' && t('gradeMaterial.mid')}
            {grade === '下品' && t('gradeMaterial.low')}
          </span>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>{t('mainColor')}：</label>
          <select value={mainColor} onChange={e => setMainColor(e.target.value)} disabled>
            {MAIN_COLORS.map(opt => <option key={opt.name} value={opt.name}>{opt.name}</option>)}
          </select>
          <span style={{ color: '#888', marginLeft: 8 }}>({t('mainColor')} {t('autoSky')})</span>
        </div>
        {/* 天珠/地珠分配区上方插入自动生成按钮 */}
        <div style={{ marginBottom: 8 }}>
          <button onClick={handleAutoSky} style={{ marginRight: 12, padding: '2px 12px', borderRadius: 4, border: '1px solid #aaa', background: '#f5f5f5', cursor: 'pointer' }}>{t('autoSky')}</button>
          <span style={{ marginRight: 8 }}>
            <select value={earthYear} onChange={e => setEarthYear(Number(e.target.value))} style={{ width: 80, marginRight: 4 }}>
              {years.map(y => <option key={y} value={y}>{t('time.year', { year: y })}</option>)}
            </select>
            <select value={earthMonth} onChange={e => setEarthMonth(Number(e.target.value))} style={{ width: 60, marginRight: 4 }}>
              {months.map(m => <option key={m} value={m}>{t('time.month', { month: m })}</option>)}
            </select>
            <select value={earthDay} onChange={e => setEarthDay(Number(e.target.value))} style={{ width: 60, marginRight: 4 }}>
              {Array.from({ length: earthDaysInMonth }, (_, i) => i + 1).map(d => <option key={d} value={d}>{t('time.day', { day: d })}</option>)}
            </select>
            <select value={earthHour} onChange={e => setEarthHour(Number(e.target.value))} style={{ width: 120 }}>
              {hours.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>
          </span>
          <button onClick={handleAutoEarth} style={{ padding: '2px 12px', borderRadius: 4, border: '1px solid #aaa', background: '#f5f5f5', cursor: 'pointer' }}>{t('autoEarth')}</button>
        </div>
        {renderColorInputs(skyColors, setSkyColors, maxSky, t('skyBeads'))}
        {renderColorInputs(earthColors, setEarthColors, maxEarth, t('earthBeads'))}
        <div style={{ marginBottom: 8 }}>
          <strong>{t('renBeads')}尺寸：</strong>
          {gender === '男' ? (
            <select value={renBeadSize} onChange={e => setRenBeadSize(Number(e.target.value))}>
              <option value={8}>{t('beadSize.8mm')}</option>
              <option value={6}>{t('beadSize.6mm')}</option>
            </select>
          ) : (
            <span>{t('beadSize.6mm')}</span>
          )}
        </div>
        {renderRenColorInputs(renColors, setRenColors, renCount, `${t('renBeads')}（${renCount}${t('unit.piece')}）`)}
        <div style={{ marginBottom: 16 }}>
          <label>{t('braceletLength')}：</label>
          <input
            type="number"
            min={100}
            max={300}
            value={braceletLength}
            onChange={e => setBraceletLength(Number(e.target.value))}
            style={{ width: 80, marginLeft: 8 }}
          />
          <select value={lengthUnit} onChange={e => setLengthUnit(e.target.value as any)} style={{ marginLeft: 8 }}>
            <option value="mm">{t('unit.mm')}</option>
            <option value="cm">{t('unit.cm')}</option>
            <option value="in">{t('unit.inch')}</option>
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>
            <input type="checkbox" checked={engraving} onChange={e => setEngraving(e.target.checked)} />
            {t('engraving')}
          </label>
          {engraving && (
            <span>
              <input
                type="text"
                value={engravingText}
                onChange={handleEngravingInput}
                placeholder={t('inputHint')}
                style={{ marginLeft: 12, padding: 4, width: 80 }}
              />
              {engravingError && <span style={{ color: 'red', marginLeft: 8 }}>{engravingError.match(/[A-Za-z]/) ? t('engravingError.en') : t('engravingError.zh')}</span>}
            </span>
          )}
        </div>
        <div style={{ marginTop: 32 }}>
          <strong>{t('totalPrice')}：</strong> <span>${totalPrice.toFixed(2)}</span>
        </div>
        <div style={{ marginTop: 8 }}>
          <strong>{t('braceletLength')}：</strong> <span>{userLengthMM.toFixed(2)} {t(`unit.${lengthUnit}`)}</span>
        </div>
        <div style={{ marginTop: 8 }}>
          <strong>{t('totalBeads', { count: totalBeads, unit: t('unit.piece') })}</strong>
        </div>
        <div style={{ marginTop: 8 }}>
          <strong>{t('stat')}：</strong>
          <span style={{ marginLeft: 8 }}>
            {FIVE_COLOR_KEYS.map((key, i) => (
              <span key={key} style={{ marginRight: 12, color: MAIN_COLORS[i]?.color }}>
                {colorLabel(key)}{colorStats[i]}{t('unit.piece')}
              </span>
            ))}
          </span>
        </div>
        <div style={{ marginTop: 8 }}>
          <strong>{t('balance')}：</strong> <span>{t(`balanceLevel.${balanceScore === 0 ? 'perfect' : balanceScore === 1 ? 'good' : balanceScore === 2 ? 'normal' : 'bad'}`)}</span>
          {renderBalanceBar()}
        </div>
        <div style={{ marginTop: 32, border: '1px solid #eee', padding: 16 }}>
          <strong>{t('structure')}</strong>
          {renderBraceletSVG()}
        </div>
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <button onClick={() => window.print()} style={{ fontSize: 18, padding: '10px 36px', background: '#222', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            {t('print')}
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
        }
        .print-only { display: none; }
      `}</style>
    </div>
  );
};

export default BraceletCustomizer; 