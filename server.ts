/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { User, Event, Registration, Notification } from "./src/types.js";

let __filename = "";
let __dirname = "";
try {
  if (typeof import.meta !== "undefined" && import.meta.url) {
    __filename = fileURLToPath(import.meta.url);
    __dirname = path.dirname(__filename);
  }
} catch (e) {
  // Graceful fallback for CommonJS bundled environments
}

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "server_db.json");

interface DBStore {
  users: User[];
  events: Event[];
  registrations: Registration[];
  notifications: Notification[];
}

function getInitialDB(): DBStore {
  return {
    users: [
      {
        id: "u-admin",
        name: "Professor Tariq (Admin)",
        email: "admin@maju.edu",
        role: "admin"
      },
      {
        id: "u-stud1",
        name: "Mohammad Ali",
        email: "student@maju.edu",
        role: "student"
      },
      {
        id: "u-org1",
        name: "Dr. Farah Naz",
        email: "organizer@maju.edu",
        role: "organizer"
      }
    ],
    events: [
      {
        id: "ev-1",
        title: "Generative AI Seminar",
        description: "",
        date: "2026-06-25",
        startTime: "10:00",
        endTime: "12:00",
        venue: "Hall A",
        category: "Seminar",
        status: "approved",
        capacity: 100,
        image: "",
        schedule: [],
        resources: [],
        time: "10:00 - 12:00",
        speaker: "",
        organizerId: "u-org1",
        organizerName: "Dr. Farah Naz"
      },
      {
        id: "ev-2",
        title: "Sustainable Business Workshop",
        description: "",
        date: "2026-06-28",
        startTime: "13:00",
        endTime: "16:00",
        venue: "Hall B",
        category: "Workshop",
        status: "approved",
        capacity: 100,
        image: "",
        schedule: [],
        resources: [],
        time: "13:00 - 16:00",
        speaker: "",
        organizerId: "u-org1",
        organizerName: "Dr. Farah Naz"
      }
    ],
    registrations: [],
    notifications: []
  };
}

let db: DBStore;
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    db = {
      users: raw.users || [],
      events: raw.events || [],
      registrations: raw.registrations || [],
      notifications: raw.notifications || []
    };
  } else {
    db = getInitialDB();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  }
} catch (error) {
  console.error("Failed to load / initialize JSON database, using memory-only:", error);
  db = getInitialDB();
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write to JSON db file:", error);
  }
}

// Time parsing utility
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(":");
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(h) && !isNaN(m)) {
      return h * 60 + m;
    }
  }
  return 0;
}

function timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = parseTimeToMinutes(start1);
  const e1 = parseTimeToMinutes(end1);
  const s2 = parseTimeToMinutes(start2);
  const e2 = parseTimeToMinutes(end2);
  return Math.max(s1, s2) < Math.min(e1, e2);
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Check local status
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Authentication - Login
  app.post("/api/auth/login", (req, res) => {
    const { email, password, role } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }
    const emailTrimmed = email.trim().toLowerCase();
    const user = db.users.find(u => u.email.toLowerCase() === emailTrimmed);
    if (!user) {
      return res.status(401).json({ error: "Invalid email credentials. User not found." });
    }

    if (role && user.role !== role) {
      return res.status(403).json({ error: `Account role mismatch. This email is registered as "${user.role}", not "${role}".` });
    }

    if (user.role === "admin") {
      if (password !== "admin123") {
        return res.status(401).json({ error: "Invalid password for Admin. [HINT: Use 'admin123']" });
      }
    } else {
      // Check password if it exists
      if (user.password && password && user.password !== password) {
        return res.status(401).json({ error: `Invalid password for registered ${user.role === "organizer" ? "Event Organizer" : "Participant"}.` });
      }
      // If user has no password yet (existing imported accounts), save whatever they type on first login
      if (!user.password && password) {
        user.password = password;
        saveDB();
      }
    }

    return res.json({ success: true, user });
  });

  // API Authentication - Admin Protected Login
  app.post("/api/auth/admin-login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const adminUser = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase() && u.role === "admin");
    if (!adminUser) {
      return res.status(401).json({ error: "Access Denied. No Administrator account found with this email." });
    }
    if (password !== "admin123") {
      return res.status(401).json({ error: "Invalid password for Admin. [HINT: Use 'admin123']" });
    }
    return res.json({ success: true, user: adminUser });
  });

  // API Authentication - Registration / Signup
  app.post("/api/auth/register", (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Please provide all required fields (Name, Email, Password)." });
    }

    if (role === "admin") {
      return res.status(403).json({ error: "Access Denied. Administrator accounts cannot be created via public registration." });
    }

    const emailTrimmed = email.trim().toLowerCase();
    const exists = db.users.find(u => u.email.toLowerCase() === emailTrimmed);
    if (exists) {
      return res.status(400).json({ error: "A user with this email address already exists." });
    }

    const newUser: User = {
      id: "u-" + Math.floor(Math.random() * 100000),
      name: name.trim(),
      email: emailTrimmed,
      role: role || "student",
      password: password
    };

    db.users.push(newUser);
    saveDB();

    res.json({ success: true, user: newUser });
  });

  // API Events - Read
  app.get("/api/events", (req, res) => {
    res.json(db.events);
  });

  // API Organizers - Read
  app.get("/api/organizers", (req, res) => {
    const organizers = db.users.filter(u => u.role === "organizer");
    res.json(organizers);
  });

  // API Organizers - Delete
  app.delete("/api/organizers/:id", (req, res) => {
    const userRole = req.headers["x-user-role"] || req.headers["X-User-Role"] || req.headers["x_user_role"];
    const { id } = req.params;

    if (userRole !== "admin") {
      return res.status(403).json({ error: "Access Denied. Only admins can delete Event Organizers." });
    }

    const orgExists = db.users.find(u => u.id === id && u.role === "organizer");
    if (!orgExists) {
      return res.status(404).json({ error: "Event Organizer not found." });
    }

    // Delete organizer from users list
    db.users = db.users.filter(u => u.id !== id);

    // Safely migrate assigned events to admin (Professor Tariq) so they don't break
    db.events = db.events.map(ev => {
      if (ev.organizerId === id) {
        return {
          ...ev,
          organizerId: "u-admin",
          organizerName: "Professor Tariq (Admin)"
        };
      }
      return ev;
    });

    saveDB();
    res.json({ success: true });
  });

  // API Events - Create
  app.post("/api/events", (req, res) => {
    const userRole = req.headers["x-user-role"];
    if (userRole !== "admin") {
      return res.status(403).json({ error: "Access Denied. Only administrative level accounts can create events." });
    }

    const { title, category, date, startTime, endTime, venue, organizerId } = req.body;

    if (!title || !category || !date || !startTime || !endTime || !venue || !organizerId) {
      return res.status(400).json({ error: "All event form fields (Name, Category, Date, Start Time, End Time, Location, Organizer) are required." });
    }

    // Time Clash Detection
    const clash = db.events.find(e => {
      // Must be on same date and same location
      return e.date === date && e.venue === venue && timesOverlap(startTime, endTime, e.startTime || "", e.endTime || "");
    });

    if (clash) {
      return res.status(409).json({
        error: "Time Clash Detected. Please select another time."
      });
    }

    const organizerUser = db.users.find(u => u.id === organizerId);
    const organizerName = organizerUser ? organizerUser.name : "Dr. Farah Naz";

    const newEvent: Event = {
      id: "ev-" + Math.floor(Math.random() * 100000),
      title: title.trim(),
      category,
      date,
      startTime,
      endTime,
      venue,
      description: "",
      time: `${startTime} - ${endTime}`,
      status: "approved", 
      speaker: "",
      organizerId: organizerId,
      organizerName: organizerName,
      capacity: 100,
      image: "",
      schedule: [],
      resources: []
    };

    db.events.push(newEvent);
    saveDB();

    res.json({ success: true, event: newEvent });
  });

  // API Events - Update
  app.put("/api/events/:id", (req, res) => {
    const userRole = req.headers["x-user-role"];
    if (userRole !== "admin") {
      return res.status(403).json({ error: "Access Denied. Only administrative level accounts can update events." });
    }

    const { id } = req.params;
    const { title, category, date, startTime, endTime, venue, organizerId } = req.body;

    const eventIndex = db.events.findIndex(e => e.id === id);
    if (eventIndex === -1) {
      return res.status(404).json({ error: "Event not found." });
    }

    if (!title || !category || !date || !startTime || !endTime || !venue || !organizerId) {
      return res.status(400).json({ error: "All event form fields are required." });
    }

    // Clash detection excluding the current event
    const clash = db.events.find(e => {
      return e.id !== id && e.date === date && e.venue === venue && timesOverlap(startTime, endTime, e.startTime || "", e.endTime || "");
    });

    if (clash) {
      return res.status(409).json({
        error: "Time Clash Detected. Please select another time."
      });
    }

    const organizerUser = db.users.find(u => u.id === organizerId);
    const organizerName = organizerUser ? organizerUser.name : "Dr. Farah Naz";

    const updatedEvent = {
      ...db.events[eventIndex],
      title: title.trim(),
      category,
      date,
      startTime,
      endTime,
      venue,
      organizerId,
      organizerName,
      time: `${startTime} - ${endTime}`
    };

    db.events[eventIndex] = updatedEvent;
    
    // Push alert notification to all participants registered for this event
    const registered = db.registrations.filter(r => r.eventId === id);
    registered.forEach(reg => {
      db.notifications.push({
        id: "nt-" + Math.floor(Math.random() * 100000),
        userId: reg.studentId,
        title: "Event Updated",
        message: `The event '${title.trim()}' has been updated. Please verify location/schedules.`,
        date: new Date().toISOString(),
        type: "alert",
        read: false
      });
    });

    saveDB();

    res.json({ success: true, event: updatedEvent });
  });

  // API Events - Delete
  app.delete("/api/events/:id", (req, res) => {
    const userRole = req.headers["x-user-role"] || req.headers["X-User-Role"] || req.headers["x_user_role"];
    const { id } = req.params;
    console.log(`[DELETE /api/events/${id}] Requested by user role:`, userRole);

    if (userRole !== "admin") {
      console.warn(`[DELETE /api/events/${id}] Access Denied. User role: "${userRole}" is not "admin".`);
      return res.status(403).json({ error: "Access Denied. Only administrative level accounts can delete events." });
    }

    const beforeCount = db.events.length;
    db.events = db.events.filter(e => e.id !== id);
    db.registrations = db.registrations.filter(r => r.eventId !== id);
    saveDB();

    console.log(`[DELETE /api/events/${id}] Success. Cleaned up associated registries. Event count ${beforeCount} -> ${db.events.length}`);
    res.json({ success: true });
  });

  // API Registrations - Read
  app.get("/api/registrations", (req, res) => {
    const { studentId, eventId } = req.query;
    let list = db.registrations;
    if (studentId) {
      list = list.filter(r => r.studentId === studentId);
    }
    if (eventId) {
      list = list.filter(r => r.eventId === eventId);
    }
    res.json(list);
  });

  // API Registrations - Create
  app.post("/api/registrations", (req, res) => {
    const { eventId, studentName, studentEmail, studentId } = req.body;
    if (!eventId || !studentName || !studentEmail) {
      return res.status(400).json({ error: "Name, Email and Registered Event are required." });
    }

    const event = db.events.find(e => e.id === eventId);
    if (!event) {
      return res.status(404).json({ error: "Selected event does not exist." });
    }

    // Check duplicate
    const normalizedEmail = studentEmail.trim().toLowerCase();
    const duplicate = db.registrations.find(
      r => r.eventId === eventId && (r.studentEmail?.toLowerCase() === normalizedEmail || (studentId && r.studentId === studentId))
    );

    if (duplicate) {
      return res.status(409).json({ error: "Already registered for this event." });
    }

    const newReg: Registration = {
      id: "REG-" + Math.floor(1000 + Math.random() * 9000),
      eventId,
      eventTitle: event.title,
      eventDate: event.date,
      studentId: studentId || "temp-" + Math.floor(Math.random() * 100000),
      studentName: studentName.trim(),
      studentRoll: "-",
      studentDept: "-",
      dateRegistered: new Date().toISOString(),
      attendanceStatus: "unmarked"
    };

    db.registrations.push(newReg);

    // Save dynamic notification
    const targetUserId = studentId || newReg.studentId;
    db.notifications.push({
      id: "nt-" + Math.floor(Math.random() * 100000),
      userId: targetUserId,
      title: "Registration Successful",
      message: `Successfully registered for ${event.title}!`,
      date: new Date().toISOString(),
      type: "success",
      read: false
    });

    saveDB();

    res.json({ success: true, registration: newReg });
  });

  // API Attendance - Mark Status
  app.put("/api/registrations/:id/attendance", (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // "present" | "absent" | "unmarked"

    if (!status || !["present", "absent", "unmarked"].includes(status)) {
      return res.status(400).json({ error: "Attendance status must be present or absent." });
    }

    const regIndex = db.registrations.findIndex(r => r.id === id);
    if (regIndex === -1) {
      return res.status(404).json({ error: "Registration record not found." });
    }

    db.registrations[regIndex].attendanceStatus = status as any;
    saveDB();

    res.json({ success: true, registration: db.registrations[regIndex] });
  });

  // API Notifications - Feed
  app.get("/api/notifications", (req, res) => {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "userId query param required" });
    }
    const list = db.notifications.filter(n => n.userId === userId);
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json(list);
  });

  // API Organizers - Send Notification to participants of an event
  app.post("/api/notifications/organizer-send", (req, res) => {
    const { eventId, title, message } = req.body;
    if (!eventId || !title || !message) {
      return res.status(400).json({ error: "Event, Notification Title, and Message are required." });
    }

    const registeredStudents = db.registrations.filter(r => r.eventId === eventId);
    if (registeredStudents.length === 0) {
      return res.status(400).json({ error: "No participants registered for this event yet." });
    }

    registeredStudents.forEach(reg => {
      db.notifications.push({
        id: "nt-" + Math.floor(Math.random() * 100000),
        userId: reg.studentId,
        title: title.trim(),
        message: message.trim(),
        date: new Date().toISOString(),
        type: "info",
        read: false
      });
    });

    saveDB();
    res.json({ success: true, count: registeredStudents.length });
  });

  // API Feedbacks, Certificates, Resources, Reports (Unused mock bypass fallback endpoints to keep legacy imports from crashing)
  app.get("/api/resources", (req, res) => res.json([]));
  app.get("/api/feedback", (req, res) => res.json([]));
  app.post("/api/feedback", (req, res) => res.json({ success: true }));
  app.get("/api/certificates", (req, res) => res.json([]));
  app.get("/api/admin/system-report", (req, res) => res.json({
    metrics: {
      totalUsers: db.users.length,
      totalStudents: db.users.filter(u => u.role === "student").length,
      totalEvents: db.events.length,
      totalRegistrations: db.registrations.length
    },
    categoryDistribution: [],
    ratingsSummary: [],
    eventRegStats: []
  }));

  // Serve static files / dev middleware builder
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[MAJU Event System Engine] Listening on http://localhost:${PORT}`);
  });
}

startServer();
