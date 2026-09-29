import { createLocalStore, BaseEntity } from '../localStore';
import { api } from '../api';

export interface ContactMessage extends BaseEntity {
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
}

const store = createLocalStore<ContactMessage>('ts_messages');

export const getMessages = async (): Promise<ContactMessage[]> => {
  try {
    const remote = await api.getContactMessages();
    if (remote && Array.isArray(remote) && remote.length > 0) {
      return remote.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        subject: m.subject,
        message: m.message,
        read: m.read,
        created_at: m.created_at || new Date().toISOString(),
      }));
    }
  } catch (err) {
    console.warn('Go backend API unreachable for contact messages, using local store:', err);
  }
  return store.getAll();
};

export const addMessage = async (message: Omit<ContactMessage, 'id' | 'created_at'>): Promise<ContactMessage> => {
  // Try sending to Go backend
  try {
    const remote = await api.sendContactMessage({
      name: message.name,
      email: message.email,
      subject: message.subject,
      message: message.message,
    });
    const local = store.add({
      ...message,
      read: remote.read,
    });
    return local;
  } catch (err) {
    console.warn('Go backend unreachable, saving message locally:', err);
    return store.add(message);
  }
};

export const markMessageRead = async (id: string, read: boolean = true): Promise<void> => {
  const result = store.update(id, { read });
  if (!result) throw new Error('Message not found');
};

export const deleteMessage = async (id: string): Promise<void> => {
  const success = store.delete(id);
  if (!success) throw new Error('Message not found');
};
