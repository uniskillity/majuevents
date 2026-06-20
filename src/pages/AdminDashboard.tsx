/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext.js";
import { Calendar, Clock, MapPin, Plus, Trash2, Edit, Users, X, CheckCircle, AlertOctagon } from "lucide-react";

const VENUES = ["Hall A", "Hall B", "Conference Room", "Computer Lab", "Auditorium"];

const INSTITUTIONAL_ORGANIZERS = [
  { id: "u-org1", name: "Dr. Farah Naz" },
  { id: "u-org2", name: "Dr. Asim Imdad" },
  { id: "u-org3", name: "Prof. Maria Qamar" }
];

export default function AdminDashboard() {
  const { currentUser, events, createEvent, updateEvent, deleteEvent, deleteOrganizer, registrations, updateAttendance, organizers } = useApp();
  
  const [activeSubTab, setActiveSubTab] = useState<"events" | "organizers">("events");

  // Modal / Form States
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [organizerToDelete, setOrganizerToDelete] = useState<string | null>(null);
  
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("Seminar");
  const [formDate, setFormDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("10:00");
  const [formEndTime, setFormEndTime] = useState("12:00");
  const [formVenue, setFormVenue] = useState("");
  const [formOrganizerId, setFormOrganizerId] = useState("u-org1");
  
  // Roster section toggling
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Parse time keys for overlap checking
  const parseTimeToMinutes = (t: string): number => {
    if (!t) return 0;
    const parts = t.split(":");
    if (parts.length >= 2) {
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    return 0;
  };

  const overlaps = (start1: string, end1: string, start2: string, end2: string): boolean => {
    const s1 = parseTimeToMinutes(start1);
    const e1 = parseTimeToMinutes(end1);
    const s2 = parseTimeToMinutes(start2);
    const e2 = parseTimeToMinutes(end2);
    return Math.max(s1, s2) < Math.min(e1, e2);
  };

  // Dynamically filter available locations for the admin dropdown selector
  const getAvailableVenues = (): string[] => {
    if (!formDate || !formStartTime || !formEndTime) {
      return VENUES;
    }

    const takenVenues = events
      .filter((ev) => {
        // Exclude current modified event
        if (editingEventId && ev.id === editingEventId) return false;
        
        return (
          ev.date === formDate &&
          overlaps(formStartTime, formEndTime, ev.startTime || "", ev.endTime || "")
        );
      })
      .map((ev) => ev.venue);

    return VENUES.filter((v) => !takenVenues.includes(v));
  };

  const availableVenues = getAvailableVenues();

  const openAddModal = () => {
    setEditingEventId(null);
    setFormTitle("");
    setFormCategory("Seminar");
    setFormDate("");
    setFormStartTime("10:00");
    setFormEndTime("12:00");
    setFormVenue("");
    setFormOrganizerId(organizers && organizers.length > 0 ? organizers[0].id : "u-org1");
    setShowFormModal(true);
  };

  const openEditModal = (event: any) => {
    setEditingEventId(event.id);
    setFormTitle(event.title);
    setFormCategory(event.category);
    setFormDate(event.date);
    setFormStartTime(event.startTime || "10:00");
    setFormEndTime(event.endTime || "12:00");
    setFormVenue(event.venue);
    setFormOrganizerId(event.organizerId || (organizers && organizers.length > 0 ? organizers[0].id : "u-org1"));
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim() || !formCategory || !formDate || !formStartTime || !formEndTime || !formVenue) {
      alert("Please enter all required information.");
      return;
    }

    // Time Clash Detection Check
    const clash = events.find((ev) => {
      // Ignore herself
      if (editingEventId && ev.id === editingEventId) return false;
      return (
        ev.date === formDate &&
        ev.venue === formVenue &&
        overlaps(formStartTime, formEndTime, ev.startTime || "", ev.endTime || "")
      );
    });

    if (clash) {
      alert("Time Clash Detected. Please select another time.");
      return;
    }

    const payload = {
      title: formTitle.trim(),
      category: formCategory as any,
      date: formDate,
      startTime: formStartTime,
      endTime: formEndTime,
      venue: formVenue,
      organizerId: formOrganizerId,
    };

    let result;
    if (editingEventId) {
      result = await updateEvent(editingEventId, payload);
    } else {
      result = await createEvent(payload);
    }

    if (result.success) {
      setShowFormModal(false);
    } else {
      alert(result.error || "Failed storing event credentials.");
    }
  };

  const handleDeleteClick = async (eventId: string) => {
    if (!currentUser || currentUser.role !== "admin") {
      alert("Access Denied. Only authenticated administrative users have delete permissions.");
      return;
    }
    if (confirm("Are you sure you want to delete this event?")) {
      const result = await deleteEvent(eventId);
      if (!result.success) {
        alert(result.error || "Failed to delete slot.");
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-left space-y-8">
      
      {/* Welcome & Command bar */}
      <div className="bg-slate-900 border border-sky-955 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest block font-mono">Administration Desk</span>
          <h1 className="text-2xl font-extrabold text-white">Event Coordinator Panel</h1>
          <p className="text-xs text-slate-400 mt-1">
            Publish academic seminars, organize campus workshops, and resolve schedule/location availability.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold uppercase transition flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>

      {/* Sub-Tabs navigation */}
      <div className="flex border-b border-sky-955/25 pb-px gap-6 font-sans">
        <button
          onClick={() => setActiveSubTab("events")}
          className={`pb-3 px-1 text-xs font-bold uppercase tracking-wider transition duration-150 border-b-2 relative -bottom-[1px] ${
            activeSubTab === "events"
              ? "border-sky-500 text-sky-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Manage Scheduled Events
        </button>
        <button
          onClick={() => setActiveSubTab("organizers")}
          className={`pb-3 px-1 text-xs font-bold uppercase tracking-wider transition duration-150 border-b-2 relative -bottom-[1px] ${
            activeSubTab === "organizers"
              ? "border-sky-500 text-sky-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Manage Event Organizers ({organizers?.length || 0})
        </button>
      </div>

      {/* Events list */}
      {activeSubTab === "events" && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white border-b border-sky-955/20 pb-2">Active Scheduled Events</h2>
          
          {events.length === 0 ? (
            <div className="text-center py-16 bg-slate-900 border border-dashed border-sky-950/60 rounded-2xl">
              <Calendar className="w-10 h-10 text-slate-650 mb-3 mx-auto" />
              <p className="text-slate-400 text-sm">No scheduled events logged yet. Create your first slot above!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {events.map((ev) => {
                const eventRegs = registrations.filter(r => r.eventId === ev.id);
                const isExpanded = expandedEventId === ev.id;
                const org = INSTITUTIONAL_ORGANIZERS.find(o => o.id === ev.organizerId) || 
                            (ev.organizerId === "u-admin" ? { name: "Professor Tariq (Admin)" } : { name: ev.organizerName || "Dr. Farah Naz" });

                return (
                  <div 
                    key={ev.id}
                    className="bg-slate-900 border border-sky-955/20 rounded-xl overflow-hidden hover:border-sky-500/20 transition"
                  >
                    <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-sky-950 text-sky-400 border border-sky-900 rounded text-[9px] font-semibold uppercase tracking-wider">
                            {ev.category}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">ID: {ev.id}</span>
                        </div>
                        
                        <h3 className="text-base font-bold text-white">{ev.title}</h3>
                        
                        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400 font-mono">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            {ev.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            {ev.startTime} - {ev.endTime}
                          </span>
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            {ev.venue}
                          </span>
                          <span className="text-sky-300 font-medium font-sans">
                            Organizer: {org.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        <button
                          onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                            isExpanded 
                              ? "bg-slate-950 border border-sky-500/40 text-sky-400" 
                              : "bg-slate-950 text-slate-300 border border-sky-955/30 hover:border-slate-800"
                          }`}
                        >
                          <Users className="w-3.5 h-3.5" />
                          Roster ({eventRegs.length})
                        </button>
                        <button
                          onClick={() => openEditModal(ev)}
                          className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-350 border border-sky-955/20 rounded-lg transition"
                          title="Update Event"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`admin-delete-btn-${ev.id}`}
                          onClick={() => handleDeleteClick(ev.id)}
                          className="p-2 bg-slate-950 hover:bg-rose-950/30 text-rose-450 border border-rose-900/30 rounded-lg transition"
                          title="Delete slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Attendance rosters list toggle */}
                    {isExpanded && (
                      <div className="bg-slate-950 border-t border-sky-955/20 p-5 space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-sky-955/10">
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                            Student Registration Logs
                          </span>
                          <button 
                            onClick={() => setExpandedEventId(null)}
                            className="text-xs text-slate-500 hover:text-white"
                          >
                            Minimize logs
                          </button>
                        </div>

                        {eventRegs.length === 0 ? (
                          <p className="text-xs text-slate-500 italic py-2 text-center">
                            No students registered for this timeline slot yet. Signup is available on the Home page tab.
                          </p>
                        ) : (
                          <div className="divide-y divide-sky-955/10">
                            {eventRegs.map((reg) => (
                              <div 
                                key={reg.id} 
                                className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
                              >
                                <div>
                                  <span className="font-bold text-slate-200 block">{reg.studentName}</span>
                                  <span className="text-[10px] text-slate-500 font-mono block">{reg.studentEmail}</span>
                                </div>

                                <div className="flex items-center gap-3 w-full sm:w-auto mt-1 sm:mt-0 justify-between sm:justify-end">
                                  <span className={`px-2 py-0.5 text-[10px] rounded font-bold border ${
                                    reg.attendanceStatus === "present"
                                      ? "bg-emerald-950/80 text-emerald-450 text-emerald-400 border-emerald-900"
                                      : reg.attendanceStatus === "absent"
                                      ? "bg-rose-950/80 text-rose-450 text-rose-400 border-rose-900"
                                      : "bg-slate-900 text-slate-450 text-slate-400 border-sky-955/20"
                                  }`}>
                                    {reg.attendanceStatus || "Unmarked"}
                                  </span>

                                  <div className="inline-flex rounded-md p-0.5 bg-slate-900 border border-sky-955/20">
                                    <button
                                      onClick={() => updateAttendance(reg.id, "present")}
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                                        reg.attendanceStatus === "present"
                                          ? "bg-emerald-600 text-white"
                                          : "text-slate-400 hover:text-slate-200"
                                      }`}
                                    >
                                      Present
                                    </button>
                                    <button
                                      onClick={() => updateAttendance(reg.id, "absent")}
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                                        reg.attendanceStatus === "absent"
                                          ? "bg-rose-600 text-white"
                                          : "text-slate-400 hover:text-slate-200"
                                      }`}
                                    >
                                      Absent
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Organizer Accounts sub tab list */}
      {activeSubTab === "organizers" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-sky-955/20 pb-2">
            <h2 className="text-lg font-bold text-white">Event Organizer Accounts</h2>
            <div className="text-xs text-slate-450 text-slate-400">
              Total registered Organizers: <strong>{organizers?.length || 0}</strong>
            </div>
          </div>

          {!organizers || organizers.length === 0 ? (
            <div className="text-center py-16 bg-slate-900 border border-dashed border-sky-955/25 rounded-2xl">
              <Users className="w-10 h-10 text-slate-650 mb-3 mx-auto opacity-40" />
              <p className="text-slate-400 text-sm">No Event Organizers registered in the system database.</p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-sky-955/20 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-sky-955/20 bg-slate-950 text-[10px] text-slate-450 text-slate-400 uppercase tracking-widest font-sans">
                      <th className="py-3 px-5 font-bold">Organizer Name</th>
                      <th className="py-3 px-5 font-bold">Email Address</th>
                      <th className="py-3 px-5 font-bold">Status</th>
                      <th className="py-3 px-5 font-bold">Event Assignments</th>
                      <th className="py-3 px-5 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sky-955/10 font-mono text-xs text-slate-300">
                    {organizers.map((org) => {
                      const assignedEvents = events.filter((e) => e.organizerId === org.id);
                      return (
                        <tr key={org.id} className="hover:bg-sky-955/5 transition duration-150">
                          <td className="py-3.5 px-5 font-sans font-semibold text-white">
                            {org.name}
                          </td>
                          <td className="py-3.5 px-5 text-slate-400">
                            {org.email}
                          </td>
                          <td className="py-3.5 px-5 select-none text-left">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900/60 font-sans text-[10px] font-bold uppercase tracking-wider">
                              Active
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-sky-400 font-sans">
                            {assignedEvents.length === 0 ? (
                              <span className="text-slate-500 text-[11px] italic">No event assignments</span>
                            ) : (
                              <span className="text-sky-300 text-xs font-semibold">
                                {assignedEvents.length} event{assignedEvents.length > 1 ? "s" : ""} active
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-right font-sans">
                            <button
                              onClick={() => {
                                setOrganizerToDelete(org.id);
                              }}
                              className="px-3 py-1.5 bg-rose-950/20 hover:bg-rose-900 hover:text-white text-rose-440 text-rose-400 border border-rose-900/40 rounded-lg text-[11px] font-bold uppercase tracking-wide transition duration-150 inline-flex items-center gap-1"
                              title="Delete Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remove Account
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scheduler Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-sky-955 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-100">
            
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-950 border-b border-sky-955/20 flex justify-between items-center text-left">
              <div>
                <span className="text-[9px] font-bold uppercase text-sky-450 text-sky-400 tracking-wider block">EVENT CONFIGURATION</span>
                <span className="text-sm font-bold text-white block">
                  {editingEventId ? "Update Event Settings" : "Publish New Event"}
                </span>
              </div>
              <button 
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-850 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-left">
              
              {/* Event Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wide block">
                  Event Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sustainable Blockchain Seminar"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-sky-955/20 focus:border-sky-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-hidden transition"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wide block">
                  Category Type
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-sky-955/25 focus:border-sky-500 rounded-lg px-3 py-2 text-xs text-white outline-hidden transition"
                >
                  <option value="Seminar">Seminar</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Conference">Conference</option>
                </select>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wide block">
                  Scheduled Date
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-slate-950 border border-sky-955/20 focus:border-sky-500 rounded-lg px-3 py-2 text-xs text-white outline-hidden transition"
                />
              </div>

              {/* Timeslots */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide block">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full bg-slate-950 border border-sky-955/20 focus:border-sky-500 rounded-lg px-3 py-2 text-xs text-white outline-hidden transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide block">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full bg-slate-950 border border-sky-955/20 focus:border-sky-500 rounded-lg px-3 py-2 text-xs text-white outline-hidden transition"
                  />
                </div>
              </div>

              {/* Dynamic Venue availability list */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-300 uppercase tracking-wide block">
                    Location / Venue
                  </label>
                  <span className="text-[10px] text-emerald-400 font-bold font-mono">
                    {availableVenues.length} free
                  </span>
                </div>
                <select
                  required
                  value={formVenue}
                  onChange={(e) => setFormVenue(e.target.value)}
                  className="w-full bg-slate-950 border border-sky-955/20 focus:border-sky-500 rounded-lg px-3 py-2 text-xs text-white outline-hidden transition"
                >
                  <option value="" disabled>-- Select Available Room --</option>
                  {availableVenues.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                  {availableVenues.length === 0 && (
                    <option disabled value="">No venues currently free</option>
                  )}
                </select>
                {availableVenues.length === 0 && (
                  <p className="text-[11px] text-rose-400 font-bold mt-1">
                    ! No vacant rooms overlap with this date & time selection.
                  </p>
                )}
              </div>

              {/* Event Organizer Assignment Selector */}
              <div className="space-y-1 font-sans">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wide block">
                  Assigned Event Organizer
                </label>
                <select
                  required
                  value={formOrganizerId}
                  onChange={(e) => setFormOrganizerId(e.target.value)}
                  className="w-full bg-slate-950 border border-sky-955/20 focus:border-sky-500 rounded-lg px-3 py-2 text-xs text-white outline-hidden transition font-mono"
                >
                  <option value="" disabled>-- Select Assigned Organizer --</option>
                  {organizers && organizers.map((org: any) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.email})
                    </option>
                  ))}
                  {(!organizers || organizers.length === 0) && (
                    <>
                      <option value="u-org1">Dr. Farah Naz (organizer@maju.edu)</option>
                      <option value="u-org2">Dr. Asim Imdad (organizer2@maju.edu)</option>
                      <option value="u-org3">Prof. Maria Qamar (organizer3@maju.edu)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-xs uppercase tracking-wider transition shadow-lg"
                >
                  {editingEventId ? "Save Event Changes" : "Confirm Slot Publication"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Popup */}
      {organizerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-950/50 border border-rose-500/20 flex items-center justify-center text-rose-450 mx-auto">
              <Trash2 className="w-5 h-5 animate-pulse" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-100">Remove Event Organizer?</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Are you sure you want to remove this organizer?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOrganizerToDelete(null)}
                className="flex-1 py-2 px-3 bg-slate-950 hover:bg-slate-850 hover:text-white border border-sky-955/20 text-slate-400 rounded-lg text-xs font-semibold uppercase tracking-wider transition font-sans cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const res = await deleteOrganizer(organizerToDelete);
                  if (res.success) {
                    setOrganizerToDelete(null);
                  } else {
                    alert(res.error || "Failed to remove organizer.");
                  }
                }}
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition shadow-lg font-sans cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
