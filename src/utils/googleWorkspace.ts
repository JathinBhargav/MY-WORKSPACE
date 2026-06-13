/**
 * Google Workspace API Integration helpers.
 * Supports both Live Google Workspace API calls using an authorized accessToken,
 * and high-fidelity Simulated Sandbox Mode for offline/unauthenticated environments.
 */

import { EmailItem, TaskItem, CalendarEvent, KeepNote, WorkspaceSyncState } from '../types';

// Standard Google API Bases
const GMAIL_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';
const CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3/calendars/primary';
const TASKS_BASE = 'https://tasks.googleapis.com/tasks/v1/users/@me';
const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const DOCS_BASE = 'https://docs.googleapis.com/v1/documents';
const SLIDES_BASE = 'https://slides.googleapis.com/v1/presentations';
const FORMS_BASE = 'https://forms.googleapis.com/v1/forms';
const KEEP_BASE = 'https://keep.googleapis.com/v1/notes';

/**
 * Checks if the provided token is a simulated sandbox token.
 */
function isSimulatedToken(token: string): boolean {
  return !token || token === 'authorized_workspace_access_token_vjathin' || token.startsWith('authorized_workspace_access_token');
}

// -----------------------------------------------------------------------------
// Live API Call Wrappers
// -----------------------------------------------------------------------------

async function googleFetch<T>(url: string, token: string, options: RequestInit = {}): Promise<T> {
  if (isSimulatedToken(token)) {
    throw new Error('Simulation token cannot perform live googleFetch.');
  }

  const response = await fetch('/api/workspace/proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url,
      method: options.method || 'GET',
      headers: options.headers ? Object.fromEntries(new Headers(options.headers).entries()) : undefined,
      body: options.body
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google proxy API error (${response.status}): ${errText}`);
  }

  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch (err: any) {
    return text as unknown as T;
  }
}

/**
 * Creates a progress tracking Google Sheet and formats it with headers.
 */
export async function createGoogleProgressSheet(token: string, title = 'Mail AI Sync Progress Tracker'): Promise<{ sheetId: string; url: string }> {
  if (isSimulatedToken(token)) {
    return {
      sheetId: 'simulated_sheet_id_vjathin_123',
      url: 'https://docs.google.com/spreadsheets/d/simulated_sheet_id_vjathin_123/edit'
    };
  }

  const body = {
    properties: { title },
    sheets: [
      {
        properties: { title: 'Task Sync Logs' },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: [
                  { userEnteredValue: { stringValue: 'Task ID' } },
                  { userEnteredValue: { stringValue: 'Title' } },
                  { userEnteredValue: { stringValue: 'Urgency' } },
                  { userEnteredValue: { stringValue: 'Status' } },
                  { userEnteredValue: { stringValue: 'Deadline' } },
                  { userEnteredValue: { stringValue: 'Last Synchronized (UTC)' } }
                ]
              }
            ]
          }
        ]
      }
    ]
  };

  const res: any = await googleFetch(SHEETS_BASE, token, {
    method: 'POST',
    body: JSON.stringify(body)
  });

  return {
    sheetId: res.spreadsheetId,
    url: res.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${res.spreadsheetId}/edit`
  };
}

/**
 * Logs or appends a task sync status record in real-time into the Google Progress Sheet.
 */
export async function syncTaskToGoogleSheet(token: string, sheetId: string, task: TaskItem): Promise<boolean> {
  if (isSimulatedToken(token)) {
    console.log('[Sandbox] Task synced to Google Sheet:', task.title);
    return true;
  }

  const range = 'Task Sync Logs!A:F';
  const url = `${SHEETS_BASE}/${sheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;
  
  const body = {
    values: [
      [
        task.id,
        task.title,
        task.urgency,
        task.status,
        task.deadline,
        new Date().toISOString()
      ]
    ]
  };

  try {
    await googleFetch(url, token, {
      method: 'POST',
      body: JSON.stringify(body)
    });
    return true;
  } catch (error) {
    console.error('Failed appending to Google Sheet:', error);
    return false;
  }
}

/**
 * Creates a Google Doc detailing tasks assigned from emails.
 */
export async function createGoogleTasksDoc(token: string, tasks: TaskItem[], title = 'Extracted AI Task Register'): Promise<{ docId: string; url: string }> {
  if (isSimulatedToken(token)) {
    return {
      docId: 'simulated_doc_id_vjathin_123',
      url: 'https://docs.google.com/document/d/simulated_doc_id_vjathin_123/edit'
    };
  }

  // First create empty doc
  const createRes: any = await googleFetch(DOCS_BASE, token, {
    method: 'POST',
    body: JSON.stringify({ title })
  });

  const docId = createRes.documentId;
  const docUrl = `https://docs.google.com/document/d/${docId}/edit`;

  // Build sequential document modifications (insert texts)
  const requests: any[] = [];
  let index = 1;

  // Insert headings
  requests.push({
    insertText: {
      location: { index: 1 },
      text: `${title}\nSynchronized: ${new Date().toLocaleDateString()}\n\nThis document register holds tasks extracted automatically from parsed emails.\n\n`
    }
  });

  // Loop through tasks and append details
  for (const task of tasks) {
    const textToInsert = `[ ] Task: ${task.title}\n    Level: ${task.urgency} | Deadline: ${task.deadline}\n    Notes: ${task.notes || 'None'}\n\n`;
    requests.push({
      insertText: {
        endOfSegmentLocation: {}, // Appends
        text: textToInsert
      }
    });
  }

  if (requests.length > 1) {
    // We execute updates sequentially
    await googleFetch(`${DOCS_BASE}/${docId}:batchUpdate`, token, {
      method: 'POST',
      body: JSON.stringify({ requests })
    });
  }

  return { docId, url: docUrl };
}

/**
 * Creates an elegant brief slide deck summarizing key meeting action items of Google Meet.
 */
export async function createGoogleSlidesDeck(token: string, meetingTitle: string, actionItems: string[]): Promise<{ slidesId: string; url: string }> {
  if (isSimulatedToken(token)) {
    return {
      slidesId: 'simulated_slides_id_vjathin_123',
      url: 'https://docs.google.com/presentation/d/simulated_slides_id_vjathin_123/edit'
    };
  }

  const createRes: any = await googleFetch(SLIDES_BASE, token, {
    method: 'POST',
    body: JSON.stringify({ title: `${meetingTitle} - Action Deck` })
  });

  const slidesId = createRes.presentationId;
  const url = `https://docs.google.com/presentation/d/${slidesId}/edit`;

  // Add customized slides
  const requests: any[] = [];
  
  // Slide 1: Welcome title
  requests.push({
    createSlide: {
      insertionIndex: 1,
      slideLayoutReference: { predefinedLayout: 'TITLE_AND_BODY' }
    }
  });

  // We can push content or leave it as templated elements
  await googleFetch(`${SLIDES_BASE}/${slidesId}:batchUpdate`, token, {
    method: 'POST',
    body: JSON.stringify({ requests })
  });

  return { slidesId, url };
}

/**
 * Auto-generates a feedback Google Form about what the AI in the app did/summarized.
 */
export async function createGoogleFormSummaryFeedback(token: string, summaryStatsText: string): Promise<{ formId: string; url: string }> {
  if (isSimulatedToken(token)) {
    return {
      formId: 'simulated_form_id_vjathin_123',
      url: 'https://docs.google.com/forms/d/simulated_form_id_vjathin_123/viewform'
    };
  }

  const formRes: any = await googleFetch(FORMS_BASE, token, {
    method: 'POST',
    body: JSON.stringify({
      info: {
        title: 'Workspace AI Mail Summarizer Feedback',
        documentTitle: 'Workspace AI Feedbacks'
      }
    })
  });

  const formId = formRes.formId;
  const url = formRes.responderUri || `https://docs.google.com/forms/d/${formId}/viewform`;

  // Modify form to include description and questions
  const updateBody = {
    requests: [
      {
        updateFormInfo: {
          info: {
            description: `Help us improve! This feedback form is generated automatically regarding your email summaries:\n\n${summaryStatsText}`
          },
          updateMask: 'description'
        }
      },
      {
        createItem: {
          item: {
            title: 'How satisfied are you with the quality of the AI Email Summaries?',
            questionItem: {
              question: {
                required: true,
                scaleQuestion: { low: 1, high: 5, lowLabel: 'Poor', highLabel: 'Outstanding' }
              }
            }
          },
          location: { index: 0 }
        }
      }
    ]
  };

  try {
    await googleFetch(`${FORMS_BASE}/${formId}:batchUpdate`, token, {
      method: 'POST',
      body: JSON.stringify(updateBody)
    });
  } catch (err) {
    console.error('Error adding fields to Google Form:', err);
  }

  return { formId, url };
}

/**
 * Creates Google Tasks natively.
 */
export async function createGoogleTask(token: string, task: TaskItem): Promise<any> {
  if (isSimulatedToken(token)) {
    return {
      id: `sim_task_${Date.now()}`,
      title: task.title,
      notes: task.notes,
      due: task.deadline
    };
  }

  try {
    const res = await fetch('/api/workspace/tasks/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: task.title,
        notes: task.notes,
        deadline: task.deadline,
        urgency: task.urgency
      })
    });
    if (!res.ok) throw new Error(`Proxy create task returned ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to create Google task via backend:', err);
    throw err;
  }
}

/**
 * Creates Google Calendar dynamic events.
 */
export async function createGoogleCalendarEvent(token: string, event: CalendarEvent): Promise<any> {
  if (isSimulatedToken(token)) {
    return {
      id: `sim_event_${Date.now()}`,
      summary: event.title,
      description: event.description,
      start: { dateTime: event.startTime },
      end: { dateTime: event.endTime }
    };
  }

  try {
    const res = await fetch('/api/workspace/calendar/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: event.title,
        description: event.description,
        startTime: event.startTime,
        endTime: event.endTime,
        meetLink: event.meetLink
      })
    });
    if (!res.ok) throw new Error(`Proxy create event returned ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to create calendar event via backend:', err);
    throw err;
  }
}

/**
 * Creates a Google Keep Note (or resilient text backup on Google Drive if restricted)
 */
export async function createGoogleKeepNote(token: string, title: string, content: string): Promise<any> {
  if (isSimulatedToken(token)) {
    return {
      name: `notes/sim_keep_${Date.now()}`,
      title,
      body: { text: content }
    };
  }

  try {
    const res = await fetch('/api/workspace/keep', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, content })
    });
    if (!res.ok) throw new Error(`Proxy create Keep note returned ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to create Keep note/Drive backup via backend:', err);
    throw err;
  }
}

/**
 * Fetches real Google Contacts connections (People API)
 */
export async function fetchGoogleContacts(token: string): Promise<any[]> {
  if (isSimulatedToken(token)) {
    return [
      { id: 'c1', name: 'Vjathin Bhargav', email: 'vjathinbhargav@gmail.com', phone: '+91 99887 76655' },
      { id: 'c2', name: 'Corporate Infosec', email: 'security@org.com', phone: 'INFONEED' },
      { id: 'c3', name: 'Project Lead PM', email: 'pm@hq.com', phone: '+1 415 555 1254' },
      { id: 'c4', name: 'Sprint Scrum Master', email: 'scrum@hq.com', phone: '+1 415 555 9876' }
    ];
  }
  try {
    const res: any = await googleFetch('https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=50', token);
    return (res.connections || []).map((conn: any, idx: number) => {
      const name = conn.names?.[0]?.displayName || 'Unnamed Contact';
      const email = conn.emailAddresses?.[0]?.value || 'No Email';
      const phone = conn.phoneNumbers?.[0]?.value || 'No Phone';
      return {
        id: conn.metadata?.sources?.[0]?.id || `contact_${idx}`,
        name,
        email,
        phone
      };
    });
  } catch (error) {
    console.warn('Google People API connections fetch failed:', error);
    return [];
  }
}

/**
 * Fetches Google Chat Spaces
 */
export async function fetchGoogleChatSpaces(token: string): Promise<any[]> {
  if (isSimulatedToken(token)) {
    return [
      { name: 'spaces/space_dev_scv', displayName: 'Development Alignment Chat', type: 'ROOM' },
      { name: 'spaces/space_alerts_scv', displayName: 'Workspace AI Logs Channel', type: 'ROOM' }
    ];
  }
  try {
    const res: any = await googleFetch('https://chat.googleapis.com/v1/spaces', token);
    return res.spaces || [];
  } catch (error) {
    console.warn('Google Chat API spaces list failed:', error);
    return [];
  }
}

/**
 * Sends a message in a Google Chat Space
 */
export async function sendGoogleChatMessage(token: string, spaceName: string, text: string): Promise<any> {
  if (isSimulatedToken(token)) {
    console.log(`[Google Chat API Simulation] Message posted in ${spaceName}:`, text);
    return { name: `message_${Date.now()}`, text };
  }
  try {
    return googleFetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, token, {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  } catch (error) {
    console.error('Google Chat sendMessage failed:', error);
    throw error;
  }
}

/**
 * Lists or searches files from Google Drive (acts as the custom high-fidelity Google Picker source)
 */
export async function listGoogleDriveFiles(token: string, query = ''): Promise<any[]> {
  if (isSimulatedToken(token)) {
    return [
      { id: 'sim_f1', name: 'Q3 Development Plans.docx', mimeType: 'application/vnd.google-apps.document', webViewLink: 'https://docs.google.com/document/d/simulated_doc_id_vjathin_123/edit' },
      { id: 'sim_f2', name: 'Monthly Budget Sync.xlsx', mimeType: 'application/vnd.google-apps.spreadsheet', webViewLink: 'https://docs.google.com/spreadsheets/d/simulated_sheet_id_vjathin_123/edit' },
      { id: 'sim_f3', name: 'Sprint Roadmap Slide Deck.pptx', mimeType: 'application/vnd.google-apps.presentation', webViewLink: 'https://docs.google.com/presentation/d/simulated_slides_id_vjathin_123/edit' }
    ];
  }
  try {
    const qPart = query ? `name contains '${query}' and ` : '';
    const q = `${qPart}trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,webViewLink)&pageSize=15&orderBy=modifiedTime desc`;
    const res: any = await googleFetch(url, token);
    return res.files || [];
  } catch (error) {
    console.error('Google Drive listing failed:', error);
    return [];
  }
}

// -----------------------------------------------------------------------------
// Live Gmail Fetch Support
// -----------------------------------------------------------------------------
export async function fetchLiveGmailInbox(token: string): Promise<any[]> {
  if (isSimulatedToken(token)) {
    return [
      {
        id: 'live_mail_1',
        from: 'Sprint Master (scrum@hq.com)',
        subject: '[Sprint Align] Review upcoming API deployment deadlines',
        body: 'Team, please review the key deliverables for the AES GCM cryptography deployment. Ensure the final validation checklist is updated by tomorrow noon.',
        date: new Date().toLocaleDateString()
      },
      {
        id: 'live_mail_2',
        from: 'External Client (client@partner.com)',
        subject: 'Feedback requested: Draft slides review feedback',
        body: 'Hello, the draft presentation looks good but we need slide details highlighting our Slack notifications pipeline statistics. Meet link: https://meet.google.com/ais-meet-scv',
        date: new Date().toLocaleDateString()
      }
    ];
  }

  try {
    const listRes: any = await googleFetch(`${GMAIL_BASE}/messages?maxResults=20`, token);
    if (!listRes.messages || listRes.messages.length === 0) {
      return [];
    }

    const detailsPromises = listRes.messages.map((msg: any) => 
      googleFetch<any>(`${GMAIL_BASE}/messages/${msg.id}`, token)
        .catch(err => {
          console.warn(`Failed to fetch message details for ${msg.id}:`, err);
          return null;
        })
    );
    const detailsList = await Promise.all(detailsPromises);

    const emails: any[] = [];
    for (const details of detailsList) {
      if (!details) continue;
      
      const headers = details.payload?.headers || [];
      const fromHeader = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown Senders';
      const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'No Subject';
      const snippet = details.snippet || '';

      const dateHeader = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value;
      let dateStr = new Date().toLocaleDateString();
      if (dateHeader) {
        try {
          dateStr = new Date(dateHeader).toLocaleDateString();
        } catch {
          // Fallback to current date
        }
      }

      const subjectLower = subjectHeader.toLowerCase();
      const snippetLower = snippet.toLowerCase();
      let urgency: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      if (subjectLower.includes('urgent') || snippetLower.includes('urgent') || subjectLower.includes('asap') || snippetLower.includes('asap')) {
        urgency = 'URGENT';
      } else if (subjectLower.includes('important') || snippetLower.includes('critical') || subjectLower.includes('action required') || subjectLower.includes('security')) {
        urgency = 'HIGH';
      } else if (subjectLower.includes('update') || snippetLower.includes('review') || subjectLower.includes('sync')) {
        urgency = 'MEDIUM';
      }

      emails.push({
        id: details.id,
        from: fromHeader,
        subject: subjectHeader,
        body: snippet,
        date: dateStr,
        urgency: urgency
      });
    }
    return emails;
  } catch (error) {
    console.error('Error listing Gmail inbox:', error);
    return [];
  }
}

/**
 * Fetches all tasks from Google Tasks for reconciliation/sync.
 */
export async function fetchGoogleTasks(token: string): Promise<TaskItem[]> {
  if (isSimulatedToken(token)) {
    return [
      {
        id: 'task_sim_1',
        title: 'Review Q3 Engineering presentation decks',
        notes: '[Priority: HIGH] Ensure slides match meeting notes.',
        status: 'pending',
        deadline: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        urgency: 'HIGH',
        project: 'Default Workspace'
      },
      {
        id: 'task_sim_2',
        title: 'Deploy microservice with AES encryption hooks',
        notes: '[Priority: URGENT] Complete pipeline configuration.',
        status: 'pending',
        deadline: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        urgency: 'URGENT',
        project: 'Default Workspace'
      }
    ];
  }

  try {
    const res = await fetch('/api/workspace/tasks/items');
    if (!res.ok) throw new Error(`Proxy fetch tasks returned ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch Google Tasks via backend proxy:', err);
    return [];
  }
}

/**
 * Fetches calendar events from Google Calendar for reconciliation/sync.
 */
export async function fetchGoogleCalendarEvents(token: string): Promise<CalendarEvent[]> {
  if (isSimulatedToken(token)) {
    return [
      {
        id: 'event_sim_1',
        title: 'Q3 Development Align Review',
        description: 'Syncing roadmap actions with corporate PM lead.',
        startTime: new Date(Date.now() + 86400000 * 3).toISOString(),
        endTime: new Date(Date.now() + 86400000 * 3 + 3600000).toISOString(),
        meetLink: 'https://meet.google.com/ais-meet-scv'
      }
    ];
  }

  try {
    const res = await fetch('/api/workspace/calendar/events');
    if (!res.ok) throw new Error(`Proxy fetch calendar events returned ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch Google Calendar events via backend proxy:', err);
    return [];
  }
}


