import { Lunar } from 'lunar-javascript';

// 天干地支转五行映射
export const FIVE_ELEMENTS_MAP = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
  '子': '水', '丑': '土',
  '寅': '木', '卯': '木',
  '辰': '土', '巳': '火',
  '午': '火', '未': '土',
  '申': '金', '酉': '金',
  '戌': '土', '亥': '水'
} as const;

export interface BirthDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
}

export interface BaziResult {
  year: [string, string];
  month: [string, string];
  day: [string, string];
  hour: [string, string];
  solarDate: string;
  lunarDate: string;
  fiveElements: {
    year: [string, string];
    month: [string, string];
    day: [string, string];
    hour: [string, string];
  };
}

export interface FiveElementStat {
  element: string;
  count: number;
  percentage: number;
}

// 计算八字和五行分布
export function calculateBazi(selectedDate: BirthDateTime): BaziResult {
  const { year, month, day, hour } = selectedDate;
  const lunar = Lunar.fromDate(new Date(year, month - 1, day, hour));
  const yearGanZhi = lunar.getYearInGanZhi();
  const monthGanZhi = lunar.getMonthInGanZhi();
  const dayGanZhi = lunar.getDayInGanZhi();
  const timeGanZhi = lunar.getTimeInGanZhi();
  const solarDateStr = `${year}年${month}月${day}日 ${hour}时`;
  const lunarDateStr = `农历${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
  const fiveElements = {
    year: [FIVE_ELEMENTS_MAP[yearGanZhi[0] as keyof typeof FIVE_ELEMENTS_MAP], FIVE_ELEMENTS_MAP[yearGanZhi[1] as keyof typeof FIVE_ELEMENTS_MAP]] as [string, string],
    month: [FIVE_ELEMENTS_MAP[monthGanZhi[0] as keyof typeof FIVE_ELEMENTS_MAP], FIVE_ELEMENTS_MAP[monthGanZhi[1] as keyof typeof FIVE_ELEMENTS_MAP]] as [string, string],
    day: [FIVE_ELEMENTS_MAP[dayGanZhi[0] as keyof typeof FIVE_ELEMENTS_MAP], FIVE_ELEMENTS_MAP[dayGanZhi[1] as keyof typeof FIVE_ELEMENTS_MAP]] as [string, string],
    hour: [FIVE_ELEMENTS_MAP[timeGanZhi[0] as keyof typeof FIVE_ELEMENTS_MAP], FIVE_ELEMENTS_MAP[timeGanZhi[1] as keyof typeof FIVE_ELEMENTS_MAP]] as [string, string]
  };
  return {
    year: yearGanZhi,
    month: monthGanZhi,
    day: dayGanZhi,
    hour: timeGanZhi,
    solarDate: solarDateStr,
    lunarDate: lunarDateStr,
    fiveElements
  };
}

// 统计五行数量和百分比
export function calculateFiveElementsStats(bazi: BaziResult): FiveElementStat[] {
  const stats = {
    '木': 0,
    '火': 0,
    '土': 0,
    '金': 0,
    '水': 0
  };
  Object.values(bazi.fiveElements).forEach(pillar => {
    pillar.forEach(element => {
      stats[element as keyof typeof stats]++;
    });
  });
  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  return Object.entries(stats).map(([element, count]) => ({
    element,
    count,
    percentage: Math.round((count / total) * 100)
  }));
} 