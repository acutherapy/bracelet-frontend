import React, { useState, useMemo } from 'react';
import { calculateBazi, calculateFiveElementsStats, BirthDateTime } from '../utils/bazi/calculateBazi';
import { useTranslation } from 'react-i18next';
import './BraceletCustomizer.css';

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
    // D1 修复：结果相同则不更新，避免无意义的重渲染
    setRenColors(prev => (prev.length === renArr.length && prev.every((v, i) => v === renArr[i]) ? prev : renArr));
    // D1 修复：原依赖含每次渲染新建的 sizes 对象，导致每次渲染都重新分配并覆盖用户第一次手动修改；改为依赖其中的数值
  }, [mainColor, skyColors, earthColors, userLengthMM, sizes.sky, sizes.earth, mainBead.size, renBeadSize, renManual, renCount]);

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
      <svg viewBox="0 0 360 220" className="bc-svg" data-testid="svg" role="img" aria-label={t('structure')}>
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

  // ===== 显示层辅助（只读上方原有值，不参与计算） =====
  const isCJK = /^(zh|ja|ko)/.test(i18n.resolvedLanguage || i18n.language || 'zh');
  const beadsN = (n: number) => t('beadsN', { count: n });
  const joinWord = (a: string, b: string) => (isCJK ? a + b : a + ' ' + b);
  // 数量状态：已选 / 需要 / 还差或多出（数字直接取自原 state 与原计算结果）
  const countState = (selected: number, target: number) => (selected === target ? 'ok' : selected < target ? 'short' : 'over');
  const countText = (selected: number, target: number) => {
    const s = countState(selected, target);
    const key = s === 'ok' ? 'countOk' : s === 'short' ? 'countShort' : 'countOver';
    return t(key, { selected, target, diff: Math.abs(target - selected) });
  };
  const renderCount = (selected: number, target: number, testid?: string) => {
    const s = countState(selected, target);
    return (
      <div className={'bc-count ' + (s === 'ok' ? 'is-ok' : 'is-warn')} data-testid={testid} role="status">
        <span aria-hidden="true">{s === 'ok' ? '✓' : '!'}</span> {countText(selected, target)}
      </div>
    );
  };

  // 渲染五行色分配（天珠/地珠）
  // 显示层：步进器 + 数字框。onValue 函数体与旧版 onChange 完全一致；+/− 按钮只是用新值调用同一函数。
  const renderColorInputs = (colors: number[], setColors: (arr: number[]) => void, max: number, label: string, testid?: string) => {
    const total = colors.reduce((a, b) => a + b, 0);
    return (
      <div className="bc-colors" data-testid={testid}>
        <div className="bc-colors-grid">
          {FIVE_COLOR_KEYS.map((key, i) => {
            const onValue = (e: { target: { value: string } }) => {
              const arr = [...colors];
              let v = Number(e.target.value);
              // 限制总和
              const sum = colors.reduce((a, b, idx) => a + (idx === i ? 0 : b), 0) + v;
              if (sum > max) v = max - (sum - v);
              arr[i] = v;
              setColors(arr);
            };
            return (
              <div key={key} className={'bc-color' + (colors[i] ? ' is-on' : '')}>
                <span className="bc-color-name"><span className="bc-dot" style={{ background: COLOR_MAP[key] }} />{colorLabel(key)}</span>
                <div className="bc-stepper">
                  <button type="button" aria-label={`${colorLabel(key)} −1`} disabled={colors[i] <= 0} onClick={() => onValue({ target: { value: String(colors[i] - 1) } })}>−</button>
                  <input type="number" inputMode="numeric" min={0} max={max} value={colors[i]} onChange={onValue} aria-label={`${label} ${colorLabel(key)}`} />
                  <button type="button" aria-label={`${colorLabel(key)} +1`} disabled={total >= max} onClick={() => onValue({ target: { value: String(colors[i] + 1) } })}>+</button>
                </div>
              </div>
            );
          })}
        </div>
        {renderCount(total, max, testid ? testid + '-count' : undefined)}
      </div>
    );
  };

  // 渲染五行色分配（人珠）
  const renderRenColorInputs = (colors: number[], setColors: (arr: number[]) => void, max: number, label: string) => {
    const total = colors.reduce((a, b) => a + b, 0);
    return (
      <div className="bc-colors" data-testid="ren">
        <div className="bc-row-between">
          <strong className="bc-label bc-label-flush" data-testid="ren-count" data-value={max}>{label}</strong>
          <button type="button" data-testid="auto-match" onClick={handleRenAutoMatch} className={'bc-btn bc-btn-small ' + (renManual ? 'bc-btn-gold' : 'bc-btn-ghost')}>
            {t('autoMatch')}
          </button>
        </div>
        <p className="bc-note">{t('renTargetNote')}</p>
        {renManual && <p className="bc-note bc-note-warn" data-testid="ren-manual">{t('manualMatch')}</p>}
        <div className="bc-colors-grid">
          {FIVE_COLOR_KEYS.map((key, i) => {
            const onValue = (e: { target: { value: string } }) => {
              const arr = [...colors];
              let v = Number(e.target.value);
              // 限制总和
              arr[i] = v;
              handleRenColorChange(arr);
            };
            return (
              <div key={key} className={'bc-color' + (colors[i] ? ' is-on' : '')}>
                <span className="bc-color-name"><span className="bc-dot" style={{ background: COLOR_MAP[key] }} />{colorLabel(key)}</span>
                <div className="bc-stepper">
                  <button type="button" aria-label={`${colorLabel(key)} −1`} disabled={colors[i] <= 0} onClick={() => onValue({ target: { value: String(colors[i] - 1) } })}>−</button>
                  <input type="number" inputMode="numeric" min={0} max={max} value={colors[i]} onChange={onValue} aria-label={`${label} ${colorLabel(key)}`} />
                  <button type="button" aria-label={`${colorLabel(key)} +1`} disabled={total >= max} onClick={() => onValue({ target: { value: String(colors[i] + 1) } })}>+</button>
                </div>
              </div>
            );
          })}
        </div>
        {renderCount(total, max, 'ren-status')}
      </div>
    );
  };

  // 渲染五色统计条
  const renderBalanceBar = () => {
    const maxVal = Math.max(...colorStats);
    return (
      <div className="bc-bars">
        {FIVE_COLOR_KEYS.map((key, i) => (
          <div key={key} className="bc-bar-row">
            <span className="bc-bar-name">{colorLabel(key)}</span>
            <span className="bc-bar-track"><span className="bc-bar-fill" style={{ background: MAIN_COLORS[i]?.color, width: `${100 * (colorStats[i] / maxVal || 0.05)}%` }} /></span>
            <span className="bc-bar-num">{colorStats[i]}</span>
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
    // D2 修复：日期不存在（如 2 月 31 日）时不生成，界面显示错误
    if (birthDay > getDaysInMonth(birthYear, birthMonth)) return;
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
    // D2 修复：日期不存在时不生成
    if (earthDay > getDaysInMonth(earthYear, earthMonth)) return;
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

  // ===== 显示层（仅布局与样式；所有取值、setter、计算均沿用上方原代码） =====
  const balanceKey = balanceScore === 0 ? 'perfect' : balanceScore === 1 ? 'good' : balanceScore === 2 ? 'normal' : 'bad';
  const gradeMaterial = (g: string) => (g === '上品' ? t('gradeMaterial.high') : g === '中品' ? t('gradeMaterial.mid') : t('gradeMaterial.low'));
  const gradeText = (g: string) => (g === '上品' ? t('grade.high') : g === '中品' ? t('grade.mid') : t('grade.low'));
  const genderText = (g: string) => (g === '男' ? t('gender.male') : t('gender.female'));
  const colorList = (arr: number[]) => FIVE_COLOR_KEYS.map((key, i) => arr[i] ? `${colorLabel(key)} ${arr[i]}` : '').filter(Boolean).join(' · ') || '—';
  const hourLabel = (v: number) => hours.find(h => h.value === v)?.label || '';
  const monthText = (m: number) => (isCJK ? t('time.month', { month: m }) : new Intl.DateTimeFormat(i18n.resolvedLanguage || 'en', { month: 'short' }).format(new Date(2000, m - 1, 1)));
  const yearText = (y: number) => (isCJK ? t('time.year', { year: y }) : String(y));
  const dayText = (d: number) => (isCJK ? t('time.day', { day: d }) : String(d));
  const colon = t('colon');
  // D2：日期有效性（显示与按钮状态）
  const birthInvalid = birthDay > daysInMonth;
  const earthInvalid = earthDay > earthDaysInMonth;
  const ymText = (y: number, m: number) => (isCJK ? yearText(y) + monthText(m) : `${monthText(m)} ${y}`);
  const dayOptions = (max: number, current: number) => {
    const list = Array.from({ length: max }, (_, i) => i + 1).map(d => <option key={d} value={d}>{dayText(d)}</option>);
    if (current > max) list.push(<option key={current} value={current}>{dayText(current)}{t('invalidMark')}</option>);
    return list;
  };
  const seg = (name: string, value: string, current: string, onPick: (v: string) => void, text: React.ReactNode) => (
    <label key={value} className={'bc-seg-opt' + (current === value ? ' is-selected' : '')}>
      <input type="radio" name={name} value={value} checked={current === value} onChange={e => onPick(e.target.value)} />
      <span>{text}</span>
    </label>
  );

  // 未选齐提示：已选数量与目标数量都直接取自原 state / 原计算（skyTotal、earthTotal、renTotal、maxSky、maxEarth、renCount）
  const groups = [
    { name: t('groupSky'), selected: skyTotal, target: maxSky, href: '#sec-sky' },
    { name: t('groupEarth'), selected: earthTotal, target: maxEarth, href: '#sec-earth' },
    { name: t('renBeads'), selected: renTotal, target: renCount, href: '#sec-ren' },
  ];
  const issues = groups.filter(g => g.selected !== g.target).map(g => ({
    ...g,
    text: t(g.selected < g.target ? 'todoShort' : 'todoOver', { group: g.name, diff: Math.abs(g.target - g.selected) }),
  }));

  // 客户信息折叠（纯显示状态）
  const CUSTOMER_FIELDS = [
    ['name', 'text', 'bc-f-half'], ['phone', 'tel', 'bc-f-half'],
    ['email', 'email', 'bc-f-half'], ['wechat', 'text', 'bc-f-half'],
    ['address', 'text', 'bc-f-full'], ['city', 'text', 'bc-f-third'],
    ['province', 'text', 'bc-f-third'], ['zipcode', 'text', 'bc-f-third'],
  ] as const;
  const [custOpen, setCustOpen] = useState(false);
  const custFilled = CUSTOMER_FIELDS.filter(([k]) => String(customer[k]).trim() !== '').length;

  // 桌面结果栏：整页统一滚动；结果栏比视口高时，先随页面滚到底部再固定（不产生第二条滚动条）
  const asideRef = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    const el = asideRef.current;
    if (!el) return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => {
      if (!mq.matches) { el.style.top = ''; return; }
      const h = el.offsetHeight, vh = window.innerHeight;
      el.style.top = (h + 32 <= vh ? 16 : vh - h - 16) + 'px';
    };
    update();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    ro?.observe(el);
    window.addEventListener('resize', update);
    return () => { ro?.disconnect(); window.removeEventListener('resize', update); };
  }, []);

  return (
    <div className="bc-app">
      <header className="bc-header">
        <div className="bc-header-inner">
          <img src={`${process.env.PUBLIC_URL}/acutherapy-logo.png`} alt="AcuTherapy Clinics" className="bc-logo" />
          {/* 语言切换控件 */}
          <select className="bc-lang" aria-label="Language" data-testid="lang" value={i18n.language} onChange={e => i18n.changeLanguage(e.target.value)}>
            <option value="zh">中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
            <option value="ko">한국어</option>
            <option value="es">Español</option>
            <option value="de">Deutsch</option>
          </select>
        </div>
      </header>

      {/* 打印区域开始 */}
      <div id="print-area" className="bc-main">
        <h1 className="bc-title">{t('title')}</h1>
        <div className="bc-layout">
          <div className="bc-form">

            {/* 1 性别 / 品级 */}
            <section className="bc-card" id="sec-basic">
              <h2 className="bc-card-title"><span className="bc-step">1</span>{t('genderLabel')} / {t('gradeLabel')}</h2>
              <fieldset className="bc-fieldset" data-testid="gender">
                <legend className="bc-label">{t('genderLabel')}</legend>
                <div className="bc-seg">
                  {seg('gender', '男', gender, v => setGender(v as '男' | '女'), t('gender.male'))}
                  {seg('gender', '女', gender, v => setGender(v as '男' | '女'), t('gender.female'))}
                </div>
              </fieldset>
              <fieldset className="bc-fieldset" data-testid="grade">
                <legend className="bc-label">{t('gradeLabel')}</legend>
                <div className="bc-choice-grid">
                  {([['上品', 'grade.high'], ['中品', 'grade.mid'], ['下品', 'grade.low']] as const).map(([v, k]) => (
                    <label key={v} className={'bc-choice' + (grade === v ? ' is-selected' : '')}>
                      <input type="radio" name="grade" value={v} checked={grade === v} onChange={e => setGrade(e.target.value)} />
                      <span className="bc-choice-title">{t(k)}</span>
                      <span className="bc-choice-sub">{gradeMaterial(v)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </section>

            {/* 2 天珠 */}
            <section className="bc-card" id="sec-sky">
              <h2 className="bc-card-title"><span className="bc-step">2</span>{t('skyBeads')}</h2>
              <div className="bc-main-color" data-testid="main-color" data-value={mainColor}>
                <span className="bc-label">{t('mainColor')}</span>
                <span className="bc-chip"><span className="bc-dot bc-dot-lg" style={{ background: COLOR_MAP[mainColor] || '#e88f8f' }} />{COLOR_MAP[mainColor] ? colorLabel(mainColor) : mainColor}</span>
                <span className="bc-note">{t('mainColorNote', { btn: t('autoSky') })}</span>
              </div>
              <div className="bc-field">
                <label htmlFor="birth-y">{t('birthday')}</label>
                <div className="bc-date">
                  <select id="birth-y" data-testid="birth-y" value={birthYear} onChange={e => setBirthYear(Number(e.target.value))}>
                    {years.map(y => <option key={y} value={y}>{yearText(y)}</option>)}
                  </select>
                  <select data-testid="birth-m" aria-label={t('birthday')} value={birthMonth} onChange={e => setBirthMonth(Number(e.target.value))}>
                    {months.map(m => <option key={m} value={m}>{monthText(m)}</option>)}
                  </select>
                  <select data-testid="birth-d" aria-label={t('birthday')} aria-invalid={birthInvalid} aria-describedby={birthInvalid ? 'birth-err' : undefined} className={birthInvalid ? 'is-error' : ''} value={birthDay} onChange={e => setBirthDay(Number(e.target.value))}>
                    {dayOptions(daysInMonth, birthDay)}
                  </select>
                  <select data-testid="birth-h" aria-label={t('birthday')} value={birthHour} onChange={e => setBirthHour(Number(e.target.value))}>
                    {hours.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                  </select>
                </div>
                {birthInvalid && <p id="birth-err" role="alert" className="bc-error" data-testid="birth-error">{t('dateInvalid', { ym: ymText(birthYear, birthMonth), max: daysInMonth })}</p>}
              </div>
              <button type="button" data-testid="auto-sky" className="bc-btn bc-btn-primary bc-btn-block" disabled={birthInvalid} onClick={handleAutoSky}>{t('autoSky')}</button>
              {renderColorInputs(skyColors, setSkyColors, maxSky, t('groupSky'), 'sky')}
            </section>

            {/* 3 地珠 */}
            <section className="bc-card" id="sec-earth">
              <h2 className="bc-card-title"><span className="bc-step">3</span>{t('earthBeads')}</h2>
              <div className="bc-field">
                <label htmlFor="earth-y">{t('selectTime')}</label>
                <div className="bc-date">
                  <select id="earth-y" data-testid="earth-y" value={earthYear} onChange={e => setEarthYear(Number(e.target.value))}>
                    {years.map(y => <option key={y} value={y}>{yearText(y)}</option>)}
                  </select>
                  <select data-testid="earth-m" aria-label={t('selectTime')} value={earthMonth} onChange={e => setEarthMonth(Number(e.target.value))}>
                    {months.map(m => <option key={m} value={m}>{monthText(m)}</option>)}
                  </select>
                  <select data-testid="earth-d" aria-label={t('selectTime')} aria-invalid={earthInvalid} aria-describedby={earthInvalid ? 'earth-err' : undefined} className={earthInvalid ? 'is-error' : ''} value={earthDay} onChange={e => setEarthDay(Number(e.target.value))}>
                    {dayOptions(earthDaysInMonth, earthDay)}
                  </select>
                  <select data-testid="earth-h" aria-label={t('selectTime')} value={earthHour} onChange={e => setEarthHour(Number(e.target.value))}>
                    {hours.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                  </select>
                </div>
                {earthInvalid && <p id="earth-err" role="alert" className="bc-error" data-testid="earth-error">{t('dateInvalid', { ym: ymText(earthYear, earthMonth), max: earthDaysInMonth })}</p>}
              </div>
              <button type="button" data-testid="auto-earth" className="bc-btn bc-btn-primary bc-btn-block" disabled={earthInvalid} onClick={handleAutoEarth}>{t('autoEarth')}</button>
              {renderColorInputs(earthColors, setEarthColors, maxEarth, t('groupEarth'), 'earth')}
            </section>

            {/* 4 手链长度 / 人珠 */}
            <section className="bc-card" id="sec-ren">
              <h2 className="bc-card-title"><span className="bc-step">4</span>{t('braceletLength')} / {t('renBeads')}</h2>
              <div className="bc-field">
                <label htmlFor="len">{t('braceletLength')}</label>
                <div className="bc-inline">
                  <input id="len" data-testid="len" className="bc-input-num" type="number" inputMode="decimal" min={100} max={300} value={braceletLength} onChange={e => setBraceletLength(Number(e.target.value))} />
                  <div className="bc-seg" data-testid="unit">
                    {seg('unit', 'mm', lengthUnit, v => setLengthUnit(v as any), t('unit.mm'))}
                    {seg('unit', 'cm', lengthUnit, v => setLengthUnit(v as any), t('unit.cm'))}
                    {seg('unit', 'in', lengthUnit, v => setLengthUnit(v as any), t('unit.inch'))}
                  </div>
                </div>
              </div>
              <div className="bc-field" data-testid="ren-size" data-value={gender === '男' ? renBeadSize : 6}>
                <span className="bc-label">{t('renSize')}</span>
                {gender === '男' ? (
                  <div className="bc-seg">
                    {seg('renSize', '8', String(renBeadSize), v => setRenBeadSize(Number(v)), t('beadSize.8mm'))}
                    {seg('renSize', '6', String(renBeadSize), v => setRenBeadSize(Number(v)), t('beadSize.6mm'))}
                  </div>
                ) : (
                  <span className="bc-chip">{t('beadSize.6mm')}</span>
                )}
              </div>
              {renderRenColorInputs(renColors, setRenColors, renCount, t('renBeads'))}
            </section>

            {/* 5 刻字 */}
            <section className="bc-card" id="sec-engrave">
              <label className="bc-check">
                <input type="checkbox" data-testid="engrave" checked={engraving} onChange={e => setEngraving(e.target.checked)} />
                <span className="bc-step">5</span>
                <span className="bc-card-title-text">{t('engraving')}</span>
              </label>
              {engraving && (
                <div className="bc-field bc-engrave">
                  <input
                    type="text"
                    data-testid="engrave-text"
                    aria-label={t('engraving')}
                    aria-invalid={!!engravingError}
                    aria-describedby="engrave-err"
                    className={engravingError ? 'is-error' : ''}
                    value={engravingText}
                    onChange={handleEngravingInput}
                    placeholder={t('inputHint')}
                  />
                  {engravingError && <p id="engrave-err" role="alert" className="bc-error" data-testid="engrave-error">{engravingError.match(/[A-Za-z]/) ? t('engravingError.en') : t('engravingError.zh')}</p>}
                </div>
              )}
            </section>

            {/* 6 客户信息（屏幕上放在定制选项之后、可折叠；打印时排在最前） */}
            <section className={'bc-card bc-customer' + (custOpen ? ' is-open' : '')} id="sec-customer">
              <button type="button" className="bc-cust-toggle print-hide" data-testid="customer-toggle" aria-expanded={custOpen} aria-controls="cust-body" onClick={() => setCustOpen(!custOpen)}>
                <span className="bc-step">6</span>
                <span className="bc-cust-head">
                  <span className="bc-card-title-text">{t('customerInfo')}</span>
                  <span className="bc-note">{t('customerNote', { n: custFilled, total: CUSTOMER_FIELDS.length })}</span>
                </span>
                <span className="bc-cust-action">{custOpen ? t('collapse') : t('expand')}<span aria-hidden="true" className="bc-chev">▾</span></span>
              </button>
              <div id="cust-body" className="bc-cust-body">
                <div className="customer-form bc-fields">
                  {CUSTOMER_FIELDS.map(([k, type, cls]) => (
                    <div className={'bc-field ' + cls} key={k}>
                      <label htmlFor={'f-' + k}>{t(k)}</label>
                      <input id={'f-' + k} data-testid={'c-' + k} type={type} value={customer[k]} onChange={e => setCustomer({ ...customer, [k]: e.target.value })} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* 结果 */}
          <aside className="bc-summary" id="sec-result" ref={asideRef}>
            <div className="bc-card bc-result">
              <div className="bc-price-row">
                <span className="bc-label">{t('totalPrice')}</span>
                <span className="bc-price" data-testid="price">${totalPrice.toFixed(2)}</span>
              </div>
              {issues.length > 0 && (
                <div className="bc-todo print-hide" data-testid="todo">
                  <strong>{t('todoTitle')}</strong>
                  <ul>
                    {issues.map(g => (
                      <li key={g.href}><span>{g.text}</span><a href={g.href}>{t('edit')}</a></li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="bc-kv">
                <div>
                  <span>{t('braceletLength')}</span>
                  <strong>
                    <span data-testid="len-out">{userLengthMM.toFixed(2)} {t('unit.mm')}</span>
                    {lengthUnit !== 'mm' && <span className="bc-kv-sub">{t('lenFrom', { value: braceletLength, unit: lengthUnit === 'cm' ? t('unit.cm') : t('unit.inch') })}</span>}
                  </strong>
                </div>
                <div>
                  <span>{t('totalBeadsLabel')}</span>
                  <strong>
                    <span data-testid="total-beads" data-value={totalBeads}>{beadsN(totalBeads)}</span>
                    <span className="bc-kv-sub">{t('mainBead')} 1 + {t('groupSky')} {skyTotal} + {t('groupEarth')} {earthTotal} + {t('renBeads')} {renTotal}</span>
                  </strong>
                </div>
              </div>
              <div className="bc-svg-wrap">
                <div className="bc-row-between">
                  <span className="bc-label bc-label-flush">{t('structure')}</span>
                  <span className="bc-note">{t('diagramNote', { beads: beadsN(totalBeads) })}</span>
                </div>
                {renderBraceletSVG()}
              </div>
              <div className="bc-balance">
                <div className="bc-row-between">
                  <span className="bc-label bc-label-flush">{t('balance')}</span>
                  <span className={'bc-badge bc-badge-' + balanceKey} data-testid="balance" data-value={balanceKey}>{t(`balanceLevel.${balanceKey}`)}</span>
                </div>
                <div className="sr-only" data-testid="stat">{t('stat')}{colon}{FIVE_COLOR_KEYS.map((key, i) => joinWord(colorLabel(key), beadsN(colorStats[i]))).join(' ')}</div>
                {renderBalanceBar()}
              </div>
              <dl className="bc-choices print-hide">
                <div><dt>{t('genderLabel')} / {t('gradeLabel')}</dt><dd>{genderText(gender)} · {gradeText(grade)} · {gradeMaterial(grade)}</dd><a href="#sec-basic">{t('edit')}</a></div>
                <div><dt>{t('groupSky')}</dt><dd>{colorList(skyColors)}</dd><a href="#sec-sky">{t('edit')}</a></div>
                <div><dt>{t('groupEarth')}</dt><dd>{colorList(earthColors)}</dd><a href="#sec-earth">{t('edit')}</a></div>
                <div><dt>{t('renBeads')}</dt><dd>{colorList(renColors)}</dd><a href="#sec-ren">{t('edit')}</a></div>
                <div><dt>{t('customerInfo')}</dt><dd>{t('custFilled', { n: custFilled, total: CUSTOMER_FIELDS.length })}</dd><a href="#sec-customer" onClick={() => setCustOpen(true)}>{t('edit')}</a></div>
              </dl>
              <button type="button" data-testid="print-btn" className="bc-btn bc-btn-primary bc-btn-block bc-btn-lg" onClick={() => window.print()}>
                {t('print')}
              </button>
              {orderStatus && <div style={{ marginTop: 12, color: orderStatus.includes('成功') ? 'green' : 'red' }}>{orderStatus}</div>}
            </div>
          </aside>
        </div>
        {/* ===== 打印 / 保存 PDF 专用单据（屏幕不显示；所有数值取自上方原计算） ===== */}
        <div className="bc-sheet" data-testid="sheet">
          <header className="bc-sheet-head">
            <img src={`${process.env.PUBLIC_URL}/acutherapy-logo.png`} alt="AcuTherapy Clinics" className="bc-sheet-logo" />
            <h1 className="bc-sheet-title">{t('title')}</h1>
          </header>

          <section className="bc-sheet-sec">
            <h2 className="bc-sheet-h">{t('customerInfo')}</h2>
            <dl className="bc-sheet-cust">
              {([['name', 2], ['phone', 2], ['birthday', 2], ['email', 2], ['wechat', 2], ['zipcode', 2], ['address', 3], ['city', 2], ['province', 1]] as const).map(([k, span]) => (
                <div key={k} style={{ gridColumn: `span ${span}` }}>
                  <dt>{t(k)}</dt>
                  <dd data-print={'c-' + k}>{k === 'birthday' ? `${birthYear}-${birthMonth}-${birthDay} ${hourLabel(birthHour)}` : (customer[k] || '—')}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="bc-sheet-sec bc-sheet-mid">
            <div className="bc-sheet-diagram">
              <h2 className="bc-sheet-h">{t('structure')}</h2>
              {renderBraceletSVG()}
            </div>
            <div className="bc-sheet-spec">
              <h2 className="bc-sheet-h">{t('sheetOrder')}</h2>
              <dl>
                <div><dt>{t('genderLabel')}</dt><dd data-print="gender">{genderText(gender)}</dd></div>
                <div><dt>{t('gradeLabel')}</dt><dd><span data-print="grade">{gradeText(grade)}</span> · {gradeMaterial(grade)}</dd></div>
                <div><dt>{t('mainColor')}</dt><dd><span className="bc-dot" style={{ background: COLOR_MAP[mainColor] || '#e88f8f' }} />{COLOR_MAP[mainColor] ? colorLabel(mainColor) : mainColor}</dd></div>
                <div><dt>{t('braceletLength')}</dt><dd>{userLengthMM.toFixed(2)} {t('unit.mm')}{lengthUnit !== 'mm' && <small> · {t('lenFrom', { value: braceletLength, unit: lengthUnit === 'cm' ? t('unit.cm') : t('unit.inch') })}</small>}</dd></div>
                <div><dt>{t('totalBeadsLabel')}</dt><dd>{beadsN(totalBeads)}</dd></div>
                <div><dt>{t('balance')}</dt><dd><span className={'bc-badge bc-badge-' + balanceKey}>{t(`balanceLevel.${balanceKey}`)}</span></dd></div>
                <div><dt>{t('engraving')}</dt><dd>{engraving && engravingText ? <strong className="bc-sheet-engrave">{engravingText}</strong> : t('none')}</dd></div>
              </dl>
            </div>
          </section>

          <section className="bc-sheet-sec">
            <h2 className="bc-sheet-h">{t('sheetBeads')}</h2>
            <table className="bc-sheet-table">
              <thead>
                <tr>
                  <th>{t('colType')}</th><th>{t('colSize')}</th>
                  {FIVE_COLOR_KEYS.map(key => <th key={key} data-print-color={key}><span className="bc-dot" style={{ background: COLOR_MAP[key] }} />{colorLabel(key)}</th>)}
                  <th>{t('colTotal')}</th>
                </tr>
              </thead>
              <tbody>
                {([
                  [t('mainBead'), sizes.main, FIVE_COLOR_KEYS.map(key => (mainColor === key ? 1 : 0)), 1],
                  [t('groupSky'), sizes.sky, skyColors, skyTotal],
                  [t('groupEarth'), sizes.earth, earthColors, earthTotal],
                  [t('renBeads'), renBeadSize, renColors, renTotal],
                ] as [string, number, number[], number][]).map(([name, size, arr, sum]) => (
                  <tr key={name}>
                    <th scope="row">{name}</th><td>{size} {t('unit.mm')}</td>
                    {arr.map((v, i) => <td key={i} className={v ? '' : 'is-zero'}>{v || '·'}</td>)}
                    <td className="bc-sheet-sum">{sum}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan={2}>{t('stat')}</th>
                  {FIVE_COLOR_KEYS.map((key, i) => <td key={key} data-print-stat={key}>{skyColors[i] + earthColors[i] + renColors[i] + (mainColor === key ? 1 : 0)}</td>)}
                  <td className="bc-sheet-sum">{totalBeads}</td>
                </tr>
              </tfoot>
            </table>
          </section>

          <footer className="bc-sheet-foot">
            <span>{t('totalPrice')}</span>
            <strong data-print="price">${totalPrice.toFixed(2)}</strong>
          </footer>
        </div>
      </div>
      {/* 打印区域结束 */}

      {/* 手机/平板：底部固定结果条 */}
      <div className="bc-bottombar" data-testid="bottombar">
        <div className="bc-bottombar-info">
          <span className="bc-bottombar-price">${totalPrice.toFixed(2)}</span>
          {issues.length > 0 ? (
            <a className="bc-bottombar-warn" href={issues[0].href}>! {issues.length > 1 ? t('issuesCount', { n: issues.length }) : ''}{issues[0].text} ›</a>
          ) : (
            <span className="bc-bottombar-sub">{beadsN(totalBeads)} · {t(`balanceLevel.${balanceKey}`)}</span>
          )}
        </div>
        <a className="bc-btn bc-btn-gold" href="#sec-result">{t('viewResult')}</a>
      </div>

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
