import { z } from 'zod';
import { EmailItem, TaskItem, CalendarEvent, MeetingSummary, KeepNote, UrgencyLevel, GeneralFeedbackItem } from '../types';

// Urgency level schema helper
const UrgencyLevelSchema = z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']);

// Feedback schema helper
const FeedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  isHelpful: z.boolean(),
  comment: z.string().optional(),
  timestamp: z.string()
});

// Zod schemas for the models
export const emailItemSchema = z.object({
  id: z.string(),
  from: z.string().default('Unknown'),
  subject: z.string().default('(No Subject)'),
  body: z.string().default(''),
  date: z.string(),
  summary: z.string().optional(),
  keyTakeaways: z.array(z.string()).optional(),
  urgency: UrgencyLevelSchema.optional(),
  hasEvent: z.boolean().optional(),
  eventDetails: z.object({
    title: z.string(),
    date: z.string(),
    time: z.string().optional(),
    description: z.string().optional()
  }).optional(),
  meetingLink: z.string().optional(),
  isArchived: z.boolean().optional().default(false),
  feedback: FeedbackSchema.optional()
});

export const taskItemSchema = z.object({
  id: z.string(),
  title: z.string().default('Untitled Task'),
  notes: z.string().default(''),
  status: z.enum(['pending', 'completed']).default('pending'),
  deadline: z.string().default(''),
  urgency: UrgencyLevelSchema.default('LOW'),
  category: z.enum(['Work', 'Personal', 'Urgent']).optional().default('Work'),
  recurring: z.enum(['none', 'daily', 'weekly', 'monthly']).optional(),
  syncedToCalendar: z.boolean().optional().default(false),
  gmailSourceId: z.string().optional(),
  project: z.string().optional(),
  orderIndex: z.number().optional(),
  feedback: FeedbackSchema.optional()
});

export const calendarEventSchema = z.object({
  id: z.string(),
  title: z.string().default('Untitled Event'),
  description: z.string().default(''),
  startTime: z.string(),
  endTime: z.string(),
  meetLink: z.string().optional(),
  eventSourceId: z.string().optional(),
  project: z.string().optional(),
  feedback: FeedbackSchema.optional()
});

export const meetingSummarySchema = z.object({
  id: z.string(),
  meetingTitle: z.string().default('Untitled Meeting Review'),
  date: z.string(),
  meetLink: z.string().default(''),
  summaryMarkdown: z.string().default(''),
  actionItems: z.array(z.string()).default([]),
  documentId: z.string().optional(),
  slidesId: z.string().optional(),
  folderPath: z.string().optional()
});

export const keepNoteSchema = z.object({
  id: z.string(),
  title: z.string().default('Untitled Note'),
  content: z.string().default(''),
  timings: z.array(z.string()).optional(),
  syncedToCalendar: z.boolean().optional().default(false),
  createdAt: z.string()
});

export const generalFeedbackSchema = z.object({
  id: z.string(),
  sourceType: z.enum(['email_summary', 'task_creation', 'calendar_event', 'meeting_recap']),
  sourceId: z.string(),
  sourceTitle: z.string(),
  rating: z.number().min(1).max(5),
  isHelpful: z.boolean(),
  comment: z.string().default(''),
  timestamp: z.string()
});

// Safe validation wrapper functions
export function validateEmailItem(data: unknown): EmailItem {
  return emailItemSchema.parse(data) as EmailItem;
}

export function validateEmailItems(data: unknown): EmailItem[] {
  return z.array(emailItemSchema).parse(data) as EmailItem[];
}

export function validateTaskItem(data: unknown): TaskItem {
  return taskItemSchema.parse(data) as TaskItem;
}

export function validateTaskItems(data: unknown): TaskItem[] {
  return z.array(taskItemSchema).parse(data) as TaskItem[];
}

export function validateCalendarEvent(data: unknown): CalendarEvent {
  return calendarEventSchema.parse(data) as CalendarEvent;
}

export function validateCalendarEvents(data: unknown): CalendarEvent[] {
  return z.array(calendarEventSchema).parse(data) as CalendarEvent[];
}

export function validateMeetingSummary(data: unknown): MeetingSummary {
  return meetingSummarySchema.parse(data) as MeetingSummary;
}

export function validateMeetingSummaries(data: unknown): MeetingSummary[] {
  return z.array(meetingSummarySchema).parse(data) as MeetingSummary[];
}

export function validateKeepNote(data: unknown): KeepNote {
  return keepNoteSchema.parse(data) as KeepNote;
}

export function validateKeepNotes(data: unknown): KeepNote[] {
  return z.array(keepNoteSchema).parse(data) as KeepNote[];
}

export function validateGeneralFeedback(data: unknown): GeneralFeedbackItem {
  return generalFeedbackSchema.parse(data) as GeneralFeedbackItem;
}

export function validateGeneralFeedbacks(data: unknown): GeneralFeedbackItem[] {
  return z.array(generalFeedbackSchema).parse(data) as GeneralFeedbackItem[];
}
