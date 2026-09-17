import React from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Video,
  Edit2,
  Trash2,
  Users,
  CheckCircle,
  Circle,
  ExternalLink
} from 'lucide-react';
import { CATEGORIES, ChecklistItem, TeamEvent } from '../types';
import { formatKoreanDate, formatTimeKorean } from '../utils/dateUtils';

interface EventDetailModalProps {
  isOpen: boolean;
  event: TeamEvent | null;
  onClose: () => void;
  onEdit: (event: TeamEvent) => void;
  onDelete: (eventId: string) => Promise<void>;
  onToggleChecklist: (eventId: string, itemId: string, completed: boolean) => Promise<void>;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  isOpen,
  event,
  onClose,
  onEdit,
  onDelete,
  onToggleChecklist,
}) => {
  if (!isOpen || !event) return null;

  const cat = CATEGORIES[event.category] || CATEGORIES.other;

  const handleDelete = async () => {
    if (window.confirm('이 일정을 삭제하시겠습니까?')) {
      await onDelete(event.id);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with category banner */}
        <div className={`px-6 py-4 border-b flex items-start justify-between ${cat.bgClass} ${cat.borderClass}`}>
          <div>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cat.bgClass} ${cat.textClass} border ${cat.borderClass} mb-2 bg-white/80`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: cat.dotColor }}
              ></span>
              {cat.label}
            </span>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">{event.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Date & Time */}
          <div className="flex items-start gap-3 text-xs text-slate-700">
            <Calendar className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-900">
                {formatKoreanDate(event.startDate)}
                {event.endDate && event.endDate !== event.startDate && ` ~ ${formatKoreanDate(event.endDate)}`}
              </div>
              <div className="text-slate-500 mt-0.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {event.isAllDay
                    ? '종일 일정'
                    : `${formatTimeKorean(event.startTime)} ~ ${formatTimeKorean(event.endTime)}`}
                </span>
              </div>
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-3 text-xs text-slate-700">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-slate-900">{event.location}</span>
              </div>
            </div>
          )}

          {/* Meeting Link */}
          {event.meetingLink && (
            <div className="flex items-start gap-3 text-xs">
              <Video className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <a
                  href={event.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-semibold border border-indigo-200 transition-colors text-xs truncate max-w-full"
                >
                  <Video className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">화상 회의 바로 참가하기</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            </div>
          )}

          {/* Attendees */}
          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-start gap-3 text-xs pt-1 border-t border-slate-100">
              <Users className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
              <div className="flex-1">
                <span className="text-[11px] text-slate-400 block mb-1">참석자 / 팀원</span>
                <div className="flex flex-wrap gap-1.5">
                  {event.attendees.map((name, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200/60"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 block mb-1">상세 내용</span>
              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {event.description}
              </p>
            </div>
          )}

          {/* Checklist */}
          {event.checklist && event.checklist.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 block mb-2">
                체크리스트 ({event.checklist.filter((c) => c.completed).length}/{event.checklist.length})
              </span>
              <div className="space-y-1.5">
                {event.checklist.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onToggleChecklist(event.id, item.id, !item.completed)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs border border-slate-100 transition-colors"
                  >
                    {item.completed ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                    <span
                      className={
                        item.completed
                          ? 'line-through text-slate-400'
                          : 'text-slate-700 font-medium'
                      }
                    >
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Meta */}
          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>등록자: {event.creatorName}</span>
            <span>최근 수정: {new Date(event.updatedAt || event.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleDelete}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>삭제</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              닫기
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(event);
              }}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>수정</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
