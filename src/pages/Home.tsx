/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext.js";
import { Calendar, Clock, MapPin, CheckCircle, Tag, User, Mail, X, GraduationCap, ChevronRight } from "lucide-react";

interface HomeProps {
  setActiveTab: (tab: string) => void;
  setSelectedEventId: (id: string | null) => void;
}

const INSTITUTIONAL_ORGANIZERS = [
  { id: "u-org1", name: "Dr. Farah Naz" },
  { id: "u-org2", name: "Dr. Asim Imdad" },
  { id: "u-org3", name: "Prof. Maria Qamar" }
];

export default function Home({ setActiveTab, setSelectedEventId }: HomeProps) {
  const { events, currentUser, logout, registerForEvent, registrations } = useApp();
  
  // Event detail and registration modal state
  const [selectedDetailEvent, setSelectedDetailEvent] = useState<any | null>(null);
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const openDetailModal = (event: any) => {
    setSelectedDetailEvent(event);
    setSuccessMessage(null);
    setErrorMessage(null);
    if (currentUser) {
      setStudentName(currentUser.name || "");
      setStudentEmail(currentUser.email || "");
    } else {
      setStudentName("");
      setStudentEmail("");
    }
  };

  const closeDetailModal = () => {
    setSelectedDetailEvent(null);
    setStudentName("");
    setStudentEmail("");
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentEmail.trim()) {
      setErrorMessage("Please enter both Name and Email.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = await registerForEvent(selectedDetailEvent.id, {
      studentName: studentName.trim(),
      studentEmail: studentEmail.trim()
    } as any);

    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage("Registration Successful!");
      setTimeout(() => {
        closeDetailModal();
      }, 1800);
    } else {
      setErrorMessage(result.error || "Failed to register. Please try again.");
    }
  };

  // Close details modal if currently viewed event is deleted
  React.useEffect(() => {
    if (selectedDetailEvent) {
      const stillExists = events.some((ev) => ev.id === selectedDetailEvent.id);
      if (!stillExists) {
        closeDetailModal();
      }
    }
  }, [events, selectedDetailEvent]);

  // Safe helper to get event organizer name
  const getOrganizerName = (organizerId?: string, defaultName?: string) => {
    const found = INSTITUTIONAL_ORGANIZERS.find((org) => org.id === organizerId);
    return found ? found.name : (defaultName || "Dr. Farah Naz");
  };

  return (
    <div className="w-full space-y-16 pb-20">
      
      {/* 1. HERO SECTION */}
      <div 
        id="home-hero"
        className="relative w-full min-h-[500px] md:min-h-[550px] flex items-center justify-center bg-slate-950 overflow-hidden border-b border-sky-955/20"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Dark elegant overlay for legibility with blue/navy university scale styling */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-indigo-950/70" />
        
        {/* Grid pattern elements for premium look */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25" />

        <div className="relative max-w-5xl mx-auto px-6 py-16 md:py-24 text-left space-y-6 w-full z-10">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-950/60 border border-sky-400/30 rounded-full text-sky-400 text-xs font-mono font-medium tracking-wide">
            <GraduationCap className="w-4 h-4" />
            University Academic Network
          </div>

          <h1 className="text-3xl md:text-5.5xl font-extrabold text-white tracking-tight leading-tight font-display max-w-3xl">
            University Event <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-sky-300 to-indigo-300">
              Management System
            </span>
          </h1>

          <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
            Discover premier academic seminars, interactive technical workshops, and international scientific conferences scheduled across our sprawling campus. Attend pre-eminent events, collaborate in real time with professors, and easily track your institutional attendance history.
          </p>

          {/* Action Buttons inside Hero */}
          <div className="pt-4 flex flex-wrap gap-4">
            {currentUser ? (
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <button
                  id="hero-go-panel-btn"
                  onClick={() => {
                    if (currentUser.role === "admin") {
                      setActiveTab("admin-dashboard");
                    } else if (currentUser.role === "organizer") {
                      setActiveTab("organizer-dashboard");
                    } else {
                      setActiveTab("student-dashboard");
                    }
                  }}
                  className="px-6 py-3 bg-sky-600 hover:bg-sky-500 font-bold rounded-xl text-xs uppercase tracking-wider text-white transition flex items-center gap-2 shadow-lg hover:shadow-sky-500/20"
                >
                  Go to my Panel
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  id="hero-logout-btn"
                  onClick={() => logout()}
                  className="px-6 py-3 bg-slate-900/80 hover:bg-slate-800 text-slate-350 border border-sky-955/20 hover:border-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition"
                >
                  Sign Out
                </button>
                <div className="text-xs text-slate-300 font-mono self-center">
                  Signed in as: <strong className="text-sky-400">{currentUser.name}</strong> ({currentUser.email})
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4">
                <button
                  id="hero-login-btn"
                  onClick={() => {
                    localStorage.setItem("auth_mode", "login");
                    setActiveTab("login");
                  }}
                  className="px-8 py-3.5 bg-sky-600 hover:bg-sky-500 font-bold rounded-xl text-xs uppercase tracking-wider text-white transition shadow-lg hover:shadow-sky-500/20"
                >
                  Log In
                </button>
                <button
                  id="hero-signup-btn"
                  onClick={() => {
                    localStorage.setItem("auth_mode", "signup");
                    setActiveTab("login");
                  }}
                  className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-sky-955/20 hover:border-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 2. UPCOMING EVENTS SECTION */}
      <div className="max-w-7xl mx-auto px-6 text-left space-y-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-sky-955/20 pb-4 gap-2">
          <div>
            <span className="text-[10px] font-bold text-sky-455 text-sky-400 uppercase tracking-widest font-mono block">
              Academic Calendar Sync
            </span>
            <h2 className="text-xl md:text-2xl font-bold font-display text-white mt-1">
              Upcoming Events
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Synchronized with university schedules • <strong className="text-sky-400">{events.length}</strong> active slots
          </p>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-20 bg-slate-900 border border-dashed border-sky-950 rounded-2xl">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No Upcoming Events</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              Academic events or seminars are currently being curated. Contact your course instructor or admin wing for schedules.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => {
              const regCount = registrations.filter((r) => r.eventId === ev.id).length;
              const organizerName = getOrganizerName(ev.organizerId, ev.organizerName);

              return (
                <div 
                  key={ev.id}
                  id={`event-card-${ev.id}`}
                  onClick={() => openDetailModal(ev)}
                  className="bg-slate-900/60 border border-sky-955/20 hover:border-sky-500/30 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer hover:-translate-y-1 hover:bg-slate-900/90 group"
                >
                  <div className="space-y-4">
                    {/* Category Stamp & Registration Tag */}
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                        ev.category === "Seminar"
                          ? "bg-indigo-950/80 text-indigo-400 border-indigo-900"
                          : ev.category === "Workshop"
                          ? "bg-emerald-950/80 text-emerald-400 border-emerald-900"
                          : "bg-purple-950/80 text-purple-400 border-purple-900"
                      }`}>
                        {ev.category}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {regCount} Registered
                      </span>
                    </div>

                    {/* Title */}
                    <div className="space-y-1">
                      <h3 className="text-sm md:text-base font-bold text-white tracking-tight line-clamp-1 group-hover:text-sky-400 transition-colors">
                        {ev.title}
                      </h3>
                      {ev.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {ev.description}
                        </p>
                      )}
                    </div>

                    {/* Technical details parameters & schedule location */}
                    <div className="border-t border-sky-955/15 pt-3.5 space-y-2 text-xs text-slate-300 font-mono">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-sky-400" />
                        <span>Date: <strong>{ev.date}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-sky-400" />
                        <span>Timings: <strong>{ev.startTime} - {ev.endTime}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Venue: <strong className="text-emerald-400 font-semibold">{ev.venue}</strong></span>
                      </div>
                      <div className="text-[11px] text-slate-400 pt-1 border-t border-sky-955/5 flex items-center justify-between">
                        <span>Organizer:</span>
                        <span className="text-sky-300 font-semibold">{organizerName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-sky-955/10 flex items-center justify-between text-xs font-semibold text-sky-400 group-hover:text-sky-350 transition-colors">
                    <span>Explore event details</span>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. COMPREHENSIVE EVENT DETAIL PAGE / MODAL */}
      {selectedDetailEvent && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-sky-955/40 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950 border-b border-sky-955/20 flex justify-between items-center text-left">
              <div>
                <span className="text-[9px] font-extrabold uppercase text-sky-400 tracking-widest block font-mono">
                  EVENT SPECIFICATIONS
                </span>
                <span className="text-base md:text-lg font-bold text-white block mt-0.5">
                  {selectedDetailEvent.title}
                </span>
              </div>
              <button 
                onClick={closeDetailModal}
                className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Two Section Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-sky-955/15 text-left">
              
              {/* Left Column: Event Details */}
              <div className="p-6 md:col-span-7 space-y-4">
                <div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                    selectedDetailEvent.category === "Seminar"
                      ? "bg-indigo-950/80 text-indigo-400 border-indigo-900"
                      : selectedDetailEvent.category === "Workshop"
                      ? "bg-emerald-950/80 text-emerald-400 border-emerald-900"
                      : "bg-purple-950/80 text-purple-400 border-purple-900"
                  }`}>
                    {selectedDetailEvent.category}
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs text-slate-300">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide block">Event Title:</span>
                    <p className="text-white font-sans text-sm font-semibold">{selectedDetailEvent.title}</p>
                  </div>

                  {selectedDetailEvent.description && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide block">Description:</span>
                      <p className="font-sans text-xs text-slate-400 leading-relaxed font-normal">{selectedDetailEvent.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide block">Scheduled Date:</span>
                      <span className="text-white flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <strong>{selectedDetailEvent.date}</strong>
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide block">Event Timings:</span>
                      <span className="text-white flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <strong>{selectedDetailEvent.startTime} - {selectedDetailEvent.endTime}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide block">Venue / Location:</span>
                    <span className="text-emerald-400 flex items-center gap-1.5 font-bold mt-0.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {selectedDetailEvent.venue}
                    </span>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-sky-955/10">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide block">Event Organizer:</span>
                    <div className="bg-slate-950/50 rounded-lg p-2.5 border border-sky-955/10 flex items-center gap-2 mt-1">
                      <div className="h-7 w-7 rounded-full bg-sky-950 flex items-center justify-center text-sky-400 font-bold text-xs uppercase">
                        {getOrganizerName(selectedDetailEvent.organizerId, selectedDetailEvent.organizerName).charAt(0)}
                      </div>
                      <div>
                        <span className="font-sans text-xs font-semibold text-sky-300 block">
                          {getOrganizerName(selectedDetailEvent.organizerId, selectedDetailEvent.organizerName)}
                        </span>
                        <span className="text-[9px] text-slate-500">Maju Faculty Instructor</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Embedded Participant Registration Form */}
              <div className="p-6 md:col-span-5 bg-slate-950/40">
                <div className="mb-4">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block font-mono">
                    PARTICIPANT ENROLLMENT
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Log your institutional attendance profile in this chronological session.
                  </p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-3 text-left">
                  
                  {errorMessage && (
                    <div className="bg-rose-950/40 border border-rose-900/50 p-2.5 rounded text-[11px] text-rose-350 leading-relaxed">
                      {errorMessage}
                    </div>
                  )}

                  {successMessage ? (
                    <div className="bg-emerald-950/40 border border-emerald-900/40 p-4 rounded-xl text-center space-y-1.5 animate-in fade-in duration-150">
                      <CheckCircle className="w-7 h-7 text-emerald-400 mx-auto" />
                      <p className="text-xs font-bold text-emerald-300">{successMessage}</p>
                      <p className="text-[10px] text-slate-450 text-slate-400 leading-normal">
                        Your university index credentials have been logged in the slot timeline index roster.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          disabled={isSubmitting}
                          placeholder="e.g. Mohammad Ali"
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          className="w-full bg-slate-950 border border-sky-955/30 focus:border-sky-500 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-650 outline-hidden transition"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          University Email
                        </label>
                        <input
                          type="email"
                          required
                          disabled={isSubmitting}
                          placeholder="e.g. ali@maju.edu"
                          value={studentEmail}
                          onChange={(e) => setStudentEmail(e.target.value)}
                          className="w-full bg-slate-950 border border-sky-955/30 focus:border-sky-500 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-650 outline-hidden transition"
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white font-bold rounded-lg text-xs tracking-wider uppercase transition shadow-md"
                        >
                          {isSubmitting ? "Enrolling Participant..." : "Submit Registration"}
                        </button>
                      </div>
                    </>
                  )}

                </form>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
