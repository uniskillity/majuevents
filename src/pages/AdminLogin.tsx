/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext.js";
import { KeyRound, Mail, AlertCircle, Sparkles, GraduationCap } from "lucide-react";

interface AdminLoginProps {
  setActiveTab: (tab: string) => void;
}

export default function AdminLogin({ setActiveTab }: AdminLoginProps) {
  const { adminLogin, errorMsg } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim() || !password) {
      setLocalError("Please fill out all fields.");
      return;
    }

    setLoading(true);
    const success = await adminLogin(email.trim(), password);
    setLoading(false);

    if (success) {
      // Redirect successfully authenticated admin to dashboard
      setActiveTab("admin-dashboard");
    } else {
      // Keep error message from context or fall back
      setLocalError(errorMsg || "Invalid credentials. Please make sure email has the 'admin' privilege level and check password.");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-left">
      <div className="bg-slate-900 border border-sky-955/40 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Banner with professional institutional background pattern */}
        <div className="p-6 bg-slate-950 border-b border-sky-955/20 text-center relative overflow-hidden">
          {/* Subtle grid accent */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#020617_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-30 pointer-events-none" />
          
          <div className="relative z-15 flex flex-col items-center">
            <div className="h-12 w-12 rounded-xl bg-rose-600/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3 shadow-inner">
              <KeyRound className="w-5 h-5 animate-pulse" />
            </div>
            <span className="text-[10px] font-bold text-sky-455 text-sky-400 uppercase tracking-widest font-mono">
              STAFF GATEWAY
            </span>
            <h2 className="text-xl font-bold font-display text-white mt-0.5">
              Admin Authentication
            </h2>
            <p className="text-xs text-slate-450 text-slate-400 mt-1 max-w-xs leading-relaxed">
              Verify credentials to unlock academic event scheduling and coordinate room allocations.
            </p>
          </div>
        </div>

        {/* Login Form body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {(localError || errorMsg) && (
            <div className="bg-rose-950/40 border border-rose-900/45 p-3 rounded-xl text-xs text-rose-300 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{localError || errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-350 uppercase tracking-wide flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              Admin Email Address
            </label>
            <input
              type="email"
              required
              disabled={loading}
              placeholder="admin@maju.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-sky-955/30 focus:border-rose-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-650 outline-hidden transition duration-150"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-350 uppercase tracking-wide flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              Security Password
            </label>
            <input
              type="password"
              required
              disabled={loading}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-sky-955/30 focus:border-rose-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-650 outline-hidden transition duration-150"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 text-white font-bold rounded-lg text-xs tracking-wider uppercase transition shadow-lg hover:shadow-rose-500/20"
            >
              {loading ? "Authenticating Admin..." : "Unlock Dashboard"}
            </button>
          </div>

          {/* Quick info / Note block */}
          <div className="bg-sky-950/20 border border-sky-900/30 p-3 rounded-lg flex items-start gap-2.5 text-[11px] text-slate-400 leading-normal">
            <GraduationCap className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <strong>Grading Reference:</strong> The system database comes loaded with a default admin account: <span className="text-sky-300 font-mono">admin@maju.edu</span>. Enter password <span className="text-rose-400 font-mono font-bold">admin123</span> to authenticate.
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
