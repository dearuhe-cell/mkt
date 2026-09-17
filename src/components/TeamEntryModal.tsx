import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Plus,
  LogIn,
  KeyRound,
  History,
  AlertCircle,
  ArrowRight,
  Shield,
  Sparkles
} from 'lucide-react';
import { UserProfile } from '../types';
import { getVisitedTeams, VisitedTeam } from '../services/api';

interface TeamEntryModalProps {
  isOpen: boolean;
  onClose?: () => void;
  canClose?: boolean;
  currentUser: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onJoinTeam: (code: string, pin?: string, memberName?: string, memberColor?: string) => Promise<void>;
  onCreateTeam: (name: string, code?: string, pin?: string, creatorName?: string, creatorColor?: string) => Promise<void>;
}

export const TeamEntryModal: React.FC<TeamEntryModalProps> = ({
  isOpen,
  onClose,
  canClose = true,
  currentUser,
  onSaveProfile,
  onJoinTeam,
  onCreateTeam,
}) => {
  const [tab, setTab] = useState<'join' | 'create'>('join');
  const [joinCode, setJoinCode] = useState('');
  const [joinPin, setJoinPin] = useState('');
  const [teamName, setTeamName] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [createPin, setCreatePin] = useState('');
  const [userName, setUserName] = useState(currentUser.name || '');
  const [userColor, setUserColor] = useState(currentUser.color || '#6366f1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [recentTeams, setRecentTeams] = useState<VisitedTeam[]>([]);

  const colorPalette = [
    '#6366f1', // Indigo
    '#0ea5e9', // Sky
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#8b5cf6', // Violet
    '#ef4444', // Red
    '#14b8a6', // Teal
  ];

  useEffect(() => {
    if (isOpen) {
      setRecentTeams(getVisitedTeams());
      setUserName(currentUser.name || '팀원');
      setUserColor(currentUser.color || '#6366f1');
      setErrorMsg('');
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setErrorMsg('팀 코드를 입력해주세요.');
      return;
    }
    if (!userName.trim()) {
      setErrorMsg('참여할 닉네임을 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      onSaveProfile({ id: currentUser.id, name: userName.trim(), color: userColor });
      await onJoinTeam(joinCode.trim(), joinPin.trim() || undefined, userName.trim(), userColor);
      if (onClose) onClose();
    } catch (err: any) {
      setErrorMsg(err.message || '팀 참여에 실패했습니다. 코드를 확인해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setErrorMsg('팀 이름을 입력해주세요.');
      return;
    }
    if (!userName.trim()) {
      setErrorMsg('등록할 내 이름을 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      onSaveProfile({ id: currentUser.id, name: userName.trim(), color: userColor });
      await onCreateTeam(
        teamName.trim(),
        customCode.trim() || undefined,
        createPin.trim() || undefined,
        userName.trim(),
        userColor
      );
      if (onClose) onClose();
    } catch (err: any) {
      setErrorMsg(err.message || '팀 생성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectRecent = async (team: VisitedTeam) => {
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onJoinTeam(team.code, undefined, userName || currentUser.name, userColor);
      if (onClose) onClose();
    } catch (err: any) {
      // maybe needs pin
      setTab('join');
      setJoinCode(team.code);
      setErrorMsg(err.message || '팀 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 className="font-bold text-slate-900 text-base">로그인 없는 팀 일정공유</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              별도의 회원가입 없이 링크와 코드로 즉시 함께합니다.
            </p>
          </div>
          {canClose && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tab switchers */}
        <div className="grid grid-cols-2 p-1.5 mx-6 mt-5 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setTab('join');
              setErrorMsg('');
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'join'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>팀 코드로 참여</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('create');
              setErrorMsg('');
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'create'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>새 팀 만들기</span>
          </button>
        </div>

        {/* Form Container */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Profile setup: Name & Color */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
            <span className="text-xs font-semibold text-slate-800 block">
              내 프로필 (일정 등록 및 참석자 표시)
            </span>
            <div>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="내 이름 또는 닉네임 입력 (예: 민수, 팀장 등)"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block mb-1.5">내 대표 색상</span>
              <div className="flex items-center gap-2 flex-wrap">
                {colorPalette.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setUserColor(col)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      userColor === col ? 'scale-125 border-slate-900 shadow-xs' : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </div>
          </div>

          {tab === 'join' ? (
            /* Join Tab */
            <form onSubmit={handleJoinSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  팀 코드 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="예: DEMO 또는 ABC-1234"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono tracking-wider font-semibold uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>비밀번호 / PIN (설정된 경우만)</span>
                  <span className="text-[10px] text-slate-400">선택</span>
                </label>
                <input
                  type="password"
                  value={joinPin}
                  onChange={(e) => setJoinPin(e.target.value)}
                  placeholder="비밀번호가 있는 경우 입력"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>{isSubmitting ? '팀 입장 중...' : '팀 캘린더 입장하기'}</span>
              </button>
            </form>
          ) : (
            /* Create Tab */
            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  팀 / 모임 이름 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="예: 디자인팀, 신규 프로젝트 TF, 독서 모임"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>팀 코드 직접 지정</span>
                  <span className="text-[10px] text-slate-400">비워두면 자동 생성</span>
                </label>
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  placeholder="예: MARKETING-2026 (선택사항)"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>팀 보안 PIN (선택)</span>
                  <span className="text-[10px] text-slate-400">비워두면 자유 공개</span>
                </label>
                <input
                  type="password"
                  value={createPin}
                  onChange={(e) => setCreatePin(e.target.value)}
                  placeholder="접근 제한이 필요할 때만 입력"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? '팀 생성 중...' : '새 팀 생성하고 바로 시작하기'}</span>
              </button>
            </form>
          )}

          {/* Recent Teams List */}
          {recentTeams.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
                <History className="w-3.5 h-3.5" />
                <span>최근 방문한 팀</span>
              </div>
              <div className="space-y-1.5">
                {recentTeams.map((rt) => (
                  <button
                    key={rt.code}
                    type="button"
                    onClick={() => handleSelectRecent(rt)}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 text-xs text-left group transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 group-hover:text-indigo-700">
                        {rt.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">코드: {rt.code}</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
