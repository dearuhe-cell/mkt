export function formatDateToYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatKoreanDate(dateStr: string, includeDayOfWeek: boolean = true): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dayOfWeek = dayNames[d.getDay()];

  if (includeDayOfWeek) {
    return `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;
  }
  return `${year}년 ${month}월 ${day}일`;
}

export function formatKoreanMonth(year: number, month: number): string {
  return `${year}년 ${month}월`;
}

export function formatTimeKorean(timeStr?: string): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h < 12 ? '오전' : '오후';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${ampm} ${hour12}:${String(m).padStart(2, '0')}`;
}

export function getRelativeDayLabel(dateStr: string): string | null {
  const todayStr = formatDateToYMD(new Date());
  if (dateStr === todayStr) return '오늘';

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dateStr === formatDateToYMD(tomorrow)) return '내일';

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === formatDateToYMD(yesterday)) return '어제';

  // Calculate D-day
  const [y, m, d] = dateStr.split('-').map(Number);
  const targetDate = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0 && diffDays <= 14) {
    return `D-${diffDays}`;
  } else if (diffDays < 0 && diffDays >= -7) {
    return `D+${Math.abs(diffDays)}`;
  }
  return null;
}

export interface CalendarDay {
  date: Date;
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSunday: boolean;
  isSaturday: boolean;
  isHoliday: boolean;
  holidayName?: string;
}

// Korean statutory public holidays (법정공휴일)
const KOREAN_FIXED_HOLIDAYS: Record<string, string> = {
  '01-01': '신정',
  '03-01': '3·1절',
  '05-05': '어린이날',
  '06-06': '현충일',
  '08-15': '광복절',
  '10-03': '개천절',
  '10-09': '한글날',
  '12-25': '성탄절',
};

// Variable holidays (lunar holidays, substitute holidays, elections) by YYYY-MM-DD
const KOREAN_VARIABLE_HOLIDAYS: Record<string, string> = {
  // 2024
  '2024-02-09': '설날 연휴',
  '2024-02-10': '설날',
  '2024-02-11': '설날 연휴',
  '2024-02-12': '대체공휴일',
  '2024-04-10': '제22대 국회의원선거',
  '2024-05-06': '대체공휴일',
  '2024-05-15': '부처님오신날',
  '2024-09-16': '추석 연휴',
  '2024-09-17': '추석',
  '2024-09-18': '추석 연휴',
  '2024-10-01': '국군의 날(임시)',
  // 2025
  '2025-01-28': '설날 연휴',
  '2025-01-29': '설날',
  '2025-01-30': '설날 연휴',
  '2025-03-03': '대체공휴일(3·1절)',
  '2025-05-06': '대체공휴일(부처님오신날)',
  '2025-10-05': '추석 연휴',
  '2025-10-06': '추석',
  '2025-10-07': '추석 연휴',
  '2025-10-08': '대체공휴일(추석)',
  // 2026
  '2026-02-16': '설날 연휴',
  '2026-02-17': '설날',
  '2026-02-18': '설날 연휴',
  '2026-03-02': '대체공휴일(3·1절)',
  '2026-05-24': '부처님오신날',
  '2026-05-25': '대체공휴일',
  '2026-06-03': '지방선거일',
  '2026-08-17': '대체공휴일(광복절)',
  '2026-09-24': '추석 연휴',
  '2026-09-25': '추석',
  '2026-09-26': '추석 연휴',
  '2026-10-05': '대체공휴일(개천절)',
  // 2027
  '2027-02-06': '설날 연휴',
  '2027-02-07': '설날',
  '2027-02-08': '설날 연휴',
  '2027-02-09': '대체공휴일',
  '2027-05-13': '부처님오신날',
  '2027-09-14': '추석 연휴',
  '2027-09-15': '추석',
  '2027-09-16': '추석 연휴',
};

export function getKoreanHoliday(dateStr: string): { isHoliday: boolean; name?: string } {
  if (KOREAN_VARIABLE_HOLIDAYS[dateStr]) {
    return { isHoliday: true, name: KOREAN_VARIABLE_HOLIDAYS[dateStr] };
  }
  const monthDay = dateStr.slice(5); // 'MM-DD'
  if (KOREAN_FIXED_HOLIDAYS[monthDay]) {
    return { isHoliday: true, name: KOREAN_FIXED_HOLIDAYS[monthDay] };
  }
  return { isHoliday: false };
}

export function getMonthMatrix(year: number, monthIndex: number): CalendarDay[][] {
  const todayStr = formatDateToYMD(new Date());
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);

  const days: CalendarDay[] = [];

  // Helper to build CalendarDay
  const buildDay = (d: Date, isCurrentMonth: boolean): CalendarDay => {
    const dateStr = formatDateToYMD(d);
    const holiday = getKoreanHoliday(dateStr);
    return {
      date: d,
      dateStr,
      dayNumber: d.getDate(),
      isCurrentMonth,
      isToday: dateStr === todayStr,
      isSunday: d.getDay() === 0,
      isSaturday: d.getDay() === 6,
      isHoliday: holiday.isHoliday,
      holidayName: holiday.name,
    };
  };

  // Previous month overflow
  const startDayOfWeek = firstDay.getDay(); // 0: Sun, 1: Mon, ...
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, monthIndex, -i);
    days.push(buildDay(d, false));
  }

  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const currDate = new Date(year, monthIndex, d);
    days.push(buildDay(currDate, true));
  }

  // Next month overflow to complete 35 or 42 cells
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, monthIndex + 1, i);
      days.push(buildDay(d, false));
    }
  }

  // Chunk into weeks (rows of 7)
  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

export function getWeekDays(anchorDate: Date): CalendarDay[] {
  const todayStr = formatDateToYMD(new Date());
  const dayOfWeek = anchorDate.getDay();
  const sunday = new Date(anchorDate);
  sunday.setDate(anchorDate.getDate() - dayOfWeek);

  const days: CalendarDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const dateStr = formatDateToYMD(d);
    const holiday = getKoreanHoliday(dateStr);
    days.push({
      date: d,
      dateStr,
      dayNumber: d.getDate(),
      isCurrentMonth: d.getMonth() === anchorDate.getMonth(),
      isToday: dateStr === todayStr,
      isSunday: d.getDay() === 0,
      isSaturday: d.getDay() === 6,
      isHoliday: holiday.isHoliday,
      holidayName: holiday.name,
    });
  }
  return days;
}

export function isDateInRange(targetDateStr: string, startDateStr: string, endDateStr: string): boolean {
  return targetDateStr >= startDateStr && targetDateStr <= endDateStr;
}
