/**
 * Client-side user activity tracking
 * Captures user telemetry and periodically flushes to Go backend /api/activity
 */
import { api, getAuthToken } from './api';

interface QueuedActivity {
  action: string;
  resource_type?: string;
  resource_id?: string;
  resource_name?: string;
  metadata?: string;
}

let queue: QueuedActivity[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export const flushActivityQueue = async () => {
  if (queue.length === 0) return;
  const itemsToSend = [...queue];
  queue = [];

  for (const item of itemsToSend) {
    try {
      await api.logActivity(item);
    } catch {
      // Fail silently for telemetry
    }
  }
};

export const queueActivity = (activity: QueuedActivity) => {
  queue.push(activity);

  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flushActivityQueue();
    }, 3000);
  }
};

export const trackPageView = (pageName: string) => {
  queueActivity({
    action: 'page_view',
    resource_type: 'page',
    resource_id: window.location.pathname,
    resource_name: pageName,
    metadata: JSON.stringify({
      referrer: document.referrer,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    }),
  });
};

export const trackProjectView = (projectId: string, projectTitle: string) => {
  queueActivity({
    action: 'project_view',
    resource_type: 'project',
    resource_id: projectId,
    resource_name: projectTitle,
  });
};

export const trackEventView = (eventId: string, eventTitle: string) => {
  queueActivity({
    action: 'event_view',
    resource_type: 'event',
    resource_id: eventId,
    resource_name: eventTitle,
  });
};

export const trackEventRegistration = (eventId: string, eventTitle: string, attendeeName: string) => {
  // Flush immediately for high-value actions
  api.logActivity({
    action: 'event_register',
    resource_type: 'event',
    resource_id: eventId,
    resource_name: eventTitle,
    metadata: JSON.stringify({ attendee_name: attendeeName }),
  }).catch(() => {});
};

export const trackAction = (action: string, metadata?: Record<string, unknown>) => {
  queueActivity({
    action,
    metadata: metadata ? JSON.stringify(metadata) : '{}',
  });
};

// Auto flush when window is closing
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushActivityQueue();
  });
}
