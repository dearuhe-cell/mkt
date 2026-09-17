/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  Users,
  Plus,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Target,
  ArrowRight,
  Flame,
  Bell,
  Search
} from 'lucide-react';
import { Team, TeamEvent, UserProfile, EventCategory } from '../types';
import { formatDateToYMD } from '../utils/dateUtils';
import { getShareableUrl } from '../services/api';

interface InteractiveHeroSectionProps {
  team: Team;
  currentUser: UserProfile;
  events: TeamEvent[];
  selectedMember: string | null;
  onSelectMember: (name: string | null) => void;
  onOpenNewEvent: (dateStr?: string) => void;
  onOpenShareModal: () => void;
  onSelectEvent: (event: TeamEvent) => void;
  onJumpToToday: () => void;
  onUpdateTeamNotice?: (notice: string) => Promise<void>;
}

export const InteractiveHeroSection: React.FC<InteractiveHeroSectionProps> = ({
  team,
  currentUser,
  events,
  selectedMember,
  onSelectMember,
  onOpenNewEvent,
  onOpenShareModal,
  onSelectEvent,
  onJumpToToday,
  onUpdateTeamNotice,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isEditingNotice, setIsEditingNotice] = useState(false);
  const [noticeText, setNoticeText] = useState(team.description || '');
  const [isSavingNotice, setIsSavingNotice] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'my'>('all');

  const todayStr = useMemo(() => formatDateToYMD(new Date()), []);

  useEffect(() => {
    setNoticeText(team.description || '');
  }, [team.description]);

  // Today's events
  const todayEvents = useMemo(() => {
    return events.filter((e) => {
      if (e.endDate) {
        return todayStr >= e.startDate && todayStr <= e.endDate;
      }
      return e.startDate === todayStr;
    });
  }, [events, todayStr]);

  // My upcoming/participating events
  const myEvents = useMemo(() => {
    return events.filter(
      (e) => e.creatorName === currentUser.name || e.attendees?.includes(currentUser.name)
    );
  }, [events, currentUser.name]);

  // Find next upcoming event today
  const nextEvent = useMemo(() => {
    const now = new Date();
    const currentHours = now.getHours().toString().padStart(2, '0');
    const currentMins = now.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMins}`;

    // Filter today's events with a start time later than now
    const upcomingToday = todayEvents
      .filter((e) => e.startTime && e.startTime >= currentTimeStr)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

    if (upcomingToday.length > 0) return upcomingToday[0];

    // Otherwise next future event
    const futureEvents = events
      .filter((e) => e.startDate > todayStr)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));

    return futureEvents[0] || null;
  }, [todayEvents, events, todayStr]);

  // Calculate dynamic greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 6) return '고요한 새벽입니다';
    if (hour < 12) return '상쾌하고 활기찬 아침입니다';
    if (hour < 18) return '집중하기 좋은 오후입니다';
    return '오늘 하루도 수고 많으셨습니다';
  }, []);

  const handleCopyLink = async () => {
    try {
      const url = getShareableUrl(team.code);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onOpenShareModal();
    }
  };

  const handleSaveNotice = async () => {
    if (!onUpdateTeamNotice) {
      setIsEditingNotice(false);
      return;
    }
    try {
      setIsSavingNotice(true);
      await onUpdateTeamNotice(noticeText.trim());
      setIsEditingNotice(false);
    } catch (err) {
      console.error('Failed to update notice', err);
    } finally {
      setIsSavingNotice(false);
    }
  };

  return (
    <div className="mb-6 bg-[#edf4fe] text-slate-900 rounded-2xl shadow-sm border border-blue-200/80 overflow-hidden transition-all duration-300">
      {/* Top Banner Row */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-blue-200/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Sparkles className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
                {greeting}, {currentUser.name}님!
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white text-blue-800 border border-blue-200 font-semibold shadow-2xs">
                {team.name}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
              <span>오늘 예정된 팀 일정</span>
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-black bg-blue-600 text-white shadow-2xs">
                {todayEvents.length}개
              </span>
            </h2>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5">
            <button
              id="hero-quick-add-btn"
              onClick={() => onOpenNewEvent(todayStr)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>일정 등록</span>
            </button>
            <button
              id="hero-copy-link-btn"
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-white hover:bg-blue-50 active:scale-95 text-slate-700 rounded-xl text-xs font-semibold border border-blue-200 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="팀 초대 링크 복사"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">복사됨!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>초대 링크</span>
                </>
              )}
            </button>
          </div>

          <button
            id="hero-toggle-expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-blue-100 transition-colors cursor-pointer"
            title={isExpanded ? '패널 접기' : '패널 펼치기'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Interactive Widgets */}
      {isExpanded && (
        <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#e5effd]/60 border-t border-blue-200/40">
          {/* Card 1: Next upcoming event alert */}
          <div className="bg-white border border-blue-200/70 rounded-xl p-3.5 flex flex-col justify-between shadow-2xs hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>다음 다가오는 일정</span>
              </span>
              <button
                onClick={onJumpToToday}
                className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
              >
                오늘로 이동
              </button>
            </div>

            {nextEvent ? (
              <div
                onClick={() => onSelectEvent(nextEvent)}
                className="cursor-pointer group p-2.5 rounded-lg bg-blue-50/70 hover:bg-blue-100/70 border border-blue-100 transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                    {nextEvent.title}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-blue-600 transition-all shrink-0" />
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-600">
                  <span className="font-mono font-semibold text-blue-700">
                    {nextEvent.startDate === todayStr ? '오늘' : nextEvent.startDate}{' '}
                    {nextEvent.startTime || '종일'}
                  </span>
                  {nextEvent.creatorName && (
                    <span className="text-slate-500 truncate">• {nextEvent.creatorName}</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-3 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-100">
                예정된 다음 일정이 없습니다.
              </div>
            )}

            {/* Interactive Today / My Events filter pills */}
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => {
                  onJumpToToday();
                  onSelectMember(null);
                }}
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <CalendarIcon className="w-3 h-3 text-blue-600" />
                <span>오늘 일정 모아보기</span>
              </button>
              <button
                onClick={() => onSelectMember(currentUser.name)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                  selectedMember === currentUser.name
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Users className="w-3 h-3 text-emerald-600" />
                <span>내 일정만 보기 ({myEvents.length})</span>
              </button>
            </div>
          </div>

          {/* Card 2: Interactive Team Notice / Focus Goal */}
          <div className="bg-white border border-blue-200/70 rounded-xl p-3.5 flex flex-col justify-between shadow-2xs hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-amber-600" />
                <span>오늘의 팀 한마디 / 목표</span>
              </span>
              {!isEditingNotice && (
                <button
                  onClick={() => setIsEditingNotice(true)}
                  className="text-[10px] text-amber-600 hover:text-amber-800 font-semibold underline cursor-pointer"
                >
                  수정
                </button>
              )}
            </div>

            {isEditingNotice ? (
              <div className="space-y-2">
                <textarea
                  rows={2}
                  value={noticeText}
                  onChange={(e) => setNoticeText(e.target.value)}
                  placeholder="팀원들에게 전할 오늘의 공지나 목표를 입력하세요..."
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white border border-amber-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 leading-relaxed"
                  autoFocus
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setNoticeText(team.description || '');
                      setIsEditingNotice(false);
                    }}
                    className="px-2 py-0.5 text-[10px] rounded text-slate-500 hover:bg-slate-100 cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNotice}
                    disabled={isSavingNotice}
                    className="px-2.5 py-0.5 text-[10px] font-bold rounded bg-amber-500 hover:bg-amber-600 text-white shadow-2xs disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingNotice ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingNotice(true)}
                className="p-2.5 rounded-lg bg-amber-50/60 hover:bg-amber-50 border border-amber-200/60 cursor-pointer text-xs text-slate-800 leading-relaxed min-h-[48px] flex items-center"
                title="클릭하여 목표 수정"
              >
                {team.description ? (
                  <p className="line-clamp-2 italic text-slate-800 font-medium">“{team.description}”</p>
                ) : (
                  <span className="text-slate-400 text-[11px] italic">
                    클릭하여 오늘의 팀 공지나 목표를 등록해보세요 ✨
                  </span>
                )}
              </div>
            )}

            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1 font-medium">
                <Flame className="w-3 h-3 text-orange-500" />
                <span>팀 멤버 {team.members.length}명 참여 중</span>
              </span>
              <span className="font-mono font-semibold text-slate-600">코드: {team.code}</span>
            </div>
          </div>

          {/* Card 3: Interactive Member Presence & Quick Filter Avatars */}
          <div className="bg-white border border-blue-200/70 rounded-xl p-3.5 flex flex-col justify-between shadow-2xs hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>팀원 빠른 필터링</span>
              </span>
              {selectedMember && (
                <button
                  onClick={() => onSelectMember(null)}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
                >
                  필터 해제
                </button>
              )}
            </div>

            {/* Clickable Avatars */}
            <div className="flex items-center gap-1.5 flex-wrap py-1 max-h-[72px] overflow-y-auto">
              <button
                onClick={() => onSelectMember(null)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  selectedMember === null
                    ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>전체</span>
                <span className="text-[10px] opacity-75 font-mono">{events.length}</span>
              </button>

              {team.members.map((m) => {
                const isSelected = selectedMember === m.name;
                const count = events.filter(
                  (e) => e.creatorName === m.name || e.attendees?.includes(m.name)
                ).length;

                return (
                  <button
                    key={m.id}
                    onClick={() => onSelectMember(isSelected ? null : m.name)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white shadow-2xs font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                    title={`${m.name}의 일정 ${count}개`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: m.color || '#3b82f6' }}
                    />
                    <span className="truncate max-w-[70px]">{m.name}</span>
                    <span className="text-[10px] opacity-75 font-mono">{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>아바타를 클릭하면 해당 팀원의 일정만 모아봅니다.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
