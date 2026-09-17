import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  Clock,
  MapPin,
  Video,
  CheckSquare,
  Users,
  ChevronDown,
  ChevronUp,
  Plus,
  ExternalLink
} from 'lucide-react';
import { CATEGORIES, TeamEvent } from '../types';
import {
  formatKoreanDate,
  formatDateToYMD,
  getRelativeDayLabel,
  formatTimeKorean
} from '../utils/dateUtils';

interface CalendarAgendaViewProps {
  events: TeamEvent[];
  onSelectEvent: (event: TeamEvent) => void;
  onOpenNewEvent: () => void;
}

export const CalendarAgendaView: React.FC<CalendarAgendaViewProps> = ({
  events,
  onSelectEvent,
  onOpenNewEvent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPastEvents, setShowPastEvents] = useState(false);

  const todayStr = formatDateToYMD(new Date());

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    return events
      .filter((evt) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
          evt.title.toLowerCase().includes(q) ||
          evt.description?.toLowerCase().includes(q) ||
          evt.location?.toLowerCase().includes(q) ||
          evt.creatorName?.toLowerCase().includes(q) ||
          evt.attendees?.some((a) => a.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        const dateDiff = a.startDate.localeCompare(b.startDate);
        if (dateDiff !== 0) return dateDiff;
        if (a.isAllDay && !b.isAllDay) return -1;
        if (!a.isAllDay && b.isAllDay) return 1;
        return (a.startTime || '').localeCompare(b.startTime || '');
      });
  }, [events, searchTerm]);

  // Group into categories
  const { todayEvents, upcomingEvents, pastEvents } = useMemo(() => {
    const today: TeamEvent[] = [];
    const upcoming: TeamEvent[] = [];
    const past: TeamEvent[] = [];

    filteredEvents.forEach((evt) => {
      const endD = evt.endDate || evt.startDate;
      if (endD < todayStr) {
        past.push(evt);
      } else if (evt.startDate <= todayStr && endD >= todayStr) {
        today.push(evt);
      } else {
        upcoming.push(evt);
      }
    });

    return { todayEvents: today, upcomingEvents: upcoming, pastEvents: past };
  }, [filteredEvents, todayStr]);

  const renderEventCard = (evt: TeamEvent) => {
    const cat = CATEGORIES[evt.category] || CATEGORIES.other;
    const dDay = getRelativeDayLabel(evt.startDate);
    const completedTasks = evt.checklist?.filter((c) => c.completed).length || 0;
    const totalTasks = evt.checklist?.length || 0;

    return (
      <div
        key={evt.id}
        onClick={() => onSelectEvent(evt)}
        className="bg-white border border-slate-200/90 hover:border-indigo-300 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cat.bgClass} ${cat.textClass} border ${cat.borderClass}`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: cat.dotColor }}
                ></span>
                {cat.label}
              </span>

              {dDay && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    dDay === '오늘'
                      ? 'bg-rose-100 text-rose-700'
                      : dDay === '내일'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {dDay}
                </span>
              )}

              <span className="text-xs text-slate-500 font-medium">
                {formatKoreanDate(evt.startDate)}
                {evt.endDate && evt.endDate !== evt.startDate && ` ~ ${formatKoreanDate(evt.endDate)}`}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              {evt.title}
            </h3>

            {evt.description && (
              <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                {evt.description}
              </p>
            )}

            {/* Badges / Meta row */}
            <div className="flex items-center gap-3 mt-3 flex-wrap text-xs text-slate-500">
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {evt.isAllDay ? '종일' : `${formatTimeKorean(evt.startTime)} ~ ${formatTimeKorean(evt.endTime)}`}
              </span>

              {evt.location && (
                <span className="flex items-center gap-1 max-w-[200px] truncate text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{evt.location}</span>
                </span>
              )}

              {evt.meetingLink && (
                <a
                  href={evt.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                >
                  <Video className="w-3.5 h-3.5 text-indigo-500" />
                  <span>온라인 미팅 링크</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {totalTasks > 0 && (
                <span className="flex items-center gap-1 font-medium text-slate-600">
                  <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                  체크리스트 {completedTasks}/{totalTasks}
                </span>
              )}
            </div>
          </div>

          {/* Attendees / Creator */}
          <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <div className="text-[11px] text-slate-400">등록: {evt.creatorName}</div>
            {evt.attendees && evt.attendees.length > 0 && (
              <div className="flex items-center gap-1 mt-1 flex-wrap justify-end">
                {evt.attendees.map((att, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium"
                  >
                    {att}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 flex flex-col flex-1">
      {/* Search and Filter bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="agenda-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="일정 제목, 내용, 참석자, 장소 검색..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-slate-500">
            총 <strong className="text-slate-900">{filteredEvents.length}</strong>개의 일정
          </span>
          <button
            id="agenda-add-btn"
            onClick={onOpenNewEvent}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>새 일정</span>
          </button>
        </div>
      </div>

      {/* Events Sections */}
      <div className="space-y-6 flex-1 overflow-y-auto pr-1">
        {/* Today Section */}
        {todayEvents.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <h2 className="text-sm font-bold text-slate-900">오늘의 일정 ({todayEvents.length})</h2>
            </div>
            <div className="space-y-2.5">{todayEvents.map(renderEventCard)}</div>
          </div>
        )}

        {/* Upcoming Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            <h2 className="text-sm font-bold text-slate-900">다가오는 일정 ({upcomingEvents.length})</h2>
          </div>
          {upcomingEvents.length === 0 && todayEvents.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">예정된 일정이 없습니다.</p>
              <p className="text-xs text-slate-400 mt-1 mb-3">
                팀원들과 공유할 첫 번째 일정을 등록해보세요!
              </p>
              <button
                onClick={onOpenNewEvent}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs"
              >
                + 일정 등록하기
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">{upcomingEvents.map(renderEventCard)}</div>
          )}
        </div>

        {/* Past Section */}
        {pastEvents.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => setShowPastEvents(!showPastEvents)}
              className="flex items-center justify-between w-full text-xs font-semibold text-slate-500 hover:text-slate-800 py-1"
            >
              <span>지난 일정 ({pastEvents.length}개)</span>
              {showPastEvents ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showPastEvents && (
              <div className="space-y-2.5 mt-3 opacity-75">{pastEvents.map(renderEventCard)}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
