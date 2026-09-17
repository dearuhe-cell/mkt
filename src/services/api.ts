import { Team, TeamEvent, TeamMember, UserProfile } from '../types';

const USER_PROFILE_KEY = 'team_cal_user_profile';
const VISITED_TEAMS_KEY = 'team_cal_visited_teams';
const LAST_TEAM_CODE_KEY = 'team_cal_last_code';

export interface VisitedTeam {
  code: string;
  name: string;
  lastVisited: string;
}

// User Profile helpers
export function getStoredUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }

  const defaultColors = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
  const randomColor = defaultColors[Math.floor(Math.random() * defaultColors.length)];
  const defaultProfile: UserProfile = {
    id: `u_${Date.now()}`,
    name: '게스트',
    color: randomColor,
  };
  saveUserProfile(defaultProfile);
  return defaultProfile;
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error(e);
  }
}

// Visited teams history helpers
export function getVisitedTeams(): VisitedTeam[] {
  try {
    const raw = localStorage.getItem(VISITED_TEAMS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function recordVisitedTeam(code: string, name: string): void {
  try {
    const list = getVisitedTeams().filter((t) => t.code.toUpperCase() !== code.toUpperCase());
    list.unshift({ code: code.toUpperCase(), name, lastVisited: new Date().toISOString() });
    localStorage.setItem(VISITED_TEAMS_KEY, JSON.stringify(list.slice(0, 10)));
    localStorage.setItem(LAST_TEAM_CODE_KEY, code.toUpperCase());
  } catch (e) {
    console.error(e);
  }
}

export function getLastActiveTeamCode(): string | null {
  try {
    return localStorage.getItem(LAST_TEAM_CODE_KEY);
  } catch (e) {
    return null;
  }
}

// API Methods
export async function fetchTeam(code: string, pin?: string): Promise<Team> {
  const url = pin ? `/api/teams/${encodeURIComponent(code)}?pin=${encodeURIComponent(pin)}` : `/api/teams/${encodeURIComponent(code)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '팀 정보를 불러오는데 실패했습니다.');
  }
  const data = await res.json();
  return data.team;
}

export async function createTeam(payload: {
  name: string;
  code?: string;
  pin?: string;
  creatorName: string;
  creatorColor: string;
}): Promise<{ team: Team; creator: TeamMember }> {
  const res = await fetch('/api/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '새 팀 생성에 실패했습니다.');
  }
  return res.json();
}

export async function updateTeam(
  teamCode: string,
  payload: { name?: string; description?: string }
): Promise<{ team: Team }> {
  const res = await fetch(`/api/teams/${encodeURIComponent(teamCode)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '팀 정보 수정에 실패했습니다.');
  }
  return res.json();
}

export async function registerMember(
  teamCode: string,
  payload: { name: string; color: string }
): Promise<{ member: TeamMember; team: Team }> {
  const res = await fetch(`/api/teams/${encodeURIComponent(teamCode)}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '팀원 등록에 실패했습니다.');
  }
  return res.json();
}

export async function updateMember(
  teamCode: string,
  memberId: string,
  payload: { name?: string; color?: string }
): Promise<{ member: TeamMember; team: Team }> {
  const res = await fetch(`/api/teams/${encodeURIComponent(teamCode)}/members/${encodeURIComponent(memberId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '팀원 정보 수정에 실패했습니다.');
  }
  return res.json();
}

export async function deleteMember(
  teamCode: string,
  memberId: string
): Promise<{ success: boolean; deletedId: string; team: Team }> {
  const res = await fetch(`/api/teams/${encodeURIComponent(teamCode)}/members/${encodeURIComponent(memberId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '팀원 삭제에 실패했습니다.');
  }
  return res.json();
}

export async function createEvent(
  teamCode: string,
  eventData: Partial<TeamEvent>
): Promise<{ event: TeamEvent; team: Team }> {
  const res = await fetch(`/api/teams/${encodeURIComponent(teamCode)}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '일정 등록에 실패했습니다.');
  }
  return res.json();
}

export async function updateEvent(
  teamCode: string,
  eventId: string,
  eventData: Partial<TeamEvent>
): Promise<{ event: TeamEvent; team: Team }> {
  const res = await fetch(`/api/teams/${encodeURIComponent(teamCode)}/events/${encodeURIComponent(eventId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '일정 수정에 실패했습니다.');
  }
  return res.json();
}

export async function deleteEvent(
  teamCode: string,
  eventId: string
): Promise<{ success: boolean; team: Team }> {
  const res = await fetch(`/api/teams/${encodeURIComponent(teamCode)}/events/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '일정 삭제에 실패했습니다.');
  }
  return res.json();
}

export function getShareableUrl(teamCode: string): string {
  const base = window.location.origin + window.location.pathname;
  return `${base}?team=${encodeURIComponent(teamCode)}`;
}
