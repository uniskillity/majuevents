/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext.js";
import { Calendar, Bell, Shield, LogOut, Landmark, RefreshCw, X, Check } from "lucide-react";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
  const { currentUser, logout, notifications, markNotificationsAsRead, switchUserRoleDirectly } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadNotifs = notifications.filter((n) => !n.read);

  const handleMarkAllRead = () => {
    markNotificationsAsRead();
    setShowNotifications(false);
  };

  const navLinks = [{ id: "home", label: "Home" }];

  if (currentUser) {
    if (currentUser.role === "admin") {
      navLinks.push({ id: "admin-dashboard", label: "Admin Panel" });
    } else if (currentUser.role === "organizer") {
      navLinks.push({ id: "organizer-dashboard", label: "Organizer Panel" });
    } else {
      navLinks.push({ id: "student-dashboard", label: "Participant Panel" });
    }
  } else {
    navLinks.push({ id: "login", label: "Sign In / Register" });
    navLinks.push({ id: "admin-login", label: "Admin Gateway" });
  }

  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-sky-955 shadow-md text-left">
      
      {/* Top bar with quick evaluator profile switcher */}
      <div className="bg-sky-950 text-white text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-3 font-sans">
        <div className="flex items-center gap-1.5 font-bold tracking-wide">
          <Landmark className="w-3.5 h-3.5 text-yellow-500" />
          <span>MOHAMMAD ALI JINNAH UNIVERSITY (MAJU)</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-sky-200 font-medium flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin text-sky-400" />
            Evaluation Toggle:
          </span>
          <div className="inline-flex rounded-md p-0.5 bg-slate-950/80 border border-sky-900/60 shadow-inner">
            <button
              onClick={() => {
                switchUserRoleDirectly("student");
                setActiveTab("student-dashboard");
              }}
              className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition duration-150 ${
                currentUser?.role === "student"
                  ? "bg-sky-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Participant View
            </button>
            <button
              onClick={() => {
                switchUserRoleDirectly("organizer");
                setActiveTab("organizer-dashboard");
              }}
              className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition duration-150 ${
                currentUser?.role === "organizer"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Organizer View
            </button>
            <button
              onClick={() => {
                switchUserRoleDirectly("admin");
                setActiveTab("admin-dashboard");
              }}
              className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition duration-150 ${
                currentUser?.role === "admin"
                  ? "bg-rose-650 bg-rose-605 bg-rose-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Admin View
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Identity / Title */}
          <div 
            onClick={() => setActiveTab("home")} 
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-white shadow-lg shadow-sky-500/10">
              <Calendar className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-black tracking-tight text-white group-hover:text-sky-305 group-hover:text-sky-300 transition block">
                University Event Management System
              </span>
              <span className="text-[9px] block uppercase font-mono text-slate-400 -mt-1 tracking-widest">
                MAJU Academic Portal
              </span>
            </div>
          </div>

          {/* Desktop Navigation Link Tabs */}
          <div className="flex items-center gap-4 sm:gap-6">
            <nav className="flex items-center gap-2 sm:gap-4">
              {navLinks.map((link) => {
                const isActive = activeTab === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => setActiveTab(link.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                      isActive 
                        ? "bg-sky-950/80 text-sky-400" 
                        : "text-slate-350 hover:text-white hover:bg-slate-800/40"
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
            </nav>

            {/* Notification and User Actions */}
            {currentUser && (
              <div className="flex items-center gap-3 border-l border-sky-955 pl-4 sm:pl-6">
                
                {/* Bell popover launcher */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-1.5 bg-slate-950/80 border border-sky-955/20 text-slate-400 hover:text-white hover:border-sky-500/20 rounded-full transition relative"
                    title="Alerts Ledger"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadNotifs.length > 0 && (
                      <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    )}
                  </button>

                  {/* Popover list */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-3.5 w-72 bg-slate-900 border border-sky-950 rounded-xl overflow-hidden shadow-2xl z-50">
                      <div className="px-4 py-2.5 bg-slate-950 border-b border-sky-955/20 flex justify-between items-center text-slate-205 text-slate-300 text-xs font-bold">
                        <span>LATEST ALERTS ({unreadNotifs.length})</span>
                        {unreadNotifs.length > 0 && (
                          <button 
                            onClick={handleMarkAllRead} 
                            className="text-[10px] text-sky-400 hover:underline"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                      
                      <div className="max-h-60 overflow-y-auto divide-y divide-sky-955/10">
                        {notifications.length === 0 ? (
                          <p className="p-4 text-center text-xs text-slate-500 italic">No notification history.</p>
                        ) : (
                          notifications.slice(0, 5).map((n) => (
                            <div 
                              key={n.id} 
                              className={`p-3 text-xs space-y-1 hover:bg-slate-850/30 transition text-left cursor-pointer ${
                                !n.read ? "bg-slate-950/40" : "opacity-70"
                              }`}
                              onClick={() => {
                                markNotificationsAsRead(n.id);
                                setShowNotifications(false);
                              }}
                            >
                              <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                                <span className="uppercase text-[8px] font-bold tracking-widest text-sky-400">
                                  {n.type || "alert"}
                                </span>
                                <span>{new Date(n.date).toLocaleDateString()}</span>
                              </div>
                              <h4 className="font-bold text-white leading-tight">{n.title}</h4>
                              <p className="text-[11px] text-slate-400 leading-snug">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sign Out Action */}
                <button
                  onClick={() => {
                    logout();
                    setActiveTab("home");
                  }}
                  className="p-1.5 hover:bg-rose-950/30 text-slate-400 hover:text-white border border-sky-955/20 rounded-full transition"
                  title="Secure Session Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>

              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
