/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext.js";
import Header from "./components/Header.js";
import Home from "./pages/Home.js";
import Auth from "./pages/Auth.js";
import StudentDashboard from "./pages/StudentDashboard.js";
import OrganizerDashboard from "./pages/OrganizerDashboard.js";
import AdminDashboard from "./pages/AdminDashboard.js";
import AdminLogin from "./pages/AdminLogin.js";
import { RefreshCw } from "lucide-react";

function MainAppContent() {
  const [activeTab, setActiveTab] = useState("home");
  const { isLoading, currentUser } = useApp();

  // Guard to ensure Admin can't directly open dashboard if they bypass authentication
  const isAdminAuthenticated = currentUser?.role === "admin" && localStorage.getItem("maju_admin_authenticated") === "true";

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 font-sans flex flex-col justify-between">
      
      {/* Top Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Loading overlay indicator */}
      {isLoading && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-sky-955 p-3 rounded-lg shadow-2xl flex items-center gap-2.5 text-xs text-slate-300">
          <RefreshCw className="w-4 h-4 text-sky-400 animate-spin" />
          <span>Syncing university platform state...</span>
        </div>
      )}

      {/* Stateful Navigation router */}
      <main className="flex-1 pb-16">
        {activeTab === "home" && (
          <Home setActiveTab={setActiveTab} setSelectedEventId={() => {}} />
        )}
        
        {activeTab === "login" && (
          <Auth setActiveTab={setActiveTab} />
        )}

        {activeTab === "admin-login" && (
          <AdminLogin setActiveTab={setActiveTab} />
        )}
        
        {activeTab === "student-dashboard" && (
          <StudentDashboard />
        )}

        {activeTab === "organizer-dashboard" && (
          <OrganizerDashboard />
        )}
        
        {activeTab === "admin-dashboard" && (
          isAdminAuthenticated ? (
            <AdminDashboard />
          ) : (
            <AdminLogin setActiveTab={setActiveTab} />
          )
        )}
      </main>

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
