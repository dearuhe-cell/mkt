export type EventCategory = 'meeting' | 'task' | 'deadline' | 'outwork' | 'vacation' | 'social' | 'other';

export interface CategoryInfo {
  id: EventCategory;
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotColor: string;
}

export const CATEGORIES: Record<EventCategory, CategoryInfo> = {
  meeting: {
    id: 'meeting',
    label: '회의 / 미팅',
    bgClass: 'bg-indigo-50',
    textClass: 'text-indigo-700',
    borderClass: 'border-indigo-200',
    dotColor: '#6366f1',
  },
  task: {
    id: 'task',
    label: '업무 / 개발',
    bgClass: 'bg-sky-50',
    textClass: 'text-sky-700',
    borderClass: 'border-sky-200',
    dotColor: '#0ea5e9',
  },
  deadline: {
    id: 'deadline',
    label: '마감 / 납기',
    bgClass: 'bg-rose-50',
    textClass: 'text-rose-700',
    borderClass: 'border-rose-200',
    dotColor: '#f43f5e',
  },
  outwork: {
    id: 'outwork',
    label: '외근 / 출장',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-200',
    dotColor: '#f59e0b',
  },
  vacation: {
    id: 'vacation',
    label: '휴가 / 반차',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-200',
    dotColor: '#10b981',
  },
  social: {
    id: 'social',
    label: '회식 / 행사',
    bgClass: 'bg-purple-50',
    textClass: 'text-purple-700',
    borderClass: 'border-purple-200',
    dotColor: '#a855f7',
  },
  other: {
    id: 'other',
    label: '기타 일정',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
    borderClass: 'border-slate-200',
    dotColor: '#64748b',
  },
};

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  color: string;
  avatarText?: string;
  role?: string;
  joinedAt: string;
}

export interface TeamEvent {
  id: string;
  teamId: string;
  title: string;
  description?: string;
  category: EventCategory;
  startDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endDate: string; // YYYY-MM-DD
  endTime?: string; // HH:mm
  isAllDay: boolean;
  location?: string;
  meetingLink?: string;
  creatorName: string;
  creatorId?: string;
  attendees: string[]; // member names
  checklist?: ChecklistItem[];
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  code: string; // human-readable code e.g. "TEAM-4921" or custom slug
  name: string;
  description?: string;
  pin?: string; // optional PIN for privacy
  members: TeamMember[];
  events: TeamEvent[];
  createdAt: string;
  updatedAt: string;
}

export type CalendarViewMode = 'month' | 'week' | 'agenda';

export interface UserProfile {
  id: string;
  name: string;
  color: string;
}
