/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "student" | "organizer" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  rollNumber?: string; // Optional for non-students
  department?: string; // Optional for non-students
}

export type EventStatus = "pending" | "approved" | "rejected";
export type EventCategory = "Seminar" | "Workshop" | "Conference" | "Academic";

export interface ScheduleItem {
  id: string;
  activityName: string;
  startTime: string; // e.g. "09:00 AM"
  endTime: string;   // e.g. "10:30 AM"
  speaker: string;
  location: string;
}

export interface Resource {
  id: string;
  name: string;
  type: "hall" | "classroom" | "equipment" | "staff" | "volunteer";
  capacity?: number; // for halls/classrooms
}

export interface ResourceAllocation {
  resourceId: string;
  resourceName: string;
  type: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "09:00 AM - 04:00 PM"
  venue: string;
  speaker: string;
  category: EventCategory;
  organizerId: string;
  organizerName: string;
  status: EventStatus;
  capacity: number;
  image: string;
  schedule: ScheduleItem[];
  resources: ResourceAllocation[];
  startTime?: string;
  endTime?: string;
}

export interface Registration {
  id: string; // Unique Registration ID
  eventId: string;
  eventTitle: string;
  eventDate: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  studentDept: string;
  studentEmail?: string;
  dateRegistered: string;
  certificateId?: string; // Present if event completed
  feedbackSubmitted?: boolean;
  attendanceStatus?: "unmarked" | "present" | "absent";
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: string; // ISO date
  type: "info" | "success" | "alert";
  read: boolean;
}

export interface Feedback {
  id: string;
  eventId: string;
  eventTitle: string;
  studentId: string;
  studentName: string;
  rating: number; // 1-5
  comments: string;
  suggestions?: string;
  date: string;
}

export interface Certificate {
  id: string;
  registrationId: string;
  studentName: string;
  studentRoll: string;
  eventName: string;
  date: string; // Completion date
  issueDate: string;
}
