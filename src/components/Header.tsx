import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Copy,
  Check,
  Share2,
  Users,
  Plus,
  ArrowLeftRight,
  RefreshCw,
  Clock,
  Grid3X3,
  ListFilter,
  Edit2
} from 'lucide-react';
import { CalendarViewMode, Team, UserProfile } from '../types';
import { getShareableUrl } from '../services/api';

interface HeaderProps {
  team: Team | null;
  currentUser: UserProfile;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onOpenNewEvent: () => void;
  onOpenTeamModal: () => void;
  onOpenShareModal: () => void;
  onOpenProfileModal: () => void;
  onOpenEditTeamModal: () => void;
  onUpdateTeam?: (name: string, description?: string) => Promise<void>;
  onRefresh: () => void;
  isSyncing: boolean;
  lastSyncTime: Date | null;
}

export const Header: React.FC<HeaderProps> = ({
  team,
  currentUser,
  viewMode,
  onViewModeChange,
  onOpenNewEvent,
  onOpenTeamModal,
  onOpenShareModal,
  onOpenProfileModal,
  onOpenEditTeamModal,
  onUpdateTeam,
  onRefresh,
  isSyncing,
  lastSyncTime,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditingInlineName, setIsEditingInlineName] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    if (team) {
      setEditingName(team.name);
    }
  }, [team?.name]);

  const handleStartInlineEdit = () => {
    if (!team) return;
    setEditingName(team.name);
    setIsEditingInlineName(true);
  };

  const handleSaveInlineName = async () => {
    if (!team || !onUpdateTeam) {
      setIsEditingInlineName(false);
      return;
    }
    const trimmed = editingName.trim();
    if (!trimmed) return;

    try {
      setIsSavingName(true);
      await onUpdateTeam(trimmed, team.description);
      setIsEditingInlineName(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveInlineName();
    } else if (e.key === 'Escape') {
      setIsEditingInlineName(false);
      setEditingName(team?.name || '');
    }
  };

  const handleCopyLink = async () => {
    if (!team) return;
    const url = getShareableUrl(team.code);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left: Brand & Active Team Info */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              {isEditingInlineName && team ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="px-2.5 py-1 text-sm font-bold text-slate-900 border border-indigo-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white min-w-[150px]"
                    autoFocus
                    placeholder="팀명 입력"
                  />
                  <button
                    id="header-save-team-btn"
                    onClick={handleSaveInlineName}
                    disabled={isSavingName || !editingName.trim()}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                    title="변경완료 (Enter)"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSavingName ? '저장 중...' : '변경완료'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingInlineName(false);
                      setEditingName(team.name);
                    }}
                    className="px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">
                    {team ? team.name : '팀 일정공유'}
                  </h1>
                  {team && (
                    <>
                      <button
                        id="header-edit-team-btn"
                        onClick={handleStartInlineEdit}
                        className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="팀명 수정하기"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={onOpenEditTeamModal}
                        className="text-[11px] text-slate-400 hover:text-slate-600 underline ml-0.5 cursor-pointer"
                        title="팀 상세 정보 수정"
                      >
                        상세
                      </button>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 ml-1">
                        코드: {team.code}
                      </span>
                    </>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  로그인 없는 즉시 공유
                </span>
                {lastSyncTime && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3 h-3" />
                      {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} 동기화
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Share / Copy button */}
          {team && (
            <div className="flex items-center gap-1.5 ml-1">
              <button
                id="copy-invite-link-btn"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="참여 링크 복사"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '링크 복사됨!' : '초대 링크'}</span>
              </button>

              <button
                id="open-share-modal-btn"
                onClick={onOpenShareModal}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="공유 및 QR 코드"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Center & Right Actions */}
        <div className="flex items-center justify-between md:justify-end gap-2.5 flex-wrap">
          {/* View Mode Switcher */}
          <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              id="view-month-btn"
              onClick={() => onViewModeChange('month')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'month'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>월간</span>
            </button>
            <button
              id="view-week-btn"
              onClick={() => onViewModeChange('week')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'week'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>주간</span>
            </button>
            <button
              id="view-agenda-btn"
              onClick={() => onViewModeChange('agenda')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'agenda'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>목록</span>
            </button>
          </div>

          {/* Sync Refresh Button */}
          <button
            id="refresh-sync-btn"
            onClick={onRefresh}
            disabled={isSyncing}
            className={`p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all ${
              isSyncing ? 'animate-spin text-indigo-600' : ''
            }`}
            title="새로고침"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* User Profile Pill */}
          <button
            id="edit-profile-btn"
            onClick={onOpenProfileModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-xs text-slate-700 transition-colors shadow-xs"
            title="내 닉네임 / 색상 변경"
          >
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white font-bold"
              style={{ backgroundColor: currentUser.color }}
            >
              {currentUser.name.charAt(0) || '나'}
            </span>
            <span className="max-w-[70px] truncate font-medium">{currentUser.name}</span>
          </button>

          {/* Switch/Create Team button */}
          <button
            id="switch-team-btn"
            onClick={onOpenTeamModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
            <span>팀 전환</span>
          </button>

          {/* Add Event Primary Button */}
          <button
            id="add-event-primary-btn"
            onClick={onOpenNewEvent}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-semibold shadow-xs shadow-indigo-300 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>일정 추가</span>
          </button>
        </div>
      </div>
    </header>
  );
};
