/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Event, Registration, Resource, Notification, Feedback, Certificate } from "../types.js";

interface AnalyticsSummary {
  metrics: {
    totalUsers: number;
    totalStudents: number;
    totalOrganizers: number;
    totalEvents: number;
    approvedEvents: number;
    pendingEvents: number;
    totalRegistrations: number;
    totalFeedbacks: number;
    resourceUtilizationRate: number;
    totalAllocations: number;
  };
  categoryDistribution: { name: string; count: number }[];
  ratingsSummary: { stars: number; count: number }[];
  eventRegStats: { title: string; registered: number; capacity: number }[];
}

interface AppContextType {
  currentUser: User | null;
  events: Event[];
  registrations: Registration[];
  resources: Resource[];
  notifications: Notification[];
  feedbacks: Feedback[];
  certificates: Certificate[];
  analytics: AnalyticsSummary | null;
  organizers: User[];
  isLoading: boolean;
  errorMsg: string | null;
  
  // Actions
  login: (email: string, password?: string, role?: string) => Promise<boolean>;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  registerUser: (formData: { name: string; email: string; role: string; rollNumber?: string; department?: string }) => Promise<boolean>;
  logout: () => void;
  deleteOrganizer: (organizerId: string) => Promise<{ success: boolean; error?: string }>;
  createEvent: (eventData: Partial<Event>) => Promise<{ success: boolean; error?: string }>;
  updateEvent: (eventId: string, updateData: Partial<Event>) => Promise<{ success: boolean; error?: string }>;
  deleteEvent: (eventId: string) => Promise<{ success: boolean; error?: string }>;
  registerForEvent: (eventId: string, customForm?: { studentName: string; studentRoll: string; studentDept: string }) => Promise<{ success: boolean; error?: string }>;
  updateAttendance: (registrationId: string, status: "present" | "absent" | "unmarked") => Promise<{ success: boolean; error?: string }>;
  sendEventReminder: (eventId: string) => Promise<{ success: boolean; count?: number; error?: string }>;
  submitFeedback: (feedbackData: { eventId: string; rating: number; comments: string; suggestions?: string }) => Promise<{ success: boolean; error?: string }>;
  sendOrganizerNotification: (eventId: string, title: string, message: string) => Promise<{ success: boolean; error?: string }>;
  markNotificationsAsRead: (notificationId?: string) => Promise<void>;
  fetchData: () => Promise<void>;
  switchUserRoleDirectly: (role: "student" | "organizer" | "admin") => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [organizers, setOrganizers] = useState<User[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Read stored user from local session for fluid reloads
  useEffect(() => {
    const saved = localStorage.getItem("maju_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentUser(parsed);
      } catch (e) {
        localStorage.removeItem("maju_user");
      }
    }
  }, []);

  // Fetch all initial data
  const fetchData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // 1. Fetch events
      const resEvents = await fetch("/api/events");
      if (resEvents.ok) {
        const data = await resEvents.json();
        setEvents(data);
      }

      // 2. Fetch resources
      const resRes = await fetch("/api/resources");
      if (resRes.ok) {
        const data = await resRes.json();
        setResources(data);
      }

      // Fetch organizers list from server
      const resOrgs = await fetch("/api/organizers");
      if (resOrgs.ok) {
        const data = await resOrgs.json();
        setOrganizers(data);
      }

      // 3. Conditional queries based on active logged user
      if (currentUser) {
        // Registrations
        const query = currentUser.role === "student" ? `?studentId=${currentUser.id}` : "";
        const resReg = await fetch(`/api/registrations${query}`);
        if (resReg.ok) {
          const data = await resReg.json();
          setRegistrations(data);
        }

        // Notifications
        const resNotif = await fetch(`/api/notifications?userId=${currentUser.id}`);
        if (resNotif.ok) {
          const data = await resNotif.json();
          setNotifications(data);
        }

        // Certificates
        const certQuery = currentUser.role === "student" ? `?studentId=${currentUser.id}` : "";
        const resCert = await fetch(`/api/certificates${certQuery}`);
        if (resCert.ok) {
          const data = await resCert.json();
          setCertificates(data);
        }

        // Feedback
        const resFb = await fetch("/api/feedback");
        if (resFb.ok) {
          const data = await resFb.json();
          setFeedbacks(data);
        }

        // Analytics report (for admin or stats module)
        const resAnal = await fetch("/api/admin/system-report");
        if (resAnal.ok) {
          const data = await resAnal.json();
          setAnalytics(data);
        }
      }
    } catch (e) {
      console.error("Failed fetching live REST database, using in-memory mock layout...", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger data fetch when current user shifts
  useEffect(() => {
    fetchData();
    // Setup interval for live notifications pull
    const interval = setInterval(() => {
      if (currentUser) {
        fetch(`/api/notifications?userId=${currentUser.id}`)
          .then(res => (res.ok ? res.json() : []))
          .then(data => setNotifications(data))
          .catch(err => console.log("Silent error reading live notifs:", err));
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [currentUser?.id, currentUser?.role]);

  // Auth: Login
  const login = async (email: string, password?: string, role?: string): Promise<boolean> => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: password || "mocked_auth_success", role })
      });

      if (resp.ok) {
        const body = await resp.json();
        setCurrentUser(body.user);
        localStorage.setItem("maju_user", JSON.stringify(body.user));
        return true;
      } else {
        const errObj = await resp.json();
        setErrorMsg(errObj.error || "Credentials invalid.");
        return false;
      }
    } catch (err) {
      setErrorMsg("Network disruption, login interface stalled.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Auth: Admin Protected Login
  const adminLogin = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const resp = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (resp.ok) {
        const body = await resp.json();
        setCurrentUser(body.user);
        localStorage.setItem("maju_user", JSON.stringify(body.user));
        
        // Storing proper admin-specific logged session key for absolute route guarding
        localStorage.setItem("maju_admin_authenticated", "true");
        return true;
      } else {
        const errObj = await resp.json();
        setErrorMsg(errObj.error || "Administrative credentials invalid.");
        return false;
      }
    } catch (err) {
      setErrorMsg("Network failure during administration validation.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Auth: Register
  const registerUser = async (formData: { name: string; email: string; role: string; rollNumber?: string; department?: string }): Promise<boolean> => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const resp = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (resp.ok) {
        const body = await resp.json();
        setCurrentUser(body.user);
        localStorage.setItem("maju_user", JSON.stringify(body.user));
        return true;
      } else {
        const errObj = await resp.json();
        setErrorMsg(errObj.error || "Failed registration constraint check.");
        return false;
      }
    } catch (err) {
      setErrorMsg("Failed contacting validation service.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Auth: Logout
  const logout = () => {
    setCurrentUser(null);
    setRegistrations([]);
    setNotifications([]);
    setCertificates([]);
    setFeedbacks([]);
    localStorage.removeItem("maju_user");
    localStorage.removeItem("maju_admin_authenticated");
  };

  // Event Creation (pending state)
  const createEvent = async (eventData: Partial<Event>): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: "Please log in first" };
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-role": currentUser.role
        },
        body: JSON.stringify({
          ...eventData,
          organizerId: currentUser.id,
          organizerName: currentUser.name
        })
      });

      if (response.ok) {
        await fetchData();
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error };
      }
    } catch (e) {
      return { success: false, error: "Unable to reach database coordinator script" };
    }
  };

  // Event Update (Approve / Schedule items update)
  const updateEvent = async (eventId: string, updateData: Partial<Event>): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: "Authentication required to update events." };
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "x-user-role": currentUser.role
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        await fetchData();
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error };
      }
    } catch (e) {
      return { success: false, error: "Network error attempting database write." };
    }
  };

  // Event Deletion
  const deleteEvent = async (eventId: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: "Authentication session has expired. Please re-authenticate." };
    try {
      const response = await fetch(`/api/events/${eventId}`, { 
        method: "DELETE",
        headers: {
          "x-user-role": currentUser.role
        }
      });
      if (response.ok) {
        await fetchData();
        return { success: true };
      } else {
        const errText = await response.text();
        let errMsg = "Access denied or database error during slot deletion.";
        try {
          const parsedErr = JSON.parse(errText);
          if (parsedErr.error) errMsg = parsedErr.error;
        } catch {
          if (errText) {
            errMsg = errText;
          }
        }
        return { success: false, error: errMsg };
      }
    } catch (e: any) {
      console.log("Delete failure:", e);
      return { success: false, error: `Connection failed: ${e.message || "Interrupted API handshake."}` };
    }
  };

  // Organizer Deletion
  const deleteOrganizer = async (organizerId: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: "Authentication session has expired. Please re-authenticate." };
    try {
      const response = await fetch(`/api/organizers/${organizerId}`, { 
        method: "DELETE",
        headers: {
          "x-user-role": currentUser.role
        }
      });
      if (response.ok) {
        await fetchData();
        return { success: true };
      } else {
        const data = await response.json().catch(() => ({ error: "Access denied or database error during organizer removal." }));
        return { success: false, error: data.error };
      }
    } catch (e: any) {
      console.log("Organizer delete failure:", e);
      return { success: false, error: `Connection failed: ${e.message || "Interrupted API handshake."}` };
    }
  };

  // Registration Trigger
  const registerForEvent = async (
    eventId: string, 
    customForm?: { studentName: string; studentRoll: string; studentDept: string }
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: "Authorization required to register for events" };
    try {
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          eventId, 
          studentId: currentUser.id,
          ...customForm
        })
      });

      if (response.ok) {
        await fetchData();
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error };
      }
    } catch (e) {
      return { success: false, error: "Failed registry handshaking." };
    }
  };

  // Attendance Trigger
  const updateAttendance = async (
    registrationId: string, 
    status: "present" | "absent" | "unmarked"
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`/api/registrations/${registrationId}/attendance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        await fetchData();
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error };
      }
    } catch (e) {
      return { success: false, error: "Failed recording attendance." };
    }
  };

  // Send Reminder Trigger
  const sendEventReminder = async (eventId: string): Promise<{ success: boolean; count?: number; error?: string }> => {
    try {
      const response = await fetch(`/api/events/${eventId}/reminder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        const data = await response.json();
        await fetchData();
        return { success: true, count: data.count };
      } else {
        const data = await response.json();
        return { success: false, error: data.error };
      }
    } catch (e) {
      return { success: false, error: "Failed sending reminders." };
    }
  };

  // Feedback Submission
  const submitFeedback = async (feedbackData: { eventId: string; rating: number; comments: string; suggestions?: string }): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: "Authentication expired." };
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...feedbackData,
          studentId: currentUser.id
        })
      });

      if (response.ok) {
        await fetchData();
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error };
      }
    } catch (e) {
      return { success: false, error: "Network error submitting user insights." };
    }
  };

  // Clear or read notifications
  const markNotificationsAsRead = async (notificationId?: string): Promise<void> => {
    if (!currentUser) return;
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationId,
          userId: currentUser.id
        })
      });
      // Synchronize client
      setNotifications(prev =>
        prev.map(n => (notificationId ? n.id === notificationId ? { ...n, read: true } : n : { ...n, read: true }))
      );
    } catch (e) {
      console.log("Failed flagging notifications read status");
    }
  };

  // Developer Feature: Switch Roles Direct for ease of assessment!
  const switchUserRoleDirectly = (role: "student" | "organizer" | "admin") => {
    let mockAccount: User;
    if (role === "student") {
      mockAccount = {
        id: "u-stud1",
        name: "Mohammad Ali (Participant)",
        email: "student@maju.edu",
        role: "student"
      };
      localStorage.removeItem("maju_admin_authenticated");
    } else if (role === "organizer") {
      mockAccount = {
        id: "u-org1",
        name: "Dr. Farah Naz (Event Organizer)",
        email: "organizer@maju.edu",
        role: "organizer"
      };
      localStorage.removeItem("maju_admin_authenticated");
    } else {
      mockAccount = {
        id: "u-admin",
        name: "Professor Tariq (Admin)",
        email: "admin@maju.edu",
        role: "admin"
      };
      localStorage.setItem("maju_admin_authenticated", "true");
    }
    
    // Automatically register/update users inside db store
    fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...mockAccount, password: "dev_bypass_pass" })
    }).catch(() => {
      // safe default bypass
    });

    setCurrentUser(mockAccount);
    localStorage.setItem("maju_user", JSON.stringify(mockAccount));
  };

  const sendOrganizerNotification = async (eventId: string, title: string, message: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/notifications/organizer-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, title, message })
      });
      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || "Failed issuing organizers dispatch alert." };
      }
    } catch (e) {
      return { success: false, error: "Network error sending notifications." };
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        events,
        registrations,
        resources,
        notifications,
        feedbacks,
        certificates,
        analytics,
        organizers,
        isLoading,
        errorMsg,
        login,
        adminLogin,
        registerUser,
        logout,
        createEvent,
        updateEvent,
        deleteEvent,
        deleteOrganizer,
        registerForEvent,
        updateAttendance,
        sendEventReminder,
        submitFeedback,
        sendOrganizerNotification,
        markNotificationsAsRead,
        fetchData,
        switchUserRoleDirectly
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be evaluated within an AppProvider structure.");
  }
  return context;
}
