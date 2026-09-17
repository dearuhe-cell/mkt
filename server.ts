import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  color: string;
  joinedAt: string;
}

interface TeamEvent {
  id: string;
  teamId: string;
  title: string;
  description?: string;
  category: string;
  startDate: string;
  startTime?: string;
  endDate: string;
  endTime?: string;
  isAllDay: boolean;
  location?: string;
  meetingLink?: string;
  creatorName: string;
  creatorId?: string;
  attendees: string[];
  checklist?: ChecklistItem[];
  color?: string;
  createdAt: string;
  updatedAt: string;
}

interface Team {
  id: string;
  code: string;
  name: string;
  description?: string;
  pin?: string;
  members: TeamMember[];
  events: TeamEvent[];
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "teams.json");

function ensureDataFile(): Record<string, Team> {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      // Seed default sample team
      const today = new Date();
      const formatD = (d: Date) => d.toISOString().split("T")[0];
      const d1 = new Date(today);
      const d2 = new Date(today);
      d2.setDate(today.getDate() + 1);
      const d3 = new Date(today);
      d3.setDate(today.getDate() + 3);

      const defaultTeamId = "sample-team";
      const initialTeams: Record<string, Team> = {
        DEMO: {
          id: defaultTeamId,
          code: "DEMO",
          name: "스타트업 프로젝트 A팀",
          description: "로그인 없이 누구나 코드로 참여하는 팀 일정 공간",
          members: [
            { id: "m1", name: "김민수", color: "#6366f1", joinedAt: new Date().toISOString() },
            { id: "m2", name: "이지혜", color: "#10b981", joinedAt: new Date().toISOString() },
            { id: "m3", name: "박준영", color: "#f59e0b", joinedAt: new Date().toISOString() },
          ],
          events: [
            {
              id: "e1",
              teamId: defaultTeamId,
              title: "주간 스프린트 킥오프 회의",
              description: "이번 주 목표 공유 및 주요 태스크 우선순위 논의",
              category: "meeting",
              startDate: formatD(d1),
              startTime: "10:00",
              endDate: formatD(d1),
              endTime: "11:30",
              isAllDay: false,
              location: "회의실 A (또는 온라인)",
              meetingLink: "https://meet.google.com/new",
              creatorName: "김민수",
              attendees: ["김민수", "이지혜", "박준영"],
              checklist: [
                { id: "c1", text: "전주 배포 결과 리뷰", completed: true },
                { id: "c2", text: "신규 피처 스펙 확정", completed: false },
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: "e2",
              teamId: defaultTeamId,
              title: "고객사 미팅 및 제품 데모",
              description: "B2B 신규 파트너십 데모 시연 및 Q&A",
              category: "outwork",
              startDate: formatD(d2),
              startTime: "14:00",
              endDate: formatD(d2),
              endTime: "16:00",
              isAllDay: false,
              location: "역삼 테헤란로 본사",
              creatorName: "박준영",
              attendees: ["박준영", "김민수"],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: "e3",
              teamId: defaultTeamId,
              title: "3분기 로드맵 마감일",
              description: "기획서 최종 취합 및 리뷰 완료",
              category: "deadline",
              startDate: formatD(d3),
              endDate: formatD(d3),
              isAllDay: true,
              creatorName: "이지혜",
              attendees: ["이지혜"],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialTeams, null, 2), "utf-8");
      return initialTeams;
    }
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load teams data, returning empty state:", err);
    return {};
  }
}

function saveTeamsData(data: Record<string, Team>) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save teams data:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Cache in memory and sync
  const teamsCache = ensureDataFile();

  // API Health
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", count: Object.keys(teamsCache).length });
  });

  // Get Team by code (case-insensitive)
  app.get("/api/teams/:code", (req, res) => {
    const rawCode = req.params.code.trim().toUpperCase();
    const pin = req.query.pin as string | undefined;

    let team = teamsCache[rawCode];
    if (!team) {
      // also search by ID
      team = Object.values(teamsCache).find(
        (t) => t.id === req.params.code || t.code.toUpperCase() === rawCode
      );
    }

    if (!team) {
      return res.status(404).json({ error: "팀을 찾을 수 없습니다. 코드를 확인해주세요." });
    }

    if (team.pin && team.pin !== pin) {
      return res.status(401).json({ error: "비밀번호(PIN)가 일치하지 않습니다.", needsPin: true });
    }

    res.json({ team });
  });

  // Create Team
  app.post("/api/teams", (req, res) => {
    const { name, code, pin, creatorName, creatorColor } = req.body;
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "팀 이름을 입력해주세요." });
    }

    // Generate random code if not provided or format custom code
    let finalCode = "";
    if (code && typeof code === "string" && code.trim().length > 0) {
      finalCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    }
    if (!finalCode) {
      // 4 uppercase chars + 4 numbers
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
      const randomPrefix = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      finalCode = `${randomPrefix}-${randomNum}`;
    }

    if (teamsCache[finalCode]) {
      return res.status(409).json({ error: `이미 존재하는 팀 코드입니다 (${finalCode}). 다른 코드를 사용해주세요.` });
    }

    const teamId = `team_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const creatorMemberName = creatorName?.trim() || "팀장";
    const initialMember: TeamMember = {
      id: `m_${Date.now()}`,
      name: creatorMemberName,
      color: creatorColor || "#6366f1",
      joinedAt: new Date().toISOString(),
    };

    const newTeam: Team = {
      id: teamId,
      code: finalCode,
      name: name.trim(),
      pin: pin?.trim() || undefined,
      members: [initialMember],
      events: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    teamsCache[finalCode] = newTeam;
    saveTeamsData(teamsCache);

    res.status(201).json({ team: newTeam, creator: initialMember });
  });

  // Update Team (Team name, description)
  app.put("/api/teams/:code", (req, res) => {
    const code = req.params.code.trim().toUpperCase();
    const team = teamsCache[code];
    if (!team) {
      return res.status(404).json({ error: "팀을 찾을 수 없습니다." });
    }

    const { name, description } = req.body;
    if (name !== undefined) {
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ error: "팀 이름을 입력해주세요." });
      }
      team.name = name.trim();
    }
    if (description !== undefined) {
      team.description = typeof description === "string" ? description.trim() : "";
    }

    team.updatedAt = new Date().toISOString();
    saveTeamsData(teamsCache);

    res.json({ team });
  });

  // Join / Register member to team
  app.post("/api/teams/:code/members", (req, res) => {
    const code = req.params.code.trim().toUpperCase();
    const team = teamsCache[code];
    if (!team) {
      return res.status(404).json({ error: "팀을 찾을 수 없습니다." });
    }

    const { name, color } = req.body;
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "이름을 입력해주세요." });
    }

    const trimmedName = name.trim();
    let existing = team.members.find((m) => m.name.toLowerCase() === trimmedName.toLowerCase());

    if (existing) {
      if (color) existing.color = color;
      team.updatedAt = new Date().toISOString();
      saveTeamsData(teamsCache);
      return res.json({ member: existing, team });
    }

    const newMember: TeamMember = {
      id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: trimmedName,
      color: color || "#6366f1",
      joinedAt: new Date().toISOString(),
    };

    team.members.push(newMember);
    team.updatedAt = new Date().toISOString();
    saveTeamsData(teamsCache);

    res.status(201).json({ member: newMember, team });
  });

  // Update Member (Name, Color)
  app.put("/api/teams/:code/members/:memberId", (req, res) => {
    const code = req.params.code.trim().toUpperCase();
    const team = teamsCache[code];
    if (!team) {
      return res.status(404).json({ error: "팀을 찾을 수 없습니다." });
    }

    const { memberId } = req.params;
    const member = team.members.find((m) => m.id === memberId);
    if (!member) {
      return res.status(404).json({ error: "팀원을 찾을 수 없습니다." });
    }

    const { name, color } = req.body;
    if (name !== undefined) {
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ error: "팀원 이름을 입력해주세요." });
      }
      const oldName = member.name;
      const newName = name.trim();
      member.name = newName;

      // Update name across events
      if (oldName !== newName) {
        team.events.forEach((evt) => {
          if (evt.creatorName === oldName) {
            evt.creatorName = newName;
          }
          if (evt.attendees) {
            evt.attendees = evt.attendees.map((att) => (att === oldName ? newName : att));
          }
        });
      }
    }

    if (color !== undefined) {
      member.color = color;
    }

    team.updatedAt = new Date().toISOString();
    saveTeamsData(teamsCache);

    res.json({ member, team });
  });

  // Delete Member
  app.delete("/api/teams/:code/members/:memberId", (req, res) => {
    const code = req.params.code.trim().toUpperCase();
    const team = teamsCache[code];
    if (!team) {
      return res.status(404).json({ error: "팀을 찾을 수 없습니다." });
    }

    const { memberId } = req.params;
    const memberIndex = team.members.findIndex((m) => m.id === memberId);
    if (memberIndex === -1) {
      return res.status(404).json({ error: "삭제할 팀원을 찾을 수 없습니다." });
    }

    const removedMember = team.members[memberIndex];
    team.members.splice(memberIndex, 1);

    // Remove from attendees
    team.events.forEach((evt) => {
      if (evt.attendees) {
        evt.attendees = evt.attendees.filter((att) => att !== removedMember.name);
      }
    });

    team.updatedAt = new Date().toISOString();
    saveTeamsData(teamsCache);

    res.json({ success: true, deletedId: memberId, team });
  });

  // Create Event
  app.post("/api/teams/:code/events", (req, res) => {
    const code = req.params.code.trim().toUpperCase();
    const team = teamsCache[code];
    if (!team) {
      return res.status(404).json({ error: "팀을 찾을 수 없습니다." });
    }

    const {
      title,
      description,
      category,
      startDate,
      startTime,
      endDate,
      endTime,
      isAllDay,
      location,
      meetingLink,
      creatorName,
      attendees,
      checklist,
      color,
    } = req.body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ error: "일정 제목을 입력해주세요." });
    }
    if (!startDate) {
      return res.status(400).json({ error: "시작 날짜를 지정해주세요." });
    }

    const newEvent: TeamEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      teamId: team.id,
      title: title.trim(),
      description: description?.trim() || "",
      category: category || "meeting",
      startDate,
      startTime: isAllDay ? undefined : startTime || "09:00",
      endDate: endDate || startDate,
      endTime: isAllDay ? undefined : endTime || "10:00",
      isAllDay: Boolean(isAllDay),
      location: location?.trim() || "",
      meetingLink: meetingLink?.trim() || "",
      creatorName: creatorName?.trim() || "팀원",
      attendees: Array.isArray(attendees) ? attendees : [],
      checklist: Array.isArray(checklist) ? checklist : [],
      color: color || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    team.events.push(newEvent);
    team.updatedAt = new Date().toISOString();
    saveTeamsData(teamsCache);

    res.status(201).json({ event: newEvent, team });
  });

  // Update Event
  app.put("/api/teams/:code/events/:eventId", (req, res) => {
    const code = req.params.code.trim().toUpperCase();
    const team = teamsCache[code];
    if (!team) {
      return res.status(404).json({ error: "팀을 찾을 수 없습니다." });
    }

    const { eventId } = req.params;
    const eventIndex = team.events.findIndex((e) => e.id === eventId);
    if (eventIndex === -1) {
      return res.status(404).json({ error: "일정을 찾을 수 없습니다." });
    }

    const existing = team.events[eventIndex];
    const updateData = req.body;

    const updatedEvent: TeamEvent = {
      ...existing,
      ...updateData,
      id: existing.id,
      teamId: existing.teamId,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    team.events[eventIndex] = updatedEvent;
    team.updatedAt = new Date().toISOString();
    saveTeamsData(teamsCache);

    res.json({ event: updatedEvent, team });
  });

  // Delete Event
  app.delete("/api/teams/:code/events/:eventId", (req, res) => {
    const code = req.params.code.trim().toUpperCase();
    const team = teamsCache[code];
    if (!team) {
      return res.status(404).json({ error: "팀을 찾을 수 없습니다." });
    }

    const { eventId } = req.params;
    const initialLen = team.events.length;
    team.events = team.events.filter((e) => e.id !== eventId);

    if (team.events.length === initialLen) {
      return res.status(404).json({ error: "삭제할 일정을 찾을 수 없습니다." });
    }

    team.updatedAt = new Date().toISOString();
    saveTeamsData(teamsCache);

    res.json({ success: true, deletedId: eventId, team });
  });

  // Export iCal .ics
  app.get("/api/teams/:code/export.ics", (req, res) => {
    const code = req.params.code.trim().toUpperCase();
    const team = teamsCache[code];
    if (!team) {
      return res.status(404).send("Team not found");
    }

    let icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      `PRODID:-//Team Schedule//${team.name}//KO`,
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:${team.name} 팀 일정`,
    ];

    team.events.forEach((evt) => {
      const formatIcsDate = (dateStr: string, timeStr?: string) => {
        const cleanDate = dateStr.replace(/-/g, "");
        if (!timeStr) return cleanDate;
        const cleanTime = timeStr.replace(/:/g, "") + "00";
        return `${cleanDate}T${cleanTime}`;
      };

      const dtStart = evt.isAllDay
        ? `VALUE=DATE:${formatIcsDate(evt.startDate)}`
        : formatIcsDate(evt.startDate, evt.startTime);
      const dtEnd = evt.isAllDay
        ? `VALUE=DATE:${formatIcsDate(evt.endDate || evt.startDate)}`
        : formatIcsDate(evt.endDate || evt.startDate, evt.endTime || evt.startTime);

      icsContent.push("BEGIN:VEVENT");
      icsContent.push(`UID:${evt.id}@teamschedule.app`);
      icsContent.push(`SUMMARY:${evt.title.replace(/,/g, "\\,")}`);
      if (evt.description) {
        icsContent.push(`DESCRIPTION:${evt.description.replace(/\n/g, "\\n").replace(/,/g, "\\,")}`);
      }
      if (evt.location) {
        icsContent.push(`LOCATION:${evt.location.replace(/,/g, "\\,")}`);
      }
      icsContent.push(evt.isAllDay ? `DTSTART;${dtStart}` : `DTSTART:${dtStart}`);
      icsContent.push(evt.isAllDay ? `DTEND;${dtEnd}` : `DTEND:${dtEnd}`);
      icsContent.push("END:VEVENT");
    });

    icsContent.push("END:VCALENDAR");

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(team.name)}_schedule.ics"`);
    res.send(icsContent.join("\r\n"));
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
