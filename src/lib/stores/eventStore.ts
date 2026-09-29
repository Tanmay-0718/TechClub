import { createLocalStore, BaseEntity } from '../localStore';
import { api } from '../api';

export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface Event extends BaseEntity {
  title: string;
  description: string;
  long_description?: string;
  image_url?: string;
  event_date: string;
  date?: string;
  time?: string;
  location?: string;
  max_attendees?: number;
  capacity?: number;
  registered_count?: number;
  status: EventStatus;
  featured: boolean;
  created_by?: string;
}

export const DEFAULT_EVENTS: Event[] = [];

const store = createLocalStore<Event>('ts_events');

// Filter out demo/placeholder events so both upcoming and past sections remain empty
const filterDemoEvents = (list: Event[]): Event[] => {
  return list.filter(
    (e) => !['event-1', 'event-2', 'event-3', 'event-4'].includes(e.id)
  );
};

export const getEvents = async (): Promise<Event[]> => {
  try {
    const remote = await api.getEvents();
    if (remote && Array.isArray(remote)) {
      const nonDemo = remote.filter((e: any) => !['event-1', 'event-2', 'event-3', 'event-4'].includes(e.id));
      if (nonDemo.length > 0) {
        const mapped: Event[] = nonDemo.map((e: any) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          long_description: e.long_description || e.description,
          image_url: e.image_url || e.image || '',
          event_date: e.event_date || e.date || new Date().toISOString(),
          date: e.date || e.event_date || '',
          time: e.time || '10:00 AM',
          location: e.location || 'UTU Campus',
          max_attendees: e.max_attendees || e.capacity || 100,
          capacity: e.capacity || e.max_attendees || 100,
          registered_count: e.registered_count || 0,
          status: (e.status === 'upcoming' || e.status === 'ongoing' || e.status === 'completed' || e.status === 'cancelled') ? e.status : 'upcoming',
          featured: Boolean(e.featured),
          created_by: e.created_by || 'TechShastra',
          created_at: e.created_at || new Date().toISOString(),
        }));
        localStorage.setItem('ts_events', JSON.stringify(mapped));
        return mapped;
      }
    }
  } catch (err) {
    console.warn('Go backend API unreachable for events, using local store:', err);
  }

  const local = store.getAll();
  const cleaned = filterDemoEvents(local);
  localStorage.setItem('ts_events', JSON.stringify(cleaned));
  return cleaned;
};

export const addEvent = async (event: Omit<Event, 'id' | 'created_at'>): Promise<Event> => {
  return store.add(event);
};

export const updateEvent = async (id: string, updates: Partial<Event>): Promise<void> => {
  const result = store.update(id, updates);
  if (!result) throw new Error('Event not found');
};

export const deleteEvent = async (id: string): Promise<void> => {
  const success = store.delete(id);
  if (!success) throw new Error('Event not found');
};

export const getEventById = async (id: string): Promise<Event | null> => {
  const events = await getEvents();
  return events.find((e) => e.id === id) || null;
};
