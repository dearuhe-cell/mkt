import React from 'react';
import { ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';
import { CATEGORIES, TeamEvent } from '../types';
import {
  formatDateToYMD,
  formatKoreanDate,
  getWeekDays,
  isDateInRange,
  formatKoreanMonth
} from '../utils/dateUtils';

interface CalendarWeekViewProps {
  currentDate: Date;
  onChangeDate: (date: Date) => void;
  events: TeamEvent[];
  onSelectEvent: (event: TeamEvent) => void;
  onSelectTimeSlot: (dateStr: string, timeStr: string) => void;
}

export const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({
  currentDate,
  onChangeDate,
  events,
  onSelectEvent,
  onSelectTimeSlot,
}) => {
  const weekDays = getWeekDays(currentDate);

  const handlePrevWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 7);
    onChangeDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    onChangeDate(next);
  };

  const handleThisWeek = () => {
    onChangeDate(new Date());
  };

  // Hours to display (08:00 to 22:00)
  const hours = Array.from({ length: 15 }, (_, i) => i + 8);

  const startDay = weekDays[0];
  const endDay = weekDays[6];
  const weekTitle = `${startDay.dayNumber}일 ~ ${endDay.dayNumber}일 (${formatKoreanMonth(
    startDay.date.getFullYear(),
    startDay.date.getMonth() + 1
  )})`;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col flex-1">
      {/* Week Header Navigation */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-200/80 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{weekTitle}</h2>
          <button
            id="week-nav-today-btn"
            onClick={handleThisWeek}
            className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors"
          >
            이번 주
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            id="week-prev-btn"
            onClick={handlePrevWeek}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            title="이전 주"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            id="week-next-btn"
            onClick={handleNextWeek}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            title="다음 주"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Week Days Header Row */}
      <div className="grid grid-cols-8 border-b border-slate-200 text-xs font-semibold bg-slate-50 text-slate-500">
        <div className="py-2.5 px-2 text-center text-slate-400 border-r border-slate-200">
          시간
        </div>
        {weekDays.map((d, idx) => {
          const dayName = ['일', '월', '화', '수', '목', '금', '토'][idx];
          const isRedDay = d.isHoliday || d.isSunday;
          return (
            <div
              key={d.dateStr}
              className={`py-2 px-1 text-center border-r last:border-r-0 border-slate-200 ${
                d.isToday
                  ? 'bg-indigo-50/60'
                  : d.isHoliday
                  ? 'bg-rose-50/30'
                  : ''
              }`}
            >
              <div
                className={`text-[11px] font-semibold ${
                  isRedDay ? 'text-rose-600' : idx === 6 ? 'text-sky-600' : 'text-slate-500'
                }`}
              >
                {dayName}
              </div>
              <div
                className={`inline-flex items-center justify-center text-sm font-extrabold w-6 h-6 rounded-full mx-auto mt-0.5 ${
                  d.isToday
                    ? 'bg-indigo-600 text-white'
                    : isRedDay
                    ? 'text-rose-600'
                    : idx === 6
                    ? 'text-sky-600'
                    : 'text-slate-800'
                }`}
              >
                {d.dayNumber}
              </div>
              {d.isHoliday && d.holidayName && (
                <div
                  className="text-[9px] font-bold text-rose-600 truncate px-0.5 mt-0.5"
                  title={d.holidayName}
                >
                  {d.holidayName}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* All-Day Events Row */}
      <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50/40 text-xs min-h-[38px]">
        <div className="py-2 px-2 text-center text-slate-500 font-medium border-r border-slate-200 flex items-center justify-center text-[11px]">
          종일
        </div>
        {weekDays.map((d) => {
          const allDayEvents = events.filter(
            (e) => e.isAllDay && isDateInRange(d.dateStr, e.startDate, e.endDate || e.startDate)
          );
          return (
            <div
              key={`allday-${d.dateStr}`}
              className="p-1 border-r last:border-r-0 border-slate-200 space-y-1 overflow-hidden"
            >
              {allDayEvents.map((evt) => {
                const cat = CATEGORIES[evt.category] || CATEGORIES.other;
                return (
                  <div
                    key={evt.id}
                    onClick={() => onSelectEvent(evt)}
                    className={`text-[10px] px-1.5 py-0.5 rounded border truncate cursor-pointer font-medium hover:shadow-xs transition-shadow ${cat.bgClass} ${cat.textClass} ${cat.borderClass}`}
                    title={evt.title}
                  >
                    {evt.title}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Hourly Grid */}
      <div className="flex-1 overflow-y-auto max-h-[600px] divide-y divide-slate-100">
        {hours.map((hour) => {
          const hourStr = `${String(hour).padStart(2, '0')}:00`;
          return (
            <div key={hour} className="grid grid-cols-8 min-h-[56px] group">
              {/* Time Label Column */}
              <div className="p-1 text-right pr-2.5 text-[11px] text-slate-400 font-mono border-r border-slate-200 bg-slate-50/30">
                {hourStr}
              </div>

              {/* 7 Day Columns for this hour */}
              {weekDays.map((d) => {
                const hourEvents = events.filter((evt) => {
                  if (evt.isAllDay) return false;
                  if (!isDateInRange(d.dateStr, evt.startDate, evt.endDate || evt.startDate)) return false;
                  if (!evt.startTime) return false;
                  const [startH] = evt.startTime.split(':').map(Number);
                  return startH === hour;
                });

                return (
                  <div
                    key={`${d.dateStr}-${hour}`}
                    onClick={() => onSelectTimeSlot(d.dateStr, hourStr)}
                    className={`p-1 border-r last:border-r-0 border-slate-100 hover:bg-indigo-50/30 cursor-pointer transition-colors relative flex flex-col gap-1 ${
                      d.isToday ? 'bg-indigo-50/20' : ''
                    }`}
                  >
                    {hourEvents.map((evt) => {
                      const cat = CATEGORIES[evt.category] || CATEGORIES.other;
                      return (
                        <div
                          key={evt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEvent(evt);
                          }}
                          className={`p-1.5 rounded-lg border text-[11px] leading-tight cursor-pointer shadow-2xs hover:shadow-xs transition-shadow ${cat.bgClass} ${cat.borderClass} ${cat.textClass}`}
                        >
                          <div className="font-semibold truncate">{evt.title}</div>
                          <div className="text-[10px] opacity-80 flex items-center gap-1 mt-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            <span>
                              {evt.startTime} - {evt.endTime || ''}
                            </span>
                          </div>
                          {evt.creatorName && (
                            <div className="text-[9px] opacity-75 truncate mt-0.5">
                              {evt.creatorName}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
