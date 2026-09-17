import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Video,
  CheckSquare,
  Trash2,
  Plus,
  Users,
  Tag,
  AlertCircle
} from 'lucide-react';
import { CATEGORIES, ChecklistItem, EventCategory, Team, TeamEvent, UserProfile } from '../types';
import { formatDateToYMD } from '../utils/dateUtils';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team;
  currentUser: UserProfile;
  eventToEdit: TeamEvent | null;
  initialDate?: string;
  initialTime?: string;
  onSave: (eventData: Partial<TeamEvent>) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  team,
  currentUser,
  eventToEdit,
  initialDate,
  initialTime,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('meeting');
  const [startDate, setStartDate] = useState(initialDate || formatDateToYMD(new Date()));
  const [endDate, setEndDate] = useState(initialDate || formatDateToYMD(new Date()));
  const [startTime, setStartTime] = useState(initialTime || '10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [description, setDescription] = useState('');
  const [creatorName, setCreatorName] = useState(currentUser.name);
  const [attendees, setAttendees] = useState<string[]>([currentUser.name]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [customAttendee, setCustomAttendee] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setCategory(eventToEdit.category);
      setStartDate(eventToEdit.startDate);
      setEndDate(eventToEdit.endDate || eventToEdit.startDate);
      setStartTime(eventToEdit.startTime || '10:00');
      setEndTime(eventToEdit.endTime || '11:00');
      setIsAllDay(eventToEdit.isAllDay);
      setLocation(eventToEdit.location || '');
      setMeetingLink(eventToEdit.meetingLink || '');
      setDescription(eventToEdit.description || '');
      setCreatorName(eventToEdit.creatorName || currentUser.name);
      setAttendees(eventToEdit.attendees || []);
      setChecklist(eventToEdit.checklist || []);
    } else {
      const d = initialDate || formatDateToYMD(new Date());
      setTitle('');
      setCategory('meeting');
      setStartDate(d);
      setEndDate(d);
      setStartTime(initialTime || '10:00');
      // default end time 1 hour later
      if (initialTime) {
        const [h, m] = initialTime.split(':').map(Number);
        const endH = Math.min(h + 1, 23);
        setEndTime(`${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      } else {
        setEndTime('11:00');
      }
      setIsAllDay(false);
      setLocation('');
      setMeetingLink('');
      setDescription('');
      setCreatorName(currentUser.name);
      setAttendees([currentUser.name]);
      setChecklist([]);
    }
    setErrorMsg('');
  }, [eventToEdit, initialDate, initialTime, currentUser, isOpen]);

  if (!isOpen) return null;

  const handleToggleAttendee = (name: string) => {
    if (attendees.includes(name)) {
      setAttendees(attendees.filter((a) => a !== name));
    } else {
      setAttendees([...attendees, name]);
    }
  };

  const handleAddCustomAttendee = () => {
    if (!customAttendee.trim()) return;
    if (!attendees.includes(customAttendee.trim())) {
      setAttendees([...attendees, customAttendee.trim()]);
    }
    setCustomAttendee('');
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setChecklist([
      ...checklist,
      { id: `c_${Date.now()}`, text: newChecklistText.trim(), completed: false },
    ]);
    setNewChecklistText('');
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('일정 제목을 입력해주세요.');
      return;
    }
    if (!startDate) {
      setErrorMsg('시작 날짜를 선택해주세요.');
      return;
    }
    if (endDate && endDate < startDate) {
      setErrorMsg('종료 날짜는 시작 날짜보다 앞설 수 없습니다.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onSave({
        title: title.trim(),
        category,
        startDate,
        endDate: endDate || startDate,
        startTime: isAllDay ? undefined : startTime,
        endTime: isAllDay ? undefined : endTime,
        isAllDay,
        location: location.trim(),
        meetingLink: meetingLink.trim(),
        description: description.trim(),
        creatorName: creatorName.trim() || currentUser.name,
        attendees,
        checklist,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || '일정 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            <h3 className="font-bold text-slate-900 text-base">
              {eventToEdit ? '일정 수정하기' : '새 팀 일정 등록'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              일정 제목 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="event-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 주간 기획 회의, 제품 런칭 배포, 휴가"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium placeholder:text-slate-400"
              autoFocus
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>카테고리 분류</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {(Object.keys(CATEGORIES) as EventCategory[]).map((catKey) => {
                const cat = CATEGORIES[catKey];
                const isSelected = category === catKey;
                return (
                  <button
                    type="button"
                    key={catKey}
                    onClick={() => setCategory(catKey)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? `${cat.bgClass} ${cat.textClass} ${cat.borderClass} ring-2 ring-indigo-500/30 font-semibold shadow-2xs`
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat.dotColor }}
                    ></span>
                    <span className="truncate">{cat.label.split('/')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time Group */}
          <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>날짜 및 시간 설정</span>
              </span>
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  id="event-allday-checkbox"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span>종일 일정</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">시작일</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (endDate < e.target.value) setEndDate(e.target.value);
                  }}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block mb-1">종료일</span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {!isAllDay && (
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200/50">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    시작 시간
                  </span>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 block mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    종료 시간
                  </span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Attendees / Team members */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>참석자 / 담당자</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {team.members.map((m) => {
                const isSelected = attendees.includes(m.name);
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => handleToggleAttendee(m.name)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-semibold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: m.color || '#6366f1' }}
                    ></span>
                    <span>{m.name}</span>
                    {isSelected && <span className="text-indigo-600 text-[10px]">✓</span>}
                  </button>
                );
              })}
            </div>

            {/* Custom attendee addition */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customAttendee}
                onChange={(e) => setCustomAttendee(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomAttendee();
                  }
                }}
                placeholder="외부 참석자 또는 다른 팀원 이름 입력..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddCustomAttendee}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              >
                추가
              </button>
            </div>
          </div>

          {/* Location & Meeting Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>장소 / 위치</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="예: 4층 대회의실, 강남역 카페"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-slate-400" />
                <span>온라인 링크 (Google Meet / Zoom)</span>
              </label>
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Description / Memo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              상세 메모 / 아젠다
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="회의 안건, 준비사항, 공유할 내용을 작성해주세요."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          {/* Checklist */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>준비물 / 체크리스트</span>
            </label>

            {checklist.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                  >
                    <span>{item.text}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklistItem(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
                placeholder="체크할 항목 입력 (예: 발표 자료 슬라이드 준비)..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>추가</span>
              </button>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {eventToEdit && onDelete ? (
            <button
              type="button"
              onClick={async () => {
                if (window.confirm('정말 이 일정을 삭제하시겠습니까?')) {
                  await onDelete(eventToEdit.id);
                  onClose();
                }
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>일정 삭제</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              id="save-event-submit-btn"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? '저장 중...' : eventToEdit ? '수정 완료' : '일정 등록'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
