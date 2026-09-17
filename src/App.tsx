/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CalendarViewMode,
  CATEGORIES,
  EventCategory,
  Team,
  TeamEvent,
  UserProfile
} from './types';
import {
  fetchTeam,
  createTeam,
  updateTeam,
  registerMember,
  updateMember,
  deleteMember,
  createEvent,
  updateEvent,
  deleteEvent,
  getStoredUserProfile,
  saveUserProfile,
  recordVisitedTeam,
  getLastActiveTeamCode,
  getDefaultSampleTeam
} from './services/api';
import { Header } from './components/Header';
import { SidebarFilters } from './components/SidebarFilters';
import { CalendarMonthView } from './components/CalendarMonthView';
import { CalendarWeekView } from './components/CalendarWeekView';
import { CalendarAgendaView } from './components/CalendarAgendaView';
import { EventModal } from './components/EventModal';
import { EventDetailModal } from './components/EventDetailModal';
import { TeamEntryModal } from './components/TeamEntryModal';
import { ShareTeamModal } from './components/ShareTeamModal';
import { ProfileModal } from './components/ProfileModal';
import { EditTeamModal } from './components/EditTeamModal';
import { InteractiveHeroSection } from './components/InteractiveHeroSection';
import { YouTubeSection } from './components/YouTubeSection';
import { formatDateToYMD } from './utils/dateUtils';
import { AlertCircle, Calendar, Plus, RefreshCw, Share2, Sparkles, Users } from 'lucide-react';

export default function App() {
  // Current Team & Events: Initialize with default sample team so calendar is rendered immediately on first paint
  const [team, setTeam] = useState<Team | null>(getDefaultSampleTeam);
  const [currentUser, setCurrentUser] = useState<UserProfile>(getStoredUserProfile);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Filter States
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>(
    Object.keys(CATEGORIES) as EventCategory[]
  );

  // Sync & Loading state (seamless background sync, never block calendar)
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());
  const [syncError, setSyncError] = useState<string | null>(null);

  // Modals state (never open modal on start)
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<TeamEvent | null>(null);
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<TeamEvent | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState<string | undefined>(undefined);
  const [modalInitialTime, setModalInitialTime] = useState<string | undefined>(undefined);

  // Load team by code with seamless fallback to demo team
  const loadTeamData = useCallback(async (code: string, pin?: string, silent = false) => {
    try {
      if (!silent) setIsSyncing(true);
      setSyncError(null);
      const teamData = await fetchTeam(code, pin);
      setTeam(teamData);
      setLastSyncTime(new Date());
      recordVisitedTeam(teamData.code, teamData.name);
    } catch (err: any) {
      console.warn('Could not fetch remote team:', err);
      if (code !== 'DEMO') {
        try {
          const fallbackData = await fetchTeam('DEMO');
          setTeam(fallbackData);
          setLastSyncTime(new Date());
          recordVisitedTeam(fallbackData.code, fallbackData.name);
          return;
        } catch {
          // ignore
        }
      }
      // Ensure team remains active so calendar is always visible
      setTeam((prev) => prev || getDefaultSampleTeam());
      // Do NOT open modal automatically! The user can click to change team if desired.
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, []);

  // Initialize: Check URL parameter or localStorage or default to 'DEMO'
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTeamCode = params.get('team') || params.get('code');

    if (urlTeamCode) {
      loadTeamData(urlTeamCode.toUpperCase());
    } else {
      const lastCode = getLastActiveTeamCode();
      if (lastCode) {
        loadTeamData(lastCode);
      } else {
        // Load default DEMO team
        loadTeamData('DEMO');
      }
    }
  }, [loadTeamData]);

  // Periodic polling for team updates (every 8 seconds) and on window focus
  useEffect(() => {
    if (!team) return;

    const interval = setInterval(() => {
      loadTeamData(team.code, undefined, true);
    }, 8000);

    const handleFocus = () => {
      loadTeamData(team.code, undefined, true);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [team?.code, loadTeamData]);

  // User profile update
  const handleSaveProfile = (profile: UserProfile) => {
    setCurrentUser(profile);
    saveUserProfile(profile);
  };

  // Add Member
  const handleAddTeamMember = async (name: string, color: string) => {
    if (!team) return;
    const res = await registerMember(team.code, { name, color });
    setTeam(res.team);
  };

  // Update Member (Name, Color)
  const handleUpdateTeamMember = async (memberId: string, name: string, color?: string) => {
    if (!team) return;
    const res = await updateMember(team.code, memberId, { name, color });
    setTeam(res.team);
    // If updated member corresponds to current user's profile, sync local profile
    const existing = team.members.find((m) => m.id === memberId);
    if (existing && (existing.name === currentUser.name || name.trim() === currentUser.name)) {
      const updatedUser: UserProfile = {
        ...currentUser,
        name: name.trim(),
        color: color || currentUser.color,
      };
      setCurrentUser(updatedUser);
      saveUserProfile(updatedUser);
    }
    setLastSyncTime(new Date());
  };

  // Delete Member
  const handleDeleteTeamMember = async (memberId: string) => {
    if (!team) return;
    const target = team.members.find((m) => m.id === memberId);
    const res = await deleteMember(team.code, memberId);
    setTeam(res.team);
    if (target && selectedMember === target.name) {
      setSelectedMember(null);
    }
    setLastSyncTime(new Date());
  };

  // Update Team (Name, Description)
  const handleUpdateTeam = async (name: string, description?: string) => {
    if (!team) return;
    const res = await updateTeam(team.code, { name, description });
    setTeam(res.team);
    recordVisitedTeam(res.team.code, res.team.name);
    setLastSyncTime(new Date());
  };

  // Join Team
  const handleJoinTeam = async (code: string, pin?: string, memberName?: string, memberColor?: string) => {
    const teamData = await fetchTeam(code, pin);
    if (memberName) {
      const memberRes = await registerMember(teamData.code, {
        name: memberName,
        color: memberColor || currentUser.color,
      });
      setTeam(memberRes.team);
    } else {
      setTeam(teamData);
    }
    recordVisitedTeam(teamData.code, teamData.name);
    setLastSyncTime(new Date());

    // Update URL without full reload
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('team', teamData.code);
    window.history.replaceState({}, '', newUrl.toString());
  };

  // Create Team
  const handleCreateTeam = async (
    name: string,
    code?: string,
    pin?: string,
    creatorName?: string,
    creatorColor?: string
  ) => {
    const res = await createTeam({
      name,
      code,
      pin,
      creatorName: creatorName || currentUser.name,
      creatorColor: creatorColor || currentUser.color,
    });
    setTeam(res.team);
    recordVisitedTeam(res.team.code, res.team.name);
    setLastSyncTime(new Date());

    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('team', res.team.code);
    window.history.replaceState({}, '', newUrl.toString());
  };

  // Event Handlers
  const handleOpenNewEvent = (dateStr?: string, timeStr?: string) => {
    setEventToEdit(null);
    setModalInitialDate(dateStr || formatDateToYMD(currentDate));
    setModalInitialTime(timeStr);
    setIsEventModalOpen(true);
  };

  const handleEditEvent = (evt: TeamEvent) => {
    setEventToEdit(evt);
    setModalInitialDate(evt.startDate);
    setModalInitialTime(evt.startTime);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (eventData: Partial<TeamEvent>) => {
    if (!team) return;
    if (eventToEdit) {
      const res = await updateEvent(team.code, eventToEdit.id, eventData);
      setTeam(res.team);
      if (selectedEventForDetail?.id === eventToEdit.id) {
        setSelectedEventForDetail(res.event);
      }
    } else {
      const res = await createEvent(team.code, eventData);
      setTeam(res.team);
    }
    setLastSyncTime(new Date());
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!team) return;
    const res = await deleteEvent(team.code, eventId);
    setTeam(res.team);
    if (selectedEventForDetail?.id === eventId) {
      setSelectedEventForDetail(null);
    }
    setLastSyncTime(new Date());
  };

  const handleToggleChecklist = async (eventId: string, itemId: string, completed: boolean) => {
    if (!team) return;
    const target = team.events.find((e) => e.id === eventId);
    if (!target) return;

    const updatedChecklist = (target.checklist || []).map((item) =>
      item.id === itemId ? { ...item, completed } : item
    );

    const res = await updateEvent(team.code, eventId, { checklist: updatedChecklist });
    setTeam(res.team);
    if (selectedEventForDetail?.id === eventId) {
      setSelectedEventForDetail(res.event);
    }
  };

  // Filter events
  const filteredEvents = useMemo(() => {
    if (!team) return [];
    return team.events.filter((evt) => {
      // Category filter
      if (!selectedCategories.includes(evt.category)) return false;

      // Member filter
      if (selectedMember) {
        const isCreator = evt.creatorName === selectedMember;
        const isAttendee = evt.attendees?.includes(selectedMember);
        if (!isCreator && !isAttendee) return false;
      }

      return true;
    });
  }, [team, selectedCategories, selectedMember]);

  // Category filter helpers
  const handleToggleCategory = (cat: EventCategory) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length === 1) return; // keep at least one
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleSelectAllCategories = () => {
    const all = Object.keys(CATEGORIES) as EventCategory[];
    if (selectedCategories.length === all.length) {
      setSelectedCategories(['meeting']);
    } else {
      setSelectedCategories(all);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <Header
        team={team}
        currentUser={currentUser}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenNewEvent={() => handleOpenNewEvent()}
        onOpenTeamModal={() => setIsTeamModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenEditTeamModal={() => setIsEditTeamModalOpen(true)}
        onUpdateTeam={handleUpdateTeam}
        onRefresh={() => team && loadTeamData(team.code)}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex-1 flex flex-col">
        {syncError && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{syncError}</span>
            </div>
            <button
              onClick={() => setIsTeamModalOpen(true)}
              className="text-indigo-600 font-bold hover:underline ml-3 shrink-0"
            >
              팀 전환 / 참여하기
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
            <p className="text-sm font-medium">팀 일정을 불러오는 중입니다...</p>
          </div>
        ) : team ? (
          <div className="flex-1 flex flex-col">
            {/* Interactive Hero Dashboard Banner */}
            <InteractiveHeroSection
              team={team}
              currentUser={currentUser}
              events={team.events}
              selectedMember={selectedMember}
              onSelectMember={setSelectedMember}
              onOpenNewEvent={(dateStr) => handleOpenNewEvent(dateStr)}
              onOpenShareModal={() => setIsShareModalOpen(true)}
              onSelectEvent={(evt) => setSelectedEventForDetail(evt)}
              onJumpToToday={() => setCurrentDate(new Date())}
              onUpdateTeamNotice={(notice) => handleUpdateTeam(team.name, notice)}
            />

            <div className="flex-1 flex flex-col lg:flex-row gap-6 items-start">
              {/* 1. Calendar Views (Primary - Shown First) */}
              <div className="flex-1 w-full min-w-0 flex flex-col min-h-[620px] order-1 lg:order-1">
                {viewMode === 'month' && (
                  <CalendarMonthView
                    currentDate={currentDate}
                    onChangeMonth={setCurrentDate}
                    events={filteredEvents}
                    onSelectEvent={(evt) => setSelectedEventForDetail(evt)}
                    onSelectDate={(dateStr) => handleOpenNewEvent(dateStr)}
                  />
                )}

                {viewMode === 'week' && (
                  <CalendarWeekView
                    currentDate={currentDate}
                    onChangeDate={setCurrentDate}
                    events={filteredEvents}
                    onSelectEvent={(evt) => setSelectedEventForDetail(evt)}
                    onSelectTimeSlot={(dateStr, timeStr) => handleOpenNewEvent(dateStr, timeStr)}
                  />
                )}

                {viewMode === 'agenda' && (
                  <CalendarAgendaView
                    events={filteredEvents}
                    onSelectEvent={(evt) => setSelectedEventForDetail(evt)}
                    onOpenNewEvent={() => handleOpenNewEvent()}
                  />
                )}

                {/* YouTube Video Section Below Calendar */}
                <YouTubeSection
                  url="https://www.youtube.com/watch?v=1e_N5DHua64"
                  videoId="1e_N5DHua64"
                />
              </div>

              {/* 2. Team Members & Filter Sidebar (Shown After Calendar) */}
              <div className="w-full lg:w-64 shrink-0 order-2 lg:order-2">
                <SidebarFilters
                  team={team}
                  events={team.events}
                  selectedMember={selectedMember}
                  onSelectMember={setSelectedMember}
                  selectedCategories={selectedCategories}
                  onToggleCategory={handleToggleCategory}
                  onSelectAllCategories={handleSelectAllCategories}
                  onOpenNewEvent={() => handleOpenNewEvent()}
                  onOpenShareModal={() => setIsShareModalOpen(true)}
                  onOpenAddMemberModal={() => setIsProfileModalOpen(true)}
                  onOpenEditTeamModal={() => setIsEditTeamModalOpen(true)}
                  onUpdateTeam={handleUpdateTeam}
                />
              </div>
            </div>
        </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
              <Calendar className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">참여 중인 팀이 없습니다</h2>
            <p className="text-xs text-slate-500 max-w-sm mb-5 leading-relaxed">
              기존 팀 코드를 입력하거나 3초 만에 새로운 팀을 만들어 링크로 일정을 공유하세요.
            </p>
            <button
              id="start-team-btn"
              onClick={() => setIsTeamModalOpen(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>팀 참여 또는 만들기</span>
            </button>
          </div>
        )}
      </main>

      {/* Floating Add Event Button on Mobile */}
      {team && (
        <button
          id="mobile-quick-add-btn"
          onClick={() => handleOpenNewEvent()}
          className="lg:hidden fixed bottom-6 right-6 z-30 w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-400/40 flex items-center justify-center active:scale-95 transition-transform"
          title="새 일정 등록"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Modals */}
      {team && (
        <EventModal
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          team={team}
          currentUser={currentUser}
          eventToEdit={eventToEdit}
          initialDate={modalInitialDate}
          initialTime={modalInitialTime}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
        />
      )}

      <EventDetailModal
        isOpen={Boolean(selectedEventForDetail)}
        event={selectedEventForDetail}
        onClose={() => setSelectedEventForDetail(null)}
        onEdit={(evt) => {
          setSelectedEventForDetail(null);
          handleEditEvent(evt);
        }}
        onDelete={handleDeleteEvent}
        onToggleChecklist={handleToggleChecklist}
      />

      <TeamEntryModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        canClose={Boolean(team)}
        currentUser={currentUser}
        onSaveProfile={handleSaveProfile}
        onJoinTeam={handleJoinTeam}
        onCreateTeam={handleCreateTeam}
      />

      <ShareTeamModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        team={team}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        team={team}
        onSaveProfile={handleSaveProfile}
        onAddTeamMember={handleAddTeamMember}
        onUpdateTeamMember={handleUpdateTeamMember}
        onDeleteTeamMember={handleDeleteTeamMember}
      />

      <EditTeamModal
        isOpen={isEditTeamModalOpen}
        onClose={() => setIsEditTeamModalOpen(false)}
        team={team}
        onUpdateTeam={handleUpdateTeam}
      />
    </div>
  );
}
