import React from 'react';
import {
  Users,
  Calendar,
  Download,
  Filter,
  Check,
  Tag,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  Edit2
} from 'lucide-react';
import { CATEGORIES, EventCategory, Team, TeamEvent } from '../types';

interface SidebarFiltersProps {
  team: Team;
  events: TeamEvent[];
  selectedMember: string | null;
  onSelectMember: (name: string | null) => void;
  selectedCategories: EventCategory[];
  onToggleCategory: (cat: EventCategory) => void;
  onSelectAllCategories: () => void;
  onOpenNewEvent: () => void;
  onOpenShareModal: () => void;
  onOpenAddMemberModal: () => void;
  onOpenEditTeamModal: () => void;
  onUpdateTeam?: (name: string, description?: string) => Promise<void>;
}

export const SidebarFilters: React.FC<SidebarFiltersProps> = ({
  team,
  events,
  selectedMember,
  onSelectMember,
  selectedCategories,
  onToggleCategory,
  onSelectAllCategories,
  onOpenNewEvent,
  onOpenShareModal,
  onOpenAddMemberModal,
  onOpenEditTeamModal,
  onUpdateTeam,
}) => {
  const [isEditingTeamName, setIsEditingTeamName] = React.useState(false);
  const [teamNameInput, setTeamNameInput] = React.useState(team.name);
  const [isSavingTeamName, setIsSavingTeamName] = React.useState(false);

  React.useEffect(() => {
    setTeamNameInput(team.name);
  }, [team.name]);

  const handleSaveTeamName = async () => {
    if (!onUpdateTeam) return;
    const trimmed = teamNameInput.trim();
    if (!trimmed) return;
    try {
      setIsSavingTeamName(true);
      await onUpdateTeam(trimmed, team.description);
      setIsEditingTeamName(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingTeamName(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTeamName();
    } else if (e.key === 'Escape') {
      setIsEditingTeamName(false);
      setTeamNameInput(team.name);
    }
  };
  // Count events per member
  const memberCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((evt) => {
      if (evt.creatorName) {
        counts[evt.creatorName] = (counts[evt.creatorName] || 0) + 1;
      }
      evt.attendees?.forEach((att) => {
        if (att !== evt.creatorName) {
          counts[att] = (counts[att] || 0) + 1;
        }
      });
    });
    return counts;
  }, [events]);

  // Count events per category
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((evt) => {
      counts[evt.category] = (counts[evt.category] || 0) + 1;
    });
    return counts;
  }, [events]);

  const allCategoriesKeys = Object.keys(CATEGORIES) as EventCategory[];
  const isAllCategoriesSelected = selectedCategories.length === allCategoriesKeys.length;

  const handleDownloadIcs = () => {
    window.location.href = `/api/teams/${encodeURIComponent(team.code)}/export.ics`;
  };

  return (
    <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-4">
      {/* Team Info Card */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">공유 공간</span>
          <button
            id="sidebar-share-badge-btn"
            onClick={onOpenShareModal}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
          >
            초대하기
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
        {isEditingTeamName ? (
          <div className="space-y-1.5 my-1 bg-indigo-50/60 p-2 rounded-xl border border-indigo-200">
            <input
              type="text"
              value={teamNameInput}
              onChange={(e) => setTeamNameInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-2.5 py-1 text-xs font-bold text-slate-900 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
              autoFocus
              placeholder="팀 이름"
            />
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsEditingTeamName(false);
                  setTeamNameInput(team.name);
                }}
                className="px-2 py-0.5 text-[11px] text-slate-500 hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                id="sidebar-save-team-btn"
                onClick={handleSaveTeamName}
                disabled={isSavingTeamName || !teamNameInput.trim()}
                className="px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[11px] font-bold rounded-md shadow-2xs flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                title="변경완료 (Enter)"
              >
                <Check className="w-3 h-3" />
                <span>{isSavingTeamName ? '저장 중...' : '변경완료'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-1">
            <h2
              className="text-base font-bold text-slate-900 leading-snug truncate cursor-pointer hover:text-indigo-600 transition-colors"
              onClick={() => setIsEditingTeamName(true)}
              title="클릭하여 팀명 수정"
            >
              {team.name}
            </h2>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                id="sidebar-edit-team-inline-btn"
                onClick={() => setIsEditingTeamName(true)}
                className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="팀명 수정"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                id="sidebar-edit-team-modal-btn"
                onClick={onOpenEditTeamModal}
                className="text-[10px] text-slate-400 hover:text-slate-600 underline px-1 cursor-pointer"
                title="팀 상세 정보 수정"
              >
                상세
              </button>
            </div>
          </div>
        )}
        {team.description && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{team.description}</p>
        )}

        <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
          <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
            <span className="text-[11px] text-slate-500 block">등록된 일정</span>
            <span className="text-base font-bold text-slate-900">{events.length}개</span>
          </div>
          <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
            <span className="text-[11px] text-slate-500 block">팀 멤버</span>
            <span className="text-base font-bold text-slate-900">{team.members.length}명</span>
          </div>
        </div>
      </div>

      {/* Member Filter Section */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>팀원별 일정 필터</span>
          </div>
          <button
            id="add-member-trigger-btn"
            onClick={onOpenAddMemberModal}
            className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            + 팀원 등록
          </button>
        </div>

        <div className="space-y-1">
          <button
            id="filter-member-all"
            onClick={() => onSelectMember(null)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedMember === null
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
              모든 팀원 일정
            </span>
            <span className="text-[11px] text-slate-400">{events.length}</span>
          </button>

          {team.members.map((member) => {
            const isSelected = selectedMember === member.name;
            const count = memberCounts[member.name] || 0;
            return (
              <button
                key={member.id}
                id={`filter-member-${member.id}`}
                onClick={() => onSelectMember(isSelected ? null : member.name)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                  isSelected
                    ? 'bg-indigo-50 text-indigo-900 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: member.color || '#6366f1' }}
                  ></span>
                  <span className="truncate">{member.name}</span>
                </span>
                <span className="text-[11px] text-slate-400 shrink-0 ml-1">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Filter Section */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Tag className="w-3.5 h-3.5 text-indigo-600" />
            <span>일정 카테고리</span>
          </div>
          <button
            id="select-all-cat-btn"
            onClick={onSelectAllCategories}
            className="text-[11px] font-medium text-slate-500 hover:text-slate-800"
          >
            {isAllCategoriesSelected ? '전체 해제' : '전체 선택'}
          </button>
        </div>

        <div className="space-y-1">
          {allCategoriesKeys.map((catKey) => {
            const cat = CATEGORIES[catKey];
            const isChecked = selectedCategories.includes(catKey);
            const count = categoryCounts[catKey] || 0;
            return (
              <button
                key={catKey}
                id={`category-filter-${catKey}`}
                onClick={() => onToggleCategory(catKey)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                  isChecked
                    ? 'bg-slate-100 text-slate-900 font-medium'
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: cat.dotColor }}
                  ></div>
                  <span>{cat.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">{count}</span>
                  {isChecked && <Check className="w-3 h-3 text-indigo-600" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Export & Info Card */}
      <div className="bg-slate-100/80 border border-slate-200/80 rounded-xl p-3.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 mb-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>캘린더 내보내기</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed mb-2.5">
          팀 일정을 애플 캘린더나 구글 캘린더에 동기화할 수 있는 .ics 파일로 다운로드합니다.
        </p>
        <button
          id="export-ics-btn"
          onClick={handleDownloadIcs}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-2xs transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>iCal (.ics) 파일 다운로드</span>
        </button>
      </div>
    </aside>
  );
};
