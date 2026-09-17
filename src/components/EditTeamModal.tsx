import React, { useState, useEffect } from 'react';
import { X, Edit3, AlertCircle, Check } from 'lucide-react';
import { Team } from '../types';

interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  onUpdateTeam: (name: string, description?: string) => Promise<void>;
}

export const EditTeamModal: React.FC<EditTeamModalProps> = ({
  isOpen,
  onClose,
  team,
  onUpdateTeam,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (team) {
      setName(team.name || '');
      setDescription(team.description || '');
      setErrorMsg('');
    }
  }, [team, isOpen]);

  if (!isOpen || !team) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('팀 이름을 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onUpdateTeam(name.trim(), description.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || '팀명 변경에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">팀명 및 정보 변경</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              팀 이름 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 마케팅 기획팀, 프로젝트 A"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              팀 설명 (선택)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="팀의 목적이나 공지사항 등을 자유롭게 작성해주세요."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
            <span className="font-semibold text-slate-700 block mb-0.5">참고</span>
            팀명을 변경해도 팀 코드(<span className="font-mono font-bold text-indigo-700">{team.code}</span>)와 초대 링크는 그대로 유지되어 팀원들이 계속 접속할 수 있습니다.
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              id="edit-team-submit-btn"
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <span>변경 중...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>변경완료</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
