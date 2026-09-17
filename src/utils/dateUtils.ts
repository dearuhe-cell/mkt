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
}

export function getMonthMatrix(year: number, monthIndex: number): CalendarDay[][] {
  const todayStr = formatDateToYMD(new Date());
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);

  const days: CalendarDay[] = [];

  // Previous month overflow
  const startDayOfWeek = firstDay.getDay(); // 0: Sun, 1: Mon, ...
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, monthIndex, -i);
    const dateStr = formatDateToYMD(d);
    days.push({
      date: d,
      dateStr,
      dayNumber: d.getDate(),
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isSunday: d.getDay() === 0,
      isSaturday: d.getDay() === 6,
    });
  }

  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const currDate = new Date(year, monthIndex, d);
    const dateStr = formatDateToYMD(currDate);
    days.push({
      date: currDate,
      dateStr,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      isSunday: currDate.getDay() === 0,
      isSaturday: currDate.getDay() === 6,
    });
  }

  // Next month overflow to complete 35 or 42 cells
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, monthIndex + 1, i);
      const dateStr = formatDateToYMD(d);
      days.push({
        date: d,
        dateStr,
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSunday: d.getDay() === 0,
        isSaturday: d.getDay() === 6,
      });
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
    days.push({
      date: d,
      dateStr,
      dayNumber: d.getDate(),
      isCurrentMonth: d.getMonth() === anchorDate.getMonth(),
      isToday: dateStr === todayStr,
      isSunday: d.getDay() === 0,
      isSaturday: d.getDay() === 6,
    });
  }
  return days;
}

export function isDateInRange(targetDateStr: string, startDateStr: string, endDateStr: string): boolean {
  return targetDateStr >= startDateStr && targetDateStr <= endDateStr;
}
