/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext.js";
import { Calendar, Clock, MapPin, Bell, Send, Users, CheckCircle, XCircle } from "lucide-react";

export default function OrganizerDashboard() {
  const { currentUser, events, registrations, updateAttendance, sendOrganizerNotification, fetchData } = useApp();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Sync latest events and assignment on startup
  React.useEffect(() => {
    fetchData();
  }, []);
  
  // Notification Form State
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMsg, setNotifMsg] = useState("");
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [notifFeedback, setNotifFeedback] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400">Please sign in to access the Event Organizer Panel.</p>
      </div>
    );
  }

  // Filter events managed by this organizer
  const myEvents = events.filter((e) => e.organizerId === currentUser.id);
  const activeEventId = selectedEventId || (myEvents.length > 0 ? myEvents[0].id : null);
  const activeEvent = events.find((e) => e.id === activeEventId);

  // Filter registrations for active event
  const activeRegistrations = registrations.filter((r) => r.eventId === activeEventId);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEventId) return;
    if (!notifTitle.trim() || !notifMsg.trim()) {
      alert("Please fill in both the title and the message.");
      return;
    }

    setIsSendingNotif(true);
    setNotifFeedback(null);

    const result = await sendOrganizerNotification(activeEventId, notifTitle, notifMsg);
    setIsSendingNotif(false);

    if (result.success) {
      setNotifFeedback("Notification broadcasted successfully!");
      setNotifTitle("");
      setNotifMsg("");
      setTimeout(() => setNotifFeedback(null), 4000);
    } else {
      setNotifFeedback(result.error || "Failed broadcasting notifications.");
    }
  };

  const handleMarkAttendance = async (regId: string, status: "present" | "absent") => {
    await updateAttendance(regId, status);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-left space-y-8">
      {/* Welcome Banner */}
      <div className="bg-slate-900 border border-sky-950 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block font-mono">
            Event Management Wing
          </span>
          <h1 className="text-2xl font-extrabold text-white">Event Organizer Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Logged In: <strong className="text-slate-200">{currentUser.name}</strong> ({currentUser.email})
          </p>
        </div>
      </div>

      {myEvents.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-dashed border-sky-950 rounded-xl">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Assigned Events</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Contact the University Administrator to assign schedules/events to your profile.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Events List Selector */}
          <div className="md:col-span-4 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              My Assigned Events ({myEvents.length})
            </h2>
            <div className="divide-y divide-sky-950/45 border border-sky-950/60 rounded-xl overflow-hidden bg-slate-900">
              {myEvents.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => setSelectedEventId(ev.id)}
                  className={`w-full text-left p-4 transition-all block ${
                    activeEventId === ev.id
                      ? "bg-sky-950/40 border-l-4 border-sky-500"
                      : "hover:bg-slate-850/20 border-l-4 border-transparent"
                  }`}
                >
                  <h3 className="text-sm font-bold text-white leading-snug">{ev.title}</h3>
                  <div className="text-[11px] text-slate-400 mt-1 space-y-0.5">
                    <p className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-sky-400" />
                      {ev.date}
                    </p>
                    <p className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-sky-400" />
                      {ev.startTime} - {ev.endTime}
                    </p>
                    <p className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-sky-400" />
                      {ev.venue}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Event detail, Attendance marker, Broadcast Alerts */}
          {activeEvent && (
            <div className="md:col-span-8 space-y-6">
              
              {/* Event Header Panel */}
              <div className="bg-slate-900 border border-sky-950/80 p-5 rounded-2xl space-y-2">
                <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-400 text-[10px] font-bold uppercase tracking-wider border border-sky-900">
                  {activeEvent.category}
                </span>
                <h2 className="text-xl font-bold text-white">{activeEvent.title}</h2>
                <div className="grid grid-cols-3 gap-3 pt-2 text-xs border-t border-sky-955/25 text-slate-350">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Date</span>
                    <strong>{activeEvent.date}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Timings</span>
                    <strong>{activeEvent.startTime} - {activeEvent.endTime}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Location</span>
                    <strong>{activeEvent.venue}</strong>
                  </div>
                </div>
              </div>

              {/* Attendance Tracking Table section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-400" />
                    Participant Attendance Tracker ({activeRegistrations.length} registered)
                  </h3>
                </div>

                {activeRegistrations.length === 0 ? (
                  <div className="text-center py-10 bg-slate-900/60 border border-dashed border-sky-955/25 rounded-xl">
                    <p className="text-xs text-slate-500 italic">No registrations for this event yet.</p>
                  </div>
                ) : (
                  <div className="border border-sky-950 rounded-xl overflow-hidden bg-slate-900">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-sky-950">
                          <tr>
                            <th className="px-4 py-3">Participant Name</th>
                            <th className="px-4 py-3">Event</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-right">Activity Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-sky-955/10">
                          {activeRegistrations.map((reg) => (
                            <tr key={reg.id} className="hover:bg-slate-850/15 transition-all">
                              <td className="px-4 py-3.5">
                                <p className="font-bold text-white">{reg.studentName}</p>
                              </td>
                              <td className="px-4 py-3.5 text-slate-300">
                                {activeEvent.category}
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                  reg.attendanceStatus === "present"
                                    ? "bg-emerald-950/80 text-emerald-450 text-emerald-400 border-emerald-900"
                                    : reg.attendanceStatus === "absent"
                                    ? "bg-rose-950/80 text-rose-450 text-rose-400 border-rose-900"
                                    : "bg-slate-950 text-slate-500 border-sky-955/25"
                                }`}>
                                  {reg.attendanceStatus || "Unmarked"}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <div className="inline-flex gap-2">
                                  <button
                                    onClick={() => handleMarkAttendance(reg.id, "present")}
                                    className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                                      reg.attendanceStatus === "present"
                                        ? "bg-emerald-600 text-white"
                                        : "bg-slate-950 border border-emerald-900 text-emerald-400 hover:bg-emerald-950/40"
                                    }`}
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                    Present
                                  </button>
                                  <button
                                    onClick={() => handleMarkAttendance(reg.id, "absent")}
                                    className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                                      reg.attendanceStatus === "absent"
                                        ? "bg-rose-600 text-white"
                                        : "bg-slate-950 border border-rose-900 text-rose-400 hover:bg-rose-950/40"
                                    }`}
                                  >
                                    <XCircle className="w-3 h-3" />
                                    Absent
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Simple Notifications Dispatcher Form */}
              <div className="bg-slate-900 border border-sky-950 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-sky-400" />
                  Broadcast Notification to Registered Participants
                </h3>
                <p className="text-xs text-slate-400">
                  Sends an instant, custom alert to the notification feed of all current participants of this event.
                </p>

                <form onSubmit={handleSendNotification} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1 font-mono">
                      Alert Title
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-sky-955/35 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-sky-500 text-white"
                      placeholder="e.g. Workshop Room Relocated / Timings Updated"
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1 font-mono">
                      Detailed Message
                    </label>
                    <textarea
                      rows={3}
                      className="w-full bg-slate-950 border border-sky-955/35 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-sky-500 text-white"
                      placeholder="Type the announcement details here..."
                      value={notifMsg}
                      onChange={(e) => setNotifMsg(e.target.value)}
                      required
                    />
                  </div>

                  {notifFeedback && (
                    <div className="text-xs text-sky-400 font-bold bg-sky-950/40 p-2.5 rounded-lg border border-sky-900">
                      {notifFeedback}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSendingNotif}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 transition text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSendingNotif ? "Broadcasting..." : "Broadcast Alert"}
                  </button>
                </form>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
