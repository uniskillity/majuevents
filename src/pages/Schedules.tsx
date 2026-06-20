/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext.js";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle, 
  AlertTriangle, 
  LayoutList, 
  TrendingUp, 
  Bell, 
  X,
  Send,
  Loader2
} from "lucide-react";
import { Event } from "../types.js";

type ViewStyle = "timeline" | "table";

export default function Schedules() {
  const { 
    events, 
    currentUser, 
    registrations, 
    createEvent, 
    updateEvent, 
    deleteEvent, 
    registerForEvent,
    sendEventReminder 
  } = useApp();

  const [viewStyle, setViewStyle] = useState<ViewStyle>("timeline");
  
  // Registration Form Modal States
  const [registeringEvent, setRegisteringEvent] = useState<Event | null>(null);
  const [studentName, setStudentName] = useState("");
  const [studentRoll, setStudentRoll] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentDept, setStudentDept] = useState("");
  const [regStatus, setRegStatus] = useState<{ success?: boolean; error?: string } | null>(null);
  const [regSubmitting, setRegSubmitting] = useState(false);

  // Schedule Creator/Editor Modal States
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [schTitle, setSchTitle] = useState("");
  const [schCategory, setSchCategory] = useState<"Seminar" | "Workshop" | "Conference" | "Academic">("Seminar");
  const [schDate, setSchDate] = useState("");
  const [schTime, setSchTime] = useState("");
  const [schVenue, setSchVenue] = useState("");
  const [schSpeaker, setSchSpeaker] = useState("");
  const [schDesc, setSchDesc] = useState("");
  const [schCapacity, setSchCapacity] = useState(100);
  const [formStatus, setFormStatus] = useState<{ success?: boolean; error?: string } | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Send Reminder Status state
  const [reminderStatus, setReminderStatus] = useState<{ eventId: string; text: string; success: boolean } | null>(null);

  // Filter events to show approved ones, plus any proposed by current organizer
  const visibleSchedules = events.filter(e => {
    if (currentUser?.role === "organizer" && e.organizerId === currentUser.id) return true;
    if (currentUser?.role === "admin") return true;
    return e.status === "approved";
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Trigger Registration Form Opening
  const openRegistrationDialog = (event: Event) => {
    setRegisteringEvent(event);
    setStudentName(currentUser?.name || "");
    setStudentRoll(currentUser?.rollNumber || "");
    setStudentEmail(currentUser?.email || "");
    setStudentDept(currentUser?.department || "Computer Science");
    setRegStatus(null);
  };

  // Submit student's custom event registration form
  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registeringEvent) return;
    setRegSubmitting(true);
    setRegStatus(null);

    const details = {
      studentName,
      studentRoll,
      studentDept,
      studentEmail
    };

    const res = await registerForEvent(registeringEvent.id, details);
    if (res.success) {
      setRegStatus({ success: true });
      setTimeout(() => {
        setRegisteringEvent(null);
      }, 1500);
    } else {
      setRegStatus({ error: res.error || "An unknown error occurred during registration." });
    }
    setRegSubmitting(false);
  };

  // Handle schedule proposal/edit saving
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schTitle || !schDate || !schTime || !schVenue || !schSpeaker) {
      setFormStatus({ error: "Please fill out all required fields." });
      return;
    }

    setFormSubmitting(true);
    setFormStatus(null);

    const payload = {
      title: schTitle,
      category: schCategory,
      date: schDate,
      time: schTime,
      venue: schVenue,
      speaker: schSpeaker,
      description: schDesc || `Academic ${schCategory} focusing on core university research and industry insights led by ${schSpeaker}.`,
      capacity: Number(schCapacity),
      status: currentUser?.role === "admin" ? "approved" : "approved" // direct approve for easier schedule handling
    };

    try {
      if (editingScheduleId) {
        const res = await updateEvent(editingScheduleId, payload);
        if (res.success) {
          setFormStatus({ success: true });
          setTimeout(() => {
            setShowScheduleForm(false);
          }, 1000);
        } else {
          setFormStatus({ error: res.error || "Schedule conflict or clashing venue detected." });
        }
      } else {
        const res = await createEvent(payload);
        if (res.success) {
          setFormStatus({ success: true });
          setTimeout(() => {
            setShowScheduleForm(false);
          }, 1000);
        } else {
          setFormStatus({ error: res.error || "Venue conflict: Spatial room is booked for another schedule." });
        }
      }
    } catch {
      setFormStatus({ error: "Interrupted network handshake." });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOpenCreateForm = () => {
    setEditingScheduleId(null);
    setSchTitle("");
    setSchCategory("Seminar");
    setSchDate("2026-06-25");
    setSchTime("10:00 AM - 12:30 PM");
    setSchVenue("");
    setSchSpeaker("");
    setSchDesc("");
    setSchCapacity(80);
    setFormStatus(null);
    setShowScheduleForm(true);
  };

  const handleOpenEditForm = (item: Event) => {
    setEditingScheduleId(item.id);
    setSchTitle(item.title);
    setSchCategory(item.category);
    setSchDate(item.date);
    setSchTime(item.time);
    setSchVenue(item.venue);
    setSchSpeaker(item.speaker);
    setSchDesc(item.description || "");
    setSchCapacity(item.capacity);
    setFormStatus(null);
    setShowScheduleForm(true);
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!currentUser || currentUser.role !== "admin") {
      alert("Access Denied. Only authenticated admins have permission to delete event schedules.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this schedule item? Direct registered students will log alerts.")) {
      const result = await deleteEvent(id);
      if (!result.success) {
        alert(result.error || "Failed to delete slot.");
      }
    }
  };

  const handleTriggerReminder = async (eventId: string) => {
    const res = await sendEventReminder(eventId);
    if (res.success) {
      setReminderStatus({
        eventId,
        text: `Reminded ${res.count || 0} participants successfully via their dashboard panels!`,
        success: true
      });
    } else {
      setReminderStatus({
        eventId,
        text: res.error || "Failed loading participant registry.",
        success: false
      });
    }
    setTimeout(() => {
      setReminderStatus(null);
    }, 5000);
  };

  const isUserRegistered = (eventId: string) => {
    if (!currentUser) return false;
    return registrations.some(r => r.studentId === currentUser.id && r.eventId === eventId);
  };

  return (
    <div className="bg-slate-950 text-slate-105 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Banner */}
        <div className="relative overflow-hidden bg-slate-900 border border-sky-950 rounded-2xl p-6 lg:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl">
          <div className="space-y-2 text-left z-10">
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-emerald-400 block px-2.5 py-1 bg-emerald-950/45 border border-emerald-900/60 rounded-full w-max">
              UNIVERSITY CHRONOLOGY BOARD
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">University Academic Schedules</h1>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Real-time directory of conferences, professional seminars, subject workshops, and core class timetables. Track venues, speakers, and reserve seats in seconds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 z-10">
            {/* View Style Select button */}
            <div className="bg-slate-950 p-1 rounded-lg border border-sky-955 flex items-center">
              <button
                onClick={() => setViewStyle("timeline")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewStyle === "timeline" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Timeline Format
              </button>
              <button
                onClick={() => setViewStyle("table")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewStyle === "table" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                Table Format
              </button>
            </div>

            {/* Organizer Add Button */}
            {(currentUser?.role === "organizer" || currentUser?.role === "admin") && (
              <button
                onClick={handleOpenCreateForm}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-lg shadow-amber-500/10 transition"
              >
                <Plus className="w-4 h-4" />
                ADD SCHEDULE
              </button>
            )}
          </div>
        </div>

        {/* SCHEDULES MAIN AREA */}
        {visibleSchedules.length === 0 ? (
          <div className="text-center py-20 bg-slate-900 border border-dashed border-sky-950 rounded-2xl">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
            <h3 className="text-base font-bold text-slate-400 mt-4">No schedules booked</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">There are currently no active seminar, conference, class or workshop schedules listed.</p>
          </div>
        ) : (
          <>
            {/* TIMELINE VISUAL FORMAT */}
            {viewStyle === "timeline" && (
              <div className="relative border-l-2 border-slate-800 ml-4 lg:ml-12 text-left space-y-8 py-4">
                {visibleSchedules.map((item, idx) => {
                  const regCount = registrations.filter(r => r.eventId === item.id).length;
                  const registered = isUserRegistered(item.id);
                  const isPast = new Date(item.date) < new Date("2026-06-15");

                  return (
                    <div key={item.id} className="relative pl-6 lg:pl-10">
                      
                      {/* Timeline Dot Indicator */}
                      <span className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isPast 
                          ? "bg-slate-950 border-slate-700" 
                          : registered 
                          ? "bg-[#d97706] border-amber-500 animate-pulse" 
                          : "bg-slate-950 border-amber-650 border-amber-600"
                      }`} />

                      {/* Schedule Milestone Card */}
                      <div className="bg-slate-900 border border-sky-950/60 rounded-xl p-5 hover:border-sky-900/80 transition duration-150 shadow-md">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                          
                          {/* Left contents */}
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-mono text-amber-500 font-bold tracking-wider uppercase bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/30">
                                {item.category}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                Date ID: {item.date}
                              </span>
                              {item.status !== "approved" && (
                                <span className="text-[9px] font-mono text-amber-400 bg-amber-950/20 px-1.5 rounded uppercase font-bold">
                                  {item.status}
                                </span>
                              )}
                            </div>

                            <h3 className="text-base font-extrabold text-white">{item.title}</h3>
                            <p className="text-xs text-slate-400 line-clamp-1 max-w-2xl">{item.description}</p>
                            
                            {/* Schedule metadata badges */}
                            <div className="flex flex-wrap items-center gap-y-1.5 gap-x-5 text-slate-405 text-xs text-slate-400 pt-1.5 font-medium">
                              <div className="flex items-center gap-1.5 text-slate-400">
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                <span>{item.time}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-400">
                                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                <span>{item.venue}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-400">
                                <User className="w-3.5 h-3.5 text-slate-500" />
                                <span>Speaker: <strong className="text-slate-350 text-slate-300">{item.speaker}</strong></span>
                              </div>
                            </div>
                          </div>

                          {/* Right action container */}
                          <div className="flex flex-wrap items-center gap-2 mt-2 lg:mt-0 self-stretch lg:self-auto justify-end border-t lg:border-t-0 border-sky-955/20 pt-3 lg:pt-0">
                            {/* Reminder Status message inline */}
                            {reminderStatus?.eventId === item.id && (
                              <span className={`text-[11px] px-2.5 py-1 rounded inline-block select-none ${
                                reminderStatus.success ? "bg-emerald-950/50 text-emerald-400" : "bg-rose-950/50 text-rose-400"
                              }`}>
                                {reminderStatus.text}
                              </span>
                            )}

                            {/* Organizer controls (Edit/Delete) */}
                            {(currentUser?.role === "organizer" || currentUser?.role === "admin") && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleTriggerReminder(item.id)}
                                  title="Send instant notification reminder to all registrants"
                                  className="p-1.5 hover:bg-slate-950 bg-slate-900 border border-sky-955 text-sky-400 rounded-md hover:text-white transition"
                                >
                                  <Bell className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenEditForm(item)}
                                  className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-sky-950 text-slate-300 hover:text-white rounded transition"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                {currentUser?.role === "admin" && (
                                  <button
                                    onClick={() => handleDeleteSchedule(item.id)}
                                    className="p-1.5 bg-rose-950/35 border border-rose-900/40 text-rose-400 hover:bg-rose-900 hover:text-white rounded transition"
                                    title="Delete event schedule"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Participant Register actions */}
                            {currentUser?.role === "student" && (
                              registered ? (
                                <span className="px-3.5 py-1.5 bg-emerald-950/50 border border-emerald-900/60 text-emerald-400 text-xs font-bold rounded-lg flex items-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  ALREADY REGISTERED
                                </span>
                              ) : isPast ? (
                                <span className="text-[10px] text-slate-500 italic uppercase">Event Completed</span>
                              ) : (
                                <button
                                  onClick={() => openRegistrationDialog(item)}
                                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold rounded-lg tracking-wider shadow-md hover:scale-[1.01] active:scale-[0.99] transition"
                                >
                                  REGISTER SEAT
                                </button>
                              )
                            )}

                            {/* Not authentication flag */}
                            {!currentUser && (
                              <span className="text-xs text-slate-500 italic block">Sign in to register</span>
                            )}
                          </div>

                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

            {/* TABLE FORMAT VIEW */}
            {viewStyle === "table" && (
              <div className="bg-slate-900 border border-sky-950/70 rounded-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950/70 border-b border-sky-950 text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                        <th className="p-4 font-bold">Category</th>
                        <th className="p-4 font-bold">Initiative Event Name</th>
                        <th className="p-4 font-bold">Date</th>
                        <th className="p-4 font-bold">Time</th>
                        <th className="p-4 font-bold">Venue</th>
                        <th className="p-4 font-bold">Speakers</th>
                        <th className="p-4 text-right font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sky-955/20 divide-slate-800">
                      {visibleSchedules.map((item) => {
                        const registered = isUserRegistered(item.id);
                        const isPast = new Date(item.date) < new Date("2026-06-15");

                        return (
                          <tr key={item.id} className="hover:bg-slate-910/20 bg-slate-900/30 transition">
                            <td className="p-4">
                              <span className="px-2 py-0.5 rounded text-[9px] uppercase font-mono bg-amber-950/20 text-amber-500 border border-amber-900/30">
                                {item.category}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-white max-w-xs">
                              <p className="truncate block" title={item.title}>{item.title}</p>
                            </td>
                            <td className="p-4 text-slate-300 font-mono">{item.date}</td>
                            <td className="p-4 text-slate-300">{item.time}</td>
                            <td className="p-4 text-slate-300 max-w-[120px] truncate" title={item.venue}>{item.venue}</td>
                            <td className="p-4 font-semibold text-amber-400">{item.speaker}</td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                
                                {reminderStatus?.eventId === item.id && (
                                  <span className="text-[10px] text-emerald-400 mr-2">{reminderStatus.text}</span>
                                )}

                                {/* Organizer Actions in Table */}
                                {(currentUser?.role === "organizer" || currentUser?.role === "admin") && (
                                  <>
                                    <button
                                      onClick={() => handleTriggerReminder(item.id)}
                                      title="Send dashboard reminders to registrants"
                                      className="p-1 px-1.5 hover:bg-slate-950 border border-sky-955 rounded text-sky-400 font-mono text-[9px] uppercase transition"
                                    >
                                      Remind
                                    </button>
                                    <button
                                      onClick={() => handleOpenEditForm(item)}
                                      className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded text-[10px] font-semibold flex items-center gap-1 transition"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSchedule(item.id)}
                                      className="px-2 py-1 bg-rose-950/20 hover:bg-rose-900 text-rose-455 hover:text-white rounded text-[10px] font-bold text-rose-400 transition"
                                    >
                                      Delete
                                    </button>
                                  </>
                                )}

                                {/* Student Actions in Table */}
                                {currentUser?.role === "student" && (
                                  registered ? (
                                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 uppercase tracking-wider">
                                      <CheckCircle className="w-3 h-3" />
                                      Booked
                                    </span>
                                  ) : isPast ? (
                                    <span className="text-[10px] text-slate-505 text-slate-500 italic uppercase">Done</span>
                                  ) : (
                                    <button
                                      onClick={() => openRegistrationDialog(item)}
                                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-md hover:scale-105 transition tracking-wide uppercase text-[10px]"
                                    >
                                      Register
                                    </button>
                                  )
                                )}

                                {!currentUser && (
                                  <span className="text-[10px] text-slate-500 italic">Sign in</span>
                                )}

                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* =======================================================
            FORM 1: REGISTRATION MODAL WITH NAME, ROLL, EMAIL, DEPT
            ======================================================= */}
        {registeringEvent && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-sky-900 rounded-xl p-6 max-w-md w-full text-left space-y-4 shadow-2xl relative">
              
              <button
                onClick={() => setRegisteringEvent(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1.5 border-b border-sky-955/25 pb-3">
                <span className="text-[9px] font-mono tracking-widest text-amber-500 font-extrabold uppercase block">
                  ADMISSION ENROLLMENT FORM
                </span>
                <h3 className="text-base font-extrabold text-white">Event Seat Reservation</h3>
                <p className="text-[11px] text-slate-450 text-slate-400 leading-snug">
                  Please verify your credentials below to register for: <strong className="text-white">"{registeringEvent.title}"</strong>.
                </p>
              </div>

              <form onSubmit={handleRegistrationSubmit} className="space-y-4 pt-1">
                
                {regStatus && (
                  <div className={`p-3 rounded-lg text-xs leading-relaxed border ${
                    regStatus.success 
                      ? "bg-emerald-950/50 text-emerald-300 border-emerald-900" 
                      : "bg-rose-950/50 text-rose-300 border-rose-905"
                  }`}>
                    {regStatus.success ? (
                      <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        Seat booked successfully! Alert logs transmitted on dashboard.
                      </span>
                    ) : (
                      <span><strong>Registration Failed:</strong> {regStatus.error}</span>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[9.5px] uppercase font-semibold text-slate-400 font-mono tracking-wider">Student Name</label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Full academic name"
                    className="w-full px-3 py-2 bg-slate-950 border border-sky-950 rounded text-xs text-white uppercase focus:border-sky-500 focus:outline-hidden transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9.5px] uppercase font-semibold text-slate-400 font-mono tracking-wider">Roll Number</label>
                    <input
                      type="text"
                      required
                      value={studentRoll}
                      onChange={(e) => setStudentRoll(e.target.value)}
                      placeholder="e.g. SP23-BCS-0042"
                      className="w-full px-3 py-2 bg-slate-950 border border-sky-955 border-sky-950 rounded text-xs text-white uppercase focus:border-sky-500 focus:outline-hidden transition font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9.5px] uppercase font-semibold text-slate-400 font-mono tracking-wider">Department</label>
                    <select
                      value={studentDept}
                      onChange={(e) => setStudentDept(e.target.value)}
                      className="w-full px-2 py-2 bg-slate-950 border border-sky-950 rounded text-xs text-white focus:border-sky-550 focus:outline-hidden"
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="Management Sciences">Business Administration</option>
                      <option value="Electrical Engineering">Electrical Eng.</option>
                      <option value="Biomedical Science">Biomedical Sci.</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9.5px] uppercase font-semibold text-slate-400 font-mono tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="student@maju.edu"
                    className="w-full px-3 py-2 bg-slate-950 border border-sky-950 rounded text-xs text-white focus:border-sky-500 focus:outline-hidden transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={regSubmitting}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded font-bold text-xs tracking-wider transition shadow-lg shadow-amber-500/15"
                >
                  {regSubmitting ? "Validating Credentials..." : "CONFIRM FREE RESERVATION"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* =======================================================
            FORM 2: SCHEDULE MANAGER CREATOR/EDITOR FORM (MODAL)
            ======================================================= */}
        {showScheduleForm && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-sky-900 rounded-xl p-6 max-w-md w-full text-left space-y-4 shadow-2xl relative my-10">
              
              <button
                onClick={() => setShowScheduleForm(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <span className="text-[9px] font-mono tracking-widest text-[#d97706] text-amber-505 text-amber-500 block uppercase font-bold">
                  SCHEDULES & TIMESLOT PIPELINE
                </span>
                <h3 className="text-base font-extrabold text-white">
                  {editingScheduleId ? "Edit Timetable Schedule Record" : "Add New Timetable Schedule"}
                </h3>
              </div>

              <form onSubmit={handleScheduleSubmit} className="space-y-4 pt-1">
                
                {formStatus && (
                  <div className={`p-3 rounded border text-xs leading-relaxed ${
                    formStatus.success 
                      ? "bg-emerald-950/60 text-emerald-300 border-emerald-900" 
                      : "bg-rose-950/60 text-rose-300 border-rose-900"
                  }`}>
                    {formStatus.success ? (
                      <span>Schedule saved and published to timeline board successfully!</span>
                    ) : (
                      <span><strong>Schedule Block Clashed:</strong> {formStatus.error}</span>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[9.5px] uppercase font-semibold text-slate-400 font-mono tracking-wider">Schedule Name / Title of Event</label>
                  <input
                    type="text"
                    required
                    value={schTitle}
                    onChange={(e) => setSchTitle(e.target.value)}
                    placeholder="e.g. Guest Seminar on Cyber Cryptography"
                    className="w-full px-3 py-2 bg-slate-950 border border-sky-950 rounded text-xs text-white focus:border-sky-550 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[9.5px] uppercase font-semibold text-slate-400 font-mono tracking-wider font-mono">Date</label>
                    <input
                      type="date"
                      required
                      value={schDate}
                      onChange={(e) => setSchDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-sky-955 border-sky-950 rounded text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9.5px] uppercase font-semibold text-slate-400 font-mono tracking-wider">Hours Range</label>
                    <input
                      type="text"
                      required
                      value={schTime}
                      onChange={(e) => setSchTime(e.target.value)}
                      placeholder="e.g. 10:00 AM - 12:30 PM"
                      className="w-full px-3 py-2 bg-slate-950 border border-sky-950 rounded text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[9.5px] uppercase font-semibold text-slate-400 font-mono tracking-wider">Specified Venue</label>
                    <input
                      type="text"
                      required
                      value={schVenue}
                      onChange={(e) => setSchVenue(e.target.value)}
                      placeholder="e.g. Auditorium Hall B"
                      className="w-full px-3 py-2 bg-slate-950 border border-sky-950 rounded text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9.5px] uppercase font-semibold text-slate-400 font-mono tracking-wider">Category</label>
                    <select
                      value={schCategory}
                      onChange={(e) => setSchCategory(e.target.value as any)}
                      className="w-full px-2 py-2 bg-slate-950 border border-sky-950 rounded text-xs text-white"
                    >
                      <option value="Seminar">Seminar</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Conference">Conference</option>
                      <option value="Academic">Academic Class</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[9.5px] uppercase font-semibold text-slate-400 font-mono tracking-wider">Nominated Speaker</label>
                    <input
                      type="text"
                      required
                      value={schSpeaker}
                      onChange={(e) => setSchSpeaker(e.target.value)}
                      placeholder="Full Name"
                      className="w-full px-3 py-2 bg-slate-950 border border-sky-955 border-sky-950 rounded text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9.5px] uppercase font-semibold text-slate-400 font-mono tracking-wider">Default Seating Cap</label>
                    <input
                      type="number"
                      value={schCapacity}
                      onChange={(e) => setSchCapacity(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-sky-950 rounded text-xs text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9.5px] uppercase font-slate-400 font-mono tracking-wider">Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={schDesc}
                    onChange={(e) => setSchDesc(e.target.value)}
                    placeholder="Brief agenda parameters..."
                    className="w-full px-3 py-2 bg-slate-950 border border-sky-955 border-sky-950 rounded text-xs text-white text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded font-bold text-xs tracking-wider transition shadow-lg shadow-amber-500/15"
                >
                  {formSubmitting ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Synchronizing Timeslots...
                    </span>
                  ) : (
                    editingScheduleId ? "SAVE REVISED SCHEDULE" : "PUBLISH UNIVERSITY SCHEDULE"
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
