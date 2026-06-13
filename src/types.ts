/**
 * Types and schemas for the Workspace Mail AI Task Sync app.
 */

export type UrgencyLevel = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface EmailItem {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: string;
  summary?: string;
  keyTakeaways?: string[];
  urgency?: UrgencyLevel;
  hasEvent?: boolean;
  eventDetails?: {
    title: string;
    date: string;
    time?: string;
    description?: string;
  };
  meetingLink?: string;
  isArchived?: boolean;
  feedback?: {
    rating: number; // 1-5
    isHelpful: boolean;
    comment?: string;
    timestamp: string;
  };
}

export interface TaskItem {
  id: string;
  title: string;
  notes: string;
  status: 'pending' | 'completed';
  deadline: string;
  urgency: UrgencyLevel;
  category?: 'Work' | 'Personal' | 'Urgent' | 'Focus' | 'Learning' | 'Admin' | 'General';
  recurring?: 'none' | 'daily' | 'weekly' | 'monthly';
  syncedToCalendar?: boolean;
  gmailSourceId?: string;
  project?: string; // Associated project tag
  orderIndex?: number; // Optional drag-and-drop order weight prefix
  feedback?: {
    rating: number;
    isHelpful: boolean;
    comment?: string;
    timestamp: string;
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startTime: string; // ISO String
  endTime: string; // ISO String
  meetLink?: string;
  eventSourceId?: string;
  project?: string; // Associated project tag
  feedback?: {
    rating: number;
    isHelpful: boolean;
    comment?: string;
    timestamp: string;
  };
}

export interface MeetingSummary {
  id: string;
  meetingTitle: string;
  date: string;
  meetLink: string;
  summaryMarkdown: string;
  actionItems: string[];
  documentId?: string; // Google Doc ID
  slidesId?: string; // Google Slide ID
  folderPath?: string;
}

export interface KeepNote {
  id: string;
  title: string;
  content: string;
  timings?: string[]; // Extracted times e.g. "14:00"
  syncedToCalendar?: boolean;
  createdAt: string;
  stage?: 'todo' | 'progress' | 'done';
}

export interface WorkspaceSyncState {
  sheetId: string | null;
  sheetUrl: string | null;
  docId: string | null;
  docUrl: string | null;
  slidesId: string | null;
  slidesUrl: string | null;
  formId: string | null;
  formUrl: string | null;
}

export interface AppSecuritySettings {
  isEncrypted: boolean;
  passphrase?: string;
  lastBackupTime?: string;
}

export interface SlackSettings {
  webhookUrl: string;
  channelName: string;
  isEnabled: boolean;
}

export interface SlackLog {
  id: string;
  timestamp: string;
  message: string;
  status: 'sent' | 'failed';
}

export interface EmailAccountOption {
  email: string;
  label: string;
  isEnabled: boolean;
}

export interface CustomAlertSound {
  id: string;
  name: string;
  frequency: number; // For synth pitch
  type: 'sine' | 'square' | 'triangle' | 'sawtooth';
}

export interface NotificationSettings {
  accounts: EmailAccountOption[];
  frequency: 'hourly' | 'daily' | 'weekly' | 'on-demand';
  urgentSoundId: string;
  newSummarySoundId: string;
  reminderSoundId: string;
}

export interface GeneralFeedbackItem {
  id: string;
  sourceType: 'email_summary' | 'task_creation' | 'calendar_event' | 'meeting_recap' | 'task_suggestion' | 'calendar_event_suggestion';
  sourceId: string;
  sourceTitle: string;
  rating: number; // 1-5 stars
  isHelpful: boolean;
  comment: string;
  timestamp: string;
}

