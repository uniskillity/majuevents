/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext.js";
import { LogIn, UserPlus, Info, CheckCircle2, Mail, Lock, User, ShieldAlert } from "lucide-react";

interface AuthProps {
  setActiveTab: (tab: string) => void;
}

export default function Auth({ setActiveTab }: AuthProps) {
  const { login, registerUser, errorMsg, isLoading } = useApp();
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student"); // "student" | "admin"

  const [localError, setLocalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Read preferred auth mode from local session set by homepage trigger buttons
  useEffect(() => {
    const mode = localStorage.getItem("auth_mode");
    if (mode === "signup") {
      setIsLoginMode(false);
    } else {
      setIsLoginMode(true);
    }
    localStorage.removeItem("auth_mode");
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMsg(null);

    const emailTrimmed = email.trim();
    if (!emailTrimmed || !password) {
      setLocalError("Email and Password are required.");
      return;
    }

    if (isLoginMode) {
      // Login flow
      const success = await login(emailTrimmed, password, role);
      if (success) {
        setSuccessMsg("Logged in successfully. Redirecting you to your dashboard...");
        setTimeout(() => {
          const stored = localStorage.getItem("maju_user");
          if (stored) {
            const user = JSON.parse(stored);
            if (user.role === "admin") {
              localStorage.setItem("maju_admin_authenticated", "true");
              setActiveTab("admin-dashboard");
            } else if (user.role === "organizer") {
              setActiveTab("organizer-dashboard");
            } else {
              setActiveTab("student-dashboard");
            }
          } else {
            setActiveTab("home");
          }
        }, 1200);
      }
    } else {
      // Signup flow
      if (!name.trim()) {
        setLocalError("Name is required.");
        return;
      }

      const regData = {
        name: name.trim(),
        email: emailTrimmed,
        password,
        role
      };

      const success = await registerUser(regData as any);
      if (success) {
        setSuccessMsg("Account created successfully. Redirecting you...");
        setTimeout(() => {
          if (role === "admin") {
            localStorage.setItem("maju_admin_authenticated", "true");
            setActiveTab("admin-dashboard");
          } else if (role === "organizer") {
            setActiveTab("organizer-dashboard");
          } else {
            setActiveTab("student-dashboard");
          }
        }, 1200);
      }
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative bg-slate-950">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          {isLoginMode ? "Sign In to Your Account" : "Create Your Account"}
        </h2>
        <p className="mt-2 text-xs text-slate-400">
          {isLoginMode ? "Access registrations, notifications, and attendance tracking" : "Register to discover and attend university initiatives"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-6 shadow-2xl rounded-2xl border border-sky-950/80 sm:px-10 space-y-5">
          
          {/* Status Message Banners */}
          {(localError || errorMsg) && (
            <div className="bg-rose-950/40 border border-rose-900/50 p-3.5 rounded-lg flex items-start gap-2.5 text-left">
              <ShieldAlert className="w-5 h-5 text-rose-450 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-rose-200 block">Access Warning</span>
                <p className="text-[11px] text-rose-350 leading-relaxed mt-0.5">{localError || errorMsg}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-950/40 border border-emerald-900/50 p-3.5 rounded-lg flex items-start gap-2.5 text-left">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-emerald-200 block">Access Confirmed</span>
                <p className="text-[11px] text-emerald-350 leading-relaxed mt-0.5">{successMsg}</p>
              </div>
            </div>
          )}

          {/* Form Mode Toggle Buttons */}
          <div className="flex bg-slate-950 rounded-lg p-1 border border-sky-950/40">
            <button
              onClick={() => {
                setIsLoginMode(true);
                setLocalError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 flex justify-center items-center gap-1.5 py-2 rounded text-xs font-semibold transition ${
                isLoginMode 
                  ? "bg-sky-600 text-white shadow" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              onClick={() => {
                setIsLoginMode(false);
                setLocalError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 flex justify-center items-center gap-1.5 py-2 rounded text-xs font-semibold transition ${
                !isLoginMode 
                  ? "bg-sky-600 text-white shadow" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Register
            </button>
          </div>

          {/* Submission Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4 text-left">
            {isLoginMode && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Select Your Account Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("student")}
                    className={`py-2 px-1 border rounded-lg text-xs font-semibold text-center transition ${
                      role === "student"
                        ? "bg-slate-950 border-sky-500 text-sky-450"
                        : "bg-slate-950/60 border-sky-950 text-slate-400"
                    }`}
                  >
                    Participant
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("organizer")}
                    className={`py-2 px-1 border rounded-lg text-xs font-semibold text-center transition ${
                      role === "organizer"
                        ? "bg-slate-950 border-sky-500 text-sky-450"
                        : "bg-slate-950/60 border-sky-950 text-slate-400"
                    }`}
                  >
                    Event Organizer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    className={`py-2 px-1 border rounded-lg text-xs font-semibold text-center transition ${
                      role === "admin"
                        ? "bg-slate-950 border-emerald-500 text-emerald-400"
                        : "bg-slate-950/60 border-sky-950 text-slate-400"
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>
            )}

            {!isLoginMode && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mohammad Ali"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-sky-950 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-650 outline-hidden transition"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="e.g. student@maju.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-sky-950 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-650 outline-hidden transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-sky-950 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-650 outline-hidden transition"
              />
            </div>

            {!isLoginMode && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Select User Account Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("student")}
                    className={`py-2 px-3 border rounded-lg text-xs font-semibold text-center transition ${
                      role === "student"
                        ? "bg-slate-950 border-sky-500 text-sky-400"
                        : "bg-slate-950/60 border-sky-950 text-slate-400"
                    }`}
                  >
                    Participant
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("organizer")}
                    className={`py-2 px-3 border rounded-lg text-xs font-semibold text-center transition ${
                      role === "organizer"
                        ? "bg-slate-950 border-sky-500 text-sky-400"
                        : "bg-slate-950/60 border-sky-950 text-slate-400"
                    }`}
                  >
                    Event Organizer
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white py-2.5 px-4 rounded-lg text-xs tracking-wider uppercase font-extrabold transition duration-200 mt-4 shadow-lg"
            >
              {isLoading ? "Validating Account..." : isLoginMode ? "Authenticate Secure Login" : "Register and Propose Account"}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-sky-955/15 text-center">
            <button
              onClick={() => setActiveTab("admin-login")}
              className="text-xs text-rose-450 hover:text-rose-350 text-rose-400 hover:text-rose-300 font-semibold inline-flex items-center gap-1 transition"
            >
              Are you an Administrator? Access Staff Gateway Space &rarr;
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
