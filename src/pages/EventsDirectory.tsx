/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext.js";
import { Search, SlidersHorizontal, MapPin, Clock, Calendar, Users, Megaphone, FileText, CheckCircle2, AlertTriangle, ChevronRight, X, LayoutList, Terminal, ChevronDown } from "lucide-react";

interface EventsDirectoryProps {
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  setActiveTab: (tab: string) => void;
}

export default function EventsDirectory({ selectedEventId, setSelectedEventId, setActiveTab }: EventsDirectoryProps) {
  const { events, registrations, currentUser, registerForEvent } = useApp();
  
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDateFilter, setSelectedDateFilter] = useState("All"); // All, Today, Upcoming
  
  // Detail views
  const [activeDetailEvent, setActiveDetailEvent] = useState<any | null>(null);
  const [regStatus, setRegStatus] = useState<{ success?: boolean; error?: string } | null>(null);
  const [submittingReg, setSubmittingReg] = useState(false);

  // Sync if selected event ID is passed from outside
  useEffect(() => {
    if (selectedEventId) {
      const match = events.find(e => e.id === selectedEventId);
      if (match) {
        setActiveDetailEvent(match);
      }
    }
  }, [selectedEventId, events]);

  // Sync if active detail event gets deleted from the database
  useEffect(() => {
    if (activeDetailEvent) {
      const exists = events.some(e => e.id === activeDetailEvent.id);
      if (!exists) {
        setActiveDetailEvent(null);
        if (selectedEventId === activeDetailEvent.id) {
          setSelectedEventId(null);
        }
      }
    }
  }, [events, activeDetailEvent, selectedEventId, setSelectedEventId]);

  // Handle registrations
  const handleRegister = async (eventId: string) => {
    if (!currentUser) {
      setActiveTab("login");
      return;
    }
    setSubmittingReg(true);
    setRegStatus(null);
    try {
      const res = await registerForEvent(eventId);
      if (res.success) {
        setRegStatus({ success: true });
      } else {
        setRegStatus({ error: res.error || "Failed registration booking check." });
      }
    } catch (e) {
      setRegStatus({ error: "System disconnected." });
    } finally {
      setSubmittingReg(false);
    }
  };

  // Filter approved events for Student discovery
  const approvedEvents = events.filter(e => e.status === "approved");

  // Filtering Logic
  const filteredEvents = approvedEvents.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.speaker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "All" || event.category === selectedCategory;
    
    let matchesDate = true;
    const eventTime = new Date(event.date);
    const today = new Date("2026-06-15"); // hardcoded evaluation date matching metadata
    today.setHours(0,0,0,0);
    
    if (selectedDateFilter === "Today") {
      const eventDateStr = event.date; // YYYY-MM-DD
      const todayStr = "2026-06-15";
      matchesDate = eventDateStr === todayStr;
    } else if (selectedDateFilter === "Upcoming") {
      matchesDate = eventTime.getTime() > today.getTime();
    }

    return matchesSearch && matchesCategory && matchesDate;
  });

  const categories = ["All", "Seminar", "Workshop", "Conference", "Academic"];

  // Helper: check if student registered
  const getStudentRegistration = (eventId: string) => {
    if (!currentUser) return null;
    return registrations.find(r => r.studentId === currentUser.id && r.eventId === eventId);
  };

  const getRegistrantCount = (eventId: string) => {
    return registrations.filter(r => r.eventId === eventId).length;
  };

  const closeDetails = () => {
    setActiveDetailEvent(null);
    setSelectedEventId(null);
    setRegStatus(null);
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
        
        {/* Banner Headers */}
        <div className="mb-8 border-b border-sky-955 pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">University Event Directory</h1>
          <p className="text-sm text-slate-400 mt-2">Discover, filter academic classes, sign up block schedules, and submit feedbacks seamlessly.</p>
        </div>

        {/* Filters and Utilities Row */}
        <div className="grid lg:grid-cols-12 gap-6 mb-8 items-center bg-slate-900/60 p-4 border border-sky-950/60 rounded-xl">
          
          {/* Text Search Box */}
          <div className="lg:col-span-4 relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search title, description, guest speaker..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-sky-950/80 rounded-md focus:border-sky-500 text-xs text-white focus:outline-hidden transition"
            />
          </div>

          {/* Category Pill Filters */}
          <div className="lg:col-span-5 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-slate-400 font-mono font-bold mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition ${
                  selectedCategory === cat
                    ? "bg-sky-600 text-white"
                    : "bg-slate-950 text-slate-400 border border-sky-950/60 hover:text-white hover:border-sky-500/30"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Date Selector Filter */}
          <div className="lg:col-span-3 flex items-center justify-end gap-2.5">
            <span className="text-xs text-slate-400 font-mono font-bold whitespace-nowrap">Schedule Horizon:</span>
            <select
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-sky-950/80 rounded-md text-xs text-white focus:border-sky-500 focus:outline-hidden transition w-full"
            >
              <option value="All">All Program Schedule</option>
              <option value="Today">Happening Today (June 15)</option>
              <option value="Upcoming">Upcoming Academic Calendar</option>
            </select>
          </div>

        </div>

        {/* Content Section: Directory lists vs Expanded details side-by-side or modal */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Grid Listing Column */}
          <div className={`${activeDetailEvent ? "lg:col-span-7" : "lg:col-span-12"} transition-all duration-300 grid sm:grid-cols-2 ${activeDetailEvent ? "md:grid-cols-1" : "md:grid-cols-3"} gap-6`}>
            {filteredEvents.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-slate-900 border border-dashed border-sky-950/80 rounded-xl space-y-4">
                <LayoutList className="w-12 h-12 text-sky-500 mx-auto" />
                <div>
                  <h3 className="text-base font-semibold text-white">No Program Matches</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">None of the currently scheduled approved initiatives matched your active keywords or category filters.</p>
                </div>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("All");
                    setSelectedDateFilter("All");
                  }}
                  className="px-4 py-2 bg-sky-950 text-sky-400 border border-sky-900 rounded text-xs"
                >
                  Reset Filtering Matrices
                </button>
              </div>
            ) : (
              filteredEvents.map((item) => {
                const regStud = getStudentRegistration(item.id);
                const regCount = getRegistrantCount(item.id);
                const isSelected = activeDetailEvent?.id === item.id;
                
                return (
                  <div 
                    key={item.id}
                    onClick={() => {
                      setActiveDetailEvent(item);
                      setRegStatus(null);
                    }}
                    className={`bg-slate-900 border cursor-pointer rounded-xl overflow-hidden transition-all duration-300 flex flex-col hover:border-sky-500/40 shadow-md hover:-translate-y-1 ${
                      isSelected ? "ring-2 ring-sky-500 border-sky-500" : "border-sky-950/60"
                    }`}
                  >
                    <div className="h-40 w-full relative bg-slate-800">
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 right-3 px-2 py-0.5 bg-slate-950/90 text-[10px] font-mono border border-sky-900 font-bold text-sky-450 text-sky-400 rounded">
                        {item.category}
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col space-y-3">
                      <div>
                        <h3 className="text-sm font-bold text-white leading-snug line-clamp-1">{item.title}</h3>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">{item.description}</p>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-2 border-t border-sky-955/30">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{item.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span className="truncate">{item.venue}</span>
                        </div>
                      </div>

                      {/* Bottom action indicators */}
                      <div className="pt-2 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase font-mono block">Faculty Lead</span>
                          <span className="text-[11px] font-medium text-slate-300 truncate max-w-28 block">{item.speaker}</span>
                        </div>
                        
                        {regStud ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-950/60 border border-emerald-900 text-[10px] text-emerald-400 rounded-md font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Registered
                          </span>
                        ) : regCount >= item.capacity ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-950/60 border border-rose-900 text-[10px] text-rose-450 rounded-md">
                            Fully Booked
                          </span>
                        ) : (
                          <div className="text-[10px] font-medium text-sky-400 flex items-center gap-0.5 hover:underline">
                            Details & Register
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Detailed Expansion Column */}
          {activeDetailEvent && (
            <div className="lg:col-span-5 bg-slate-900 border border-sky-900/40 rounded-xl shadow-2xl p-6 sticky top-24 self-start">
              <div className="flex justify-between items-start mb-4 border-b border-sky-955/40 pb-3">
                <span className="px-2.5 py-0.5 bg-sky-950 border border-sky-900/60 rounded text-[9px] uppercase font-mono tracking-wider font-bold text-sky-400">
                  {activeDetailEvent.category} Program Profile
                </span>
                <button
                  onClick={closeDetails}
                  className="p-1 text-slate-400 hover:text-white rounded-full bg-slate-950 hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Cover and details */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white leading-snug">{activeDetailEvent.title}</h2>
                <div className="h-44 w-full rounded-lg overflow-hidden bg-slate-950">
                  <img 
                    src={activeDetailEvent.image} 
                    alt={activeDetailEvent.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <p className="text-xs text-slate-300 leading-relaxed text-slate-400">{activeDetailEvent.description}</p>
                
                {/* Specific features */}
                <div className="bg-slate-950/80 p-3.5 rounded-lg border border-sky-950/30 text-xs text-slate-305 space-y-2 text-slate-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sky-450 text-sky-400" />
                    <span><strong>Event Date:</strong> {activeDetailEvent.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-450 text-sky-400" />
                    <span><strong>Academic Hours:</strong> {activeDetailEvent.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-sky-450 text-sky-400" />
                    <span><strong>Venue Allocations:</strong> {activeDetailEvent.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-450 text-sky-400" />
                    <span>
                      <strong>Registry Load:</strong> {getRegistrantCount(activeDetailEvent.id)} / {activeDetailEvent.capacity} Seats Filled
                    </span>
                  </div>
                </div>

                {/* 1. Schedule Timetable Timeline */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Timetable Timeline Schedule</h3>
                  <div className="border-l-2 border-sky-900 ml-2.5 pl-4 py-1 space-y-4 text-left">
                    {activeDetailEvent.schedule.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic">No timeline items configured by the Academic Committee.</p>
                    ) : (
                      activeDetailEvent.schedule.map((sch: any, idx: number) => (
                        <div key={sch.id || idx} className="relative">
                          {/* Circle indicator */}
                          <span className="absolute -left-[23px] top-1 h-2.5 w-2.5 rounded-full bg-sky-500 ring-4 ring-slate-900" />
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-sky-400 font-mono font-semibold">{sch.startTime} - {sch.endTime}</span>
                            <h4 className="text-xs font-bold text-slate-200">{sch.activityName}</h4>
                            <p className="text-[11px] text-slate-400 leading-relaxed">{sch.speaker} • Venue: {sch.location}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. SPM Focus: Resource inventory Allocations */}
                <div className="space-y-3.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Inventory & Personnel Allocations (No Clash)</h3>
                  <div className="flex flex-wrap gap-2">
                    {activeDetailEvent.resources.length === 0 ? (
                      <span className="text-xs text-slate-500 italic">No resources attached to this booking.</span>
                    ) : (
                      activeDetailEvent.resources.map((res: any, idx: number) => (
                        <span 
                          key={idx} 
                          className="px-2.5 py-1 bg-slate-950 border border-sky-900/60 rounded text-[11px] text-slate-300 flex items-center gap-1 shadow-xs"
                        >
                          <Terminal className="w-3.5 h-3.5 text-slate-500" />
                          {res.resourceName}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* 3. Event Gallery Mock Illustrations */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Lecture Material Gallery</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-14 rounded bg-slate-950 overflow-hidden border border-sky-955/20 grayscale hover:grayscale-0 cursor-pointer transition">
                      <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=200&auto=format&fit=crop" alt="Slide 1" className="w-full h-full object-cover" />
                    </div>
                    <div className="h-14 rounded bg-slate-950 overflow-hidden border border-sky-955/20 grayscale hover:grayscale-0 cursor-pointer transition">
                      <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=200&auto=format&fit=crop" alt="Slide 2" className="w-full h-full object-cover" />
                    </div>
                    <div className="h-14 rounded bg-slate-950 overflow-hidden border border-sky-955/20 grayscale hover:grayscale-0 cursor-pointer transition">
                      <img src="https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=200&auto=format&fit=crop" alt="Slide 3" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>

                {/* Register Alert status indicators */}
                {regStatus && (
                  <div className={`p-3 rounded-lg flex items-start gap-2 text-xs border ${
                    regStatus.success 
                      ? "bg-emerald-950/60 text-emerald-300 border-emerald-900" 
                      : "bg-rose-950/60 text-rose-300 border-rose-900"
                  }`}>
                    {regStatus.success ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong className="block font-semibold">Seat Reserved</strong>
                          <span className="text-[11px] block text-slate-300 mt-0.5">Booking verified successfully. Go to Student Panel for certificates.</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5 text-rose-450 text-rose-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong className="block font-semibold">Registry Error</strong>
                          <span className="text-[11px] block text-slate-300 mt-0.5">{regStatus.error}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Action trigger button */}
                <div className="pt-3">
                  {getStudentRegistration(activeDetailEvent.id) ? (
                    <div className="w-full py-3 bg-emerald-950/50 border border-emerald-900/40 text-emerald-400 text-center rounded-lg text-xs font-semibold flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      RESERVED STATUS ACTIVE: ID: {getStudentRegistration(activeDetailEvent.id)?.id}
                    </div>
                  ) : getRegistrantCount(activeDetailEvent.id) >= activeDetailEvent.capacity ? (
                    <div className="w-full py-3 bg-slate-800 text-slate-400 text-center rounded-lg text-xs font-semibold">
                      EVENT SEATS CAPACITY FULLY EXHAUSTED
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRegister(activeDetailEvent.id)}
                      disabled={submittingReg}
                      className="w-full py-3 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-bold tracking-wider hover:shadow-lg hover:shadow-sky-500/20 transition-all duration-200"
                    >
                      {submittingReg ? "Registering student record..." : "RESERVE MY SEAT NOW (FREE)"}
                    </button>
                  )}
                  
                  {!currentUser && (
                    <span className="text-[10px] text-slate-500 block text-center mt-2.5">
                      Signing up requires institutional MAJU user logs. Clicking above routes to auth.
                    </span>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
