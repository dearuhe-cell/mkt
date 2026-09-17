import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Video,
  CheckCircle2,
  Users
} from 'lucide-react';
import { CATEGORIES, TeamEvent } from '../types';
import {
  formatKoreanMonth,
  formatDateToYMD,
  getMonthMatrix,
  isDateInRange,
  formatTimeKorean
} from '../utils/dateUtils';

interface CalendarMonthViewProps {
  currentDate: Date;
  onChangeMonth: (date: Date) => void;
  events: TeamEvent[];
  onSelectEvent: (event: TeamEvent) => void;
  onSelectDate: (dateStr: string) => void;
}

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  currentDate,
  onChangeMonth,
  events,
  onSelectEvent,
  onSelectDate,
}) => {
  const [activeDayPopup, setActiveDayPopup] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    onChangeMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    onChangeMonth(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    onChangeMonth(new Date());
  };

  const monthWeeks = getMonthMatrix(year, month);
  const weekDaysHeader = ['일', '월', '화', '수', '목', '금', '토'];

  // Map events to date strings
  const getEventsForDay = (dateStr: string): TeamEvent[] => {
    return events.filter((evt) => {
      const endD = evt.endDate || evt.startDate;
      return isDateInRange(dateStr, evt.startDate, endD);
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col flex-1">
      {/* Month Navigation Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-200/80 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {formatKoreanMonth(year, month + 1)}
          </h2>
          <button
            id="month-nav-today-btn"
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors"
          >
            오늘
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            id="month-prev-btn"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            title="이전 달"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            id="month-next-btn"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            title="다음 달"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 border-b border-slate-200 text-center text-xs font-semibold py-2 bg-slate-50 text-slate-500">
        {weekDaysHeader.map((d, idx) => (
          <div
            key={d}
            className={idx === 0 ? 'text-rose-600' : idx === 6 ? 'text-sky-600' : ''}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-slate-200 gap-px">
        {monthWeeks.flat().map((day) => {
          const dayEvents = getEventsForDay(day.dateStr);
          const maxVisible = 3;
          const visibleEvents = dayEvents.slice(0, maxVisible);
          const hiddenCount = dayEvents.length - maxVisible;

          return (
            <div
              key={day.dateStr}
              onClick={() => onSelectDate(day.dateStr)}
              className={`min-h-[110px] lg:min-h-[125px] p-1.5 sm:p-2 flex flex-col justify-between transition-colors cursor-pointer group ${
                day.isCurrentMonth ? 'bg-white' : 'bg-slate-50/70 text-slate-400'
              } hover:bg-indigo-50/30`}
            >
              {/* Day Number and Badges */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`inline-flex items-center justify-center text-xs font-bold w-6 h-6 rounded-full transition-colors ${
                    day.isToday
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : day.isSunday
                      ? 'text-rose-600 group-hover:text-rose-700'
                      : day.isSaturday
                      ? 'text-sky-600 group-hover:text-sky-700'
                      : day.isCurrentMonth
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  {day.dayNumber}
                </span>

                {/* Quick Add icon on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDate(day.dateStr);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                  title="이 날에 일정 추가"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Day Events Stack */}
              <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                {visibleEvents.map((evt) => {
                  const cat = CATEGORIES[evt.category] || CATEGORIES.other;
                  return (
                    <div
                      key={evt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(evt);
                      }}
                      className={`text-[11px] leading-tight px-1.5 py-1 rounded-md border truncate font-medium flex items-center gap-1 transition-transform hover:scale-[1.01] hover:shadow-xs ${cat.bgClass} ${cat.textClass} ${cat.borderClass}`}
                      title={`${evt.title} (${evt.isAllDay ? '종일' : evt.startTime || ''}) - 작성자: ${evt.creatorName}`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.dotColor }}
                      ></span>

                      {!evt.isAllDay && evt.startTime && (
                        <span className="text-[10px] opacity-80 shrink-0">
                          {evt.startTime}
                        </span>
                      )}

                      <span className="truncate flex-1">{evt.title}</span>

                      {evt.creatorName && (
                        <span className="text-[9px] opacity-75 shrink-0 hidden sm:inline">
                          {evt.creatorName.slice(0, 2)}
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* More events indicator */}
                {hiddenCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDayPopup(day.dateStr);
                    }}
                    className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 text-left px-1 mt-0.5"
                  >
                    +{hiddenCount}개 더보기
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Overflow Popup Modal */}
      {activeDayPopup && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveDayPopup(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">
                {activeDayPopup} 일정 ({getEventsForDay(activeDayPopup).length}개)
              </h3>
              <button
                onClick={() => setActiveDayPopup(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 p-1"
              >
                닫기
              </button>
            </div>

            <div className="py-2 space-y-2 overflow-y-auto flex-1">
              {getEventsForDay(activeDayPopup).map((evt) => {
                const cat = CATEGORIES[evt.category] || CATEGORIES.other;
                return (
                  <div
                    key={evt.id}
                    onClick={() => {
                      setActiveDayPopup(null);
                      onSelectEvent(evt);
                    }}
                    className={`p-2 rounded-lg border cursor-pointer hover:shadow-xs transition-shadow ${cat.bgClass} ${cat.borderClass}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${cat.textClass}`}>{evt.title}</span>
                      <span className="text-[10px] text-slate-500">
                        {evt.isAllDay ? '종일' : `${evt.startTime || ''} - ${evt.endTime || ''}`}
                      </span>
                    </div>
                    {evt.description && (
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">{evt.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                      <span>작성자: {evt.creatorName}</span>
                      {evt.attendees && evt.attendees.length > 0 && (
                        <span>참석: {evt.attendees.join(', ')}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => {
                  const targetDate = activeDayPopup;
                  setActiveDayPopup(null);
                  onSelectDate(targetDate);
                }}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>이 날에 새 일정 추가</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
