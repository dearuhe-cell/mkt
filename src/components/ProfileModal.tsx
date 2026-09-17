import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Check,
  Plus,
  Users,
  Edit2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { Team, UserProfile } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  team: Team | null;
  onSaveProfile: (profile: UserProfile) => void;
  onAddTeamMember: (name: string, color: string) => Promise<void>;
  onUpdateTeamMember: (memberId: string, name: string, color?: string) => Promise<void>;
  onDeleteTeamMember: (memberId: string) => Promise<void>;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  team,
  onSaveProfile,
  onAddTeamMember,
  onUpdateTeamMember,
  onDeleteTeamMember,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [color, setColor] = useState(currentUser.color);

  // New member addition state
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberColor, setNewMemberColor] = useState('#10b981');
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Member editing state (for inline edit)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingMemberName, setEditingMemberName] = useState('');
  const [editingMemberColor, setEditingMemberColor] = useState('');
  const [isSavingMember, setIsSavingMember] = useState(false);

  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const colors = [
    '#6366f1',
    '#0ea5e9',
    '#10b981',
    '#f59e0b',
    '#ec4899',
    '#8b5cf6',
    '#ef4444',
    '#14b8a6',
    '#3b82f6',
    '#f97316',
  ];

  useEffect(() => {
    setName(currentUser.name);
    setColor(currentUser.color);
    setEditingMemberId(null);
    setMsg(null);
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSaveProfile({
      id: currentUser.id,
      name: name.trim(),
      color,
    });
    // also update in current team if present
    if (team) {
      const existing = team.members.find(
        (m) => m.name.toLowerCase() === currentUser.name.toLowerCase()
      );
      if (existing) {
        onUpdateTeamMember(existing.id, name.trim(), color);
      } else {
        onAddTeamMember(name.trim(), color);
      }
    }
    showNotification('내 프로필이 저장되었습니다.');
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    try {
      setIsAddingMember(true);
      await onAddTeamMember(newMemberName.trim(), newMemberColor);
      setNewMemberName('');
      showNotification(`'${newMemberName.trim()}' 팀원이 등록되었습니다.`);
    } catch (err: any) {
      showNotification(err.message || '팀원 추가 실패', 'error');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleStartEditMember = (member: { id: string; name: string; color: string }) => {
    setEditingMemberId(member.id);
    setEditingMemberName(member.name);
    setEditingMemberColor(member.color || '#6366f1');
  };

  const handleSaveMemberEdit = async (memberId: string) => {
    if (!editingMemberName.trim()) {
      showNotification('팀원 이름을 입력해주세요.', 'error');
      return;
    }
    try {
      setIsSavingMember(true);
      await onUpdateTeamMember(memberId, editingMemberName.trim(), editingMemberColor);
      setEditingMemberId(null);
      showNotification('팀원 정보가 수정되었습니다.');
    } catch (err: any) {
      showNotification(err.message || '팀원 정보 수정 실패', 'error');
    } finally {
      setIsSavingMember(false);
    }
  };

  const handleDeleteMember = async (member: { id: string; name: string }) => {
    if (
      window.confirm(
        `'${member.name}' 팀원을 정말 삭제하시겠습니까?\n일정의 참석자 목록에서도 제외됩니다.`
      )
    ) {
      try {
        await onDeleteTeamMember(member.id);
        showNotification(`'${member.name}' 팀원이 삭제되었습니다.`);
      } catch (err: any) {
        showNotification(err.message || '팀원 삭제 실패', 'error');
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">내 프로필 & 팀원 관리</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Notification Message */}
          {msg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                msg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border border-rose-200 text-rose-700'
              }`}
            >
              {msg.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{msg.text}</span>
            </div>
          )}

          {/* My Profile Section */}
          <form onSubmit={handleSaveProfile} className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>내 닉네임 설정 (현재 브라우저 사용자)</span>
            </h4>
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="일정 등록 및 참석 시 표시될 내 이름 (예: 김민수)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block mb-1.5">내 대표 색상</span>
              <div className="flex items-center gap-2 flex-wrap">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-transform ${
                      color === c ? 'scale-120 border-slate-900 shadow-2xs' : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              내 프로필 저장
            </button>
          </form>

          {/* Team Member Management (Roster) */}
          {team && (
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>팀원 목록 및 관리 ({team.members.length}명)</span>
                </h4>
              </div>

              {/* Add New Member */}
              <form onSubmit={handleAddMember} className="space-y-2 bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100">
                <span className="text-[11px] font-semibold text-indigo-900 block">
                  새 팀원 추가 등록
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="팀원 이름 입력 (예: 박준영, 이지혜)"
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={newMemberColor}
                      onChange={(e) => setNewMemberColor(e.target.value)}
                      className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0.5 bg-white"
                      title="색상 선택"
                    />
                    <button
                      type="submit"
                      disabled={isAddingMember || !newMemberName.trim()}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>추가</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Existing Members Roster with Edit & Delete */}
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 divide-y divide-slate-100">
                {team.members.map((m) => {
                  const isEditing = editingMemberId === m.id;

                  if (isEditing) {
                    return (
                      <div
                        key={m.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-indigo-200 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingMemberName}
                            onChange={(e) => setEditingMemberName(e.target.value)}
                            className="flex-1 px-2.5 py-1 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:border-indigo-500 font-medium"
                            placeholder="팀원 이름"
                            autoFocus
                          />
                          <input
                            type="color"
                            value={editingMemberColor}
                            onChange={(e) => setEditingMemberColor(e.target.value)}
                            className="w-6 h-6 rounded border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                            title="색상 변경"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingMemberId(null)}
                            className="px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-200 rounded-md transition-colors"
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveMemberEdit(m.id)}
                            disabled={isSavingMember}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
                          >
                            저장
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between py-2 px-2.5 hover:bg-slate-50 rounded-lg group transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: m.color || '#6366f1' }}
                        />
                        <span className="text-xs font-semibold text-slate-800 truncate">
                          {m.name}
                        </span>
                        {m.name === currentUser.name && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                            나
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => handleStartEditMember(m)}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="팀원명 및 색상 수정"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMember(m)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="팀원 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
