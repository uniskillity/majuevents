/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React from "react";
import { useApp } from "../context/AppContext.js";
import { Calendar, Bell, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export default function StudentDashboard() {
  const { registrations, notifications, currentUser, markNotificationsAsRead, events } = useApp();

  if (!currentUser) {
    return (
      <div className="bg-slate-950 min-h-screen text-slate-100 py-20 flex flex-col justify-center items-center text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 animate-bounce" />
        <h3 className="text-lg font-bold text-white mt-4">Session Inactive</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
          Please log in on the Sign In page to access your Participant Panel.
        </p>
      </div>
    );
  }

  // Calculate my registered registrations
  const myRegistrations = registrations.filter(r => r.studentId === currentUser.id);
  const presentCount = myRegistrations.filter(r => r.attendanceStatus === "present").length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-left space-y-8">
      
      {/* Participant Banner */}
      <div className="bg-slate-900 border border-sky-955 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-sky-450 text-sky-400 uppercase tracking-widest block font-mono">Student & Participant Hub</span>
          <h1 className="text-2xl font-extrabold text-white">Participant Panel</h1>
          <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-4 font-mono">
            <span>Name: <strong className="text-slate-200">{currentUser.name}</strong></span>
            <span>Email: <strong className="text-slate-200">{currentUser.email}</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-slate-950 px-4 py-2 border border-sky-955/20 rounded-lg">
            <span className="text-[9px] text-slate-500 block uppercase font-mono font-bold">Registered</span>
            <span className="text-lg font-bold text-white block">{myRegistrations.length}</span>
          </div>
          <div className="bg-slate-950 px-4 py-2 border border-sky-955/20 rounded-lg">
            <span className="text-[9px] text-slate-500 block uppercase font-mono font-bold">Present</span>
            <span className="text-lg font-bold text-emerald-400 block">{presentCount}</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: My Registrations & Attendance tracking */}
        <div className="md:col-span-8 space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-sky-955/20 pb-2">My Attendance Status</h2>
            
            {myRegistrations.length === 0 ? (
              <div className="text-center py-12 bg-slate-900 border border-dashed border-sky-950/60 rounded-xl">
                <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">You haven't registered for any events yet.</p>
                <p className="text-xs text-slate-500 mt-1">Visit the Home tab to browse events and sign up.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myRegistrations.map((reg) => (
                  <div 
                    key={reg.id} 
                    className="bg-slate-900 border border-sky-955/20 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 block">REGISTRATION NO: {reg.id}</span>
                      <h3 className="text-sm font-bold text-white mt-0.5">{reg.eventTitle}</h3>
                      <p className="text-xs text-slate-400 mt-1">Date scheduled: {reg.eventDate}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-mono">My Attendance Status:</span>
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold border tracking-wider uppercase ${
                        reg.attendanceStatus === "present"
                          ? "bg-emerald-950/80 text-emerald-400 border-emerald-900"
                          : reg.attendanceStatus === "absent"
                          ? "bg-rose-950/80 text-rose-450 text-rose-400 border-rose-900"
                          : "bg-slate-950 text-slate-400 border-sky-955/20"
                      }`}>
                        {reg.attendanceStatus === "present" && "✓ "}
                        {reg.attendanceStatus === "absent" && "✗ "}
                        {reg.attendanceStatus ? reg.attendanceStatus : "Unmarked"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Simple Schedules Table */}
          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-bold text-white border-b border-sky-955/20 pb-2">Campus Event Schedules</h2>
            
            {events.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No events scheduled currently.</p>
            ) : (
              <div className="border border-sky-955/15 rounded-xl overflow-hidden bg-slate-900">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-sky-955/10">
                      <tr>
                        <th className="px-4 py-3">Event Name</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Start Time</th>
                        <th className="px-4 py-3">End Time</th>
                        <th className="px-4 py-3">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sky-955/10">
                      {events.map((ev) => (
                        <tr key={ev.id} className="hover:bg-slate-850/15">
                          <td className="px-4 py-3.5 font-bold text-white">{ev.title}</td>
                          <td className="px-4 py-3.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-sky-950 text-sky-400 border border-sky-900/40">
                              {ev.category}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-300 font-mono">{ev.date}</td>
                          <td className="px-4 py-3.5 text-slate-300 font-mono">{ev.startTime}</td>
                          <td className="px-4 py-3.5 text-slate-300 font-mono">{ev.endTime}</td>
                          <td className="px-4 py-3.5 font-semibold text-emerald-450 text-emerald-400">{ev.venue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Participant Notifications log panel */}
        <div className="md:col-span-4 space-y-4">
          <div className="flex justify-between items-center border-b border-sky-955/20 pb-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-sky-400" />
              Notifications
            </h2>
            {notifications.length > 0 && (
              <button 
                onClick={() => markNotificationsAsRead()}
                className="text-[10px] text-sky-405 text-sky-400 hover:underline font-mono"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="text-center py-8 bg-slate-900/50 border border-sky-955/10 rounded-lg">
                <p className="text-xs text-slate-500 italic">No alerts logged</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id}
                  className="bg-slate-900 border border-sky-955/15 p-4 rounded-lg text-xs space-y-1 relative"
                >
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                    <span>{new Date(notif.date).toLocaleDateString()}</span>
                    {!notif.read && <span className="h-1.5 w-1.5 bg-sky-500 rounded-full" />}
                  </div>
                  <h4 className="font-bold text-white">{notif.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{notif.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
