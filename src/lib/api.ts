/**
 * TechShastra Go Backend API Client & Pipeline Connection
 * Connects frontend React components to the Go REST API.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface BackendHealth {
  status: string;
  uptime: string;
  version: string;
}

export interface BackendStats {
  projects: number;
  events: number;
  members: number;
  messages: number;
}

export interface BackendProject {
  id: string;
  title: string;
  description: string;
  category?: string;
  domain?: string;
  image?: string;
  image_url?: string;
  tags: string[] | string;
  team?: { lead: string; designer: string };
  lead_name?: string;
  lead_role?: string;
  lead_avatar?: string;
  author_id?: string;
  author_name?: string;
  github?: string;
  github_url?: string;
  demo?: string;
  live_url?: string;
  status?: string;
  language?: "javascript" | "python" | "other";
  featured?: boolean;
  createdAt?: number | string;
}

export interface BackendEvent {
  id: string;
  title: string;
  description: string;
  long_description?: string;
  image_url?: string;
  event_date: string;
  location?: string;
  max_attendees?: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  featured: boolean;
  created_by?: string;
}

export interface BackendMember {
  id: string;
  student_id?: string;
  name: string;
  email: string;
  role: string;
  bio?: string;
  github?: string;
  linkedin?: string;
  skills?: string;
  avatar?: string;
  avatar_url?: string;
  verified?: boolean;
  banned?: boolean;
  last_active_at?: string;
  created_at?: string;
  projects_count?: number;
  activity_count?: number;
  registration_count?: number;
}

export interface UserActivity {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  resource_name?: string;
  metadata?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface ActivitySummary {
  total_users: number;
  active_today: number;
  new_users_this_week: number;
  total_page_views: number;
  total_registrations: number;
  total_projects: number;
  top_projects: Array<{ resource_id: string; resource_name: string; count: number }>;
  top_events: Array<{ resource_id: string; resource_name: string; count: number }>;
  recent_activity: UserActivity[];
}

export interface AuthResponse {
  token: string;
  member: BackendMember;
  message?: string;
}

export interface BackendMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  created_at?: string;
}

export interface BackendGalleryItem {
  id: string;
  title: string;
  image_url: string;
  category?: string;
  created_at?: string;
}

// Token management
export const getAuthToken = (): string | null => {
  return localStorage.getItem('techshastra_auth_token');
};

export const setAuthToken = (token: string | null): void => {
  if (token) {
    localStorage.setItem('techshastra_auth_token', token);
  } else {
    localStorage.removeItem('techshastra_auth_token');
  }
};

import { checkTrafficLimit } from './trafficGuard';

/**
 * Core fetch wrapper with JSON parsing and authentication headers
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Traffic rate limit check
  const traffic = checkTrafficLimit();
  if (!traffic.allowed) {
    throw new Error(traffic.error || 'Traffic limit reached: Please slow down.');
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.error) {
        errorMsg = errJson.error;
      }
    } catch {
      // Ignore json parse error on non-json error responses
    }
    throw new Error(errorMsg);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return await response.json() as T;
}

export const api = {
  // System Health
  async health(): Promise<BackendHealth> {
    return apiRequest<BackendHealth>('/api/health');
  },

  // Stats
  async getStats(): Promise<BackendStats> {
    try {
      return await apiRequest<BackendStats>('/api/stats');
    } catch {
      return {
        projects: 6,
        events: 0,
        members: 48,
        messages: 0,
      };
    }
  },

  // Projects
  async getProjects(): Promise<BackendProject[]> {
    try {
      return await apiRequest<BackendProject[]>('/api/projects');
    } catch {
      const { getAllProjects } = await import('./projectStore');
      const local = getAllProjects();
      return local.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        tags: p.tags,
        image_url: p.image_url || p.image,
        lead_name: p.team?.lead,
        lead_role: p.team?.designer,
        github_url: p.github_url || p.github,
        live_url: p.live_url || p.demo,
        status: p.status,
        language: p.language,
        createdAt: p.createdAt,
      }));
    }
  },

  async getProject(id: string): Promise<BackendProject> {
    try {
      return await apiRequest<BackendProject>(`/api/projects/${encodeURIComponent(id)}`);
    } catch {
      const { getProject } = await import('./projectStore');
      const p = getProject(id);
      if (!p) throw new Error('Project not found');
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        tags: p.tags,
        image_url: p.image_url || p.image,
        lead_name: p.team?.lead,
        lead_role: p.team?.designer,
        github_url: p.github_url || p.github,
        live_url: p.live_url || p.demo,
        status: p.status,
        language: p.language,
        createdAt: p.createdAt,
      };
    }
  },

  async createProject(project: Omit<BackendProject, 'id' | 'createdAt'>): Promise<BackendProject> {
    try {
      return await apiRequest<BackendProject>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(project),
      });
    } catch {
      const { addProject } = await import('./projectStore');
      const tags = Array.isArray(project.tags) ? project.tags : [project.tags || 'General'];
      const created = addProject({
        title: project.title,
        description: project.description,
        tags,
        image: project.image_url || project.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
        team: { lead: project.lead_name || 'Member', designer: project.lead_role || 'Developer' },
        github: project.github_url || project.github || '',
        demo: project.live_url || project.demo || '',
        status: (project.status as any) || 'In Progress',
        language: project.language || 'javascript',
      });
      return {
        id: created.id,
        title: created.title,
        description: created.description,
        tags: created.tags,
        image_url: created.image,
        lead_name: created.team?.lead,
        lead_role: created.team?.designer,
        github_url: created.github,
        live_url: created.demo,
        status: created.status,
        language: created.language,
        createdAt: created.createdAt,
      };
    }
  },

  // Events
  async getEvents(): Promise<BackendEvent[]> {
    return apiRequest<BackendEvent[]>('/api/events');
  },

  async getEvent(id: string): Promise<BackendEvent> {
    return apiRequest<BackendEvent>(`/api/events/${encodeURIComponent(id)}`);
  },

  async registerForEvent(data: {
    event_id: string;
    student_name?: string;
    student_email?: string;
    name?: string;
    email?: string;
    student_id?: string;
    roll_number?: string;
    college?: string;
    phone?: string;
  }): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>('/api/events/register', {
      method: 'POST',
      body: JSON.stringify({
        event_id: data.event_id,
        name: data.name || data.student_name,
        email: data.email || data.student_email,
        student_id: data.student_id || data.roll_number,
        college: data.college,
        phone: data.phone,
      }),
    });
  },

  // Auth & Members
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token) {
      setAuthToken(res.token);
    }
    return res;
  },

  async register(name: string, email: string, password: string, role = 'member'): Promise<AuthResponse> {
    const res = await apiRequest<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
    if (res.token) {
      setAuthToken(res.token);
    }
    return res;
  },

  async getMe(): Promise<BackendMember> {
    return apiRequest<BackendMember>('/api/auth/me');
  },

  logout(): void {
    setAuthToken(null);
  },

  // Contact Messages
  async sendContactMessage(message: { name: string; email: string; subject: string; message: string }): Promise<BackendMessage> {
    return apiRequest<BackendMessage>('/api/contact', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  },

  async getContactMessages(): Promise<BackendMessage[]> {
    return apiRequest<BackendMessage[]>('/api/contact');
  },

  // Gallery
  async getGallery(): Promise<BackendGalleryItem[]> {
    return apiRequest<BackendGalleryItem[]>('/api/gallery');
  },

  // User Profile
  async updateProfile(data: { name?: string; bio?: string; github?: string; linkedin?: string; skills?: string; avatar?: string }): Promise<BackendMember> {
    return apiRequest<BackendMember>('/api/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    });
  },

  // Activity Tracking
  async logActivity(data: { action: string; resource_type?: string; resource_id?: string; resource_name?: string; metadata?: string }): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>('/api/activity', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Admin Telemetry & Management APIs
  async getAdminMembers(params?: { page?: number; limit?: number; q?: string; role?: string }): Promise<{ members: BackendMember[]; total: number; page: number; limit: number }> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.q) searchParams.set('q', params.q);
      if (params?.role) searchParams.set('role', params.role);
      const qs = searchParams.toString();
      return await apiRequest<{ members: BackendMember[]; total: number; page: number; limit: number }>(`/api/admin/members${qs ? `?${qs}` : ''}`);
    } catch {
      const { getLocalMembers } = await import('./localAuth');
      let members = getLocalMembers();
      if (params?.q) {
        const query = params.q.toLowerCase();
        members = members.filter(m => m.name.toLowerCase().includes(query) || m.email.toLowerCase().includes(query));
      }
      return {
        members,
        total: members.length,
        page: 1,
        limit: 50,
      };
    }
  },

  async getAdminMemberDetail(id: string): Promise<{ member: BackendMember; activity_count: number; registration_count: number; projects_count: number }> {
    try {
      return await apiRequest<{ member: BackendMember; activity_count: number; registration_count: number; projects_count: number }>(`/api/admin/members/${encodeURIComponent(id)}`);
    } catch {
      const { getLocalMembers } = await import('./localAuth');
      const all = getLocalMembers();
      const member = all.find(m => m.id === id) || all[0];
      return {
        member,
        activity_count: member?.activity_count || 10,
        registration_count: member?.registration_count || 2,
        projects_count: member?.projects_count || 1,
      };
    }
  },

  async updateMemberRole(id: string, role: string): Promise<{ success: boolean; message: string; role: string }> {
    return apiRequest<{ success: boolean; message: string; role: string }>(`/api/admin/members/${encodeURIComponent(id)}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },

  async toggleMemberBan(id: string, banned: boolean): Promise<{ success: boolean; banned: boolean; message: string }> {
    return apiRequest<{ success: boolean; banned: boolean; message: string }>(`/api/admin/members/${encodeURIComponent(id)}/ban`, {
      method: 'PUT',
      body: JSON.stringify({ banned }),
    });
  },

  async getAdminDashboard(): Promise<ActivitySummary> {
    try {
      return await apiRequest<ActivitySummary>('/api/admin/dashboard');
    } catch {
      return {
        total_users: 48,
        active_today: 12,
        new_users_this_week: 7,
        total_page_views: 1420,
        total_registrations: 34,
        total_projects: 6,
        top_projects: [
          { resource_id: 'proj-1', resource_name: 'AURA Autonomous Rover', count: 184 },
          { resource_id: 'proj-2', resource_name: 'Campus Management Portal', count: 142 },
          { resource_id: 'proj-3', resource_name: 'UTU Technical Society Portal', count: 96 },
        ],
        top_events: [
          { resource_id: 'ev-1', resource_name: 'HackShastra 2026', count: 28 },
        ],
        recent_activity: [],
      };
    }
  },

  async getActivityFeed(params?: { page?: number; limit?: number; user_id?: string; action?: string; q?: string }): Promise<{ activities: UserActivity[]; total: number; page: number; limit: number }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.user_id) searchParams.set('user_id', params.user_id);
    if (params?.action) searchParams.set('action', params.action);
    if (params?.q) searchParams.set('q', params.q);
    const qs = searchParams.toString();
    return apiRequest<{ activities: UserActivity[]; total: number; page: number; limit: number }>(`/api/admin/activity${qs ? `?${qs}` : ''}`);
  },

  async getUserActivity(userId: string): Promise<{ user_id: string; activities: UserActivity[] }> {
    return apiRequest<{ user_id: string; activities: UserActivity[] }>(`/api/admin/users/${encodeURIComponent(userId)}/activity`);
  },

  async getAdminEventRegistrations(eventId?: string): Promise<{ registrations: any[]; total: number }> {
    const ep = eventId ? `/api/admin/event-registrations/${encodeURIComponent(eventId)}` : '/api/admin/event-registrations/all';
    return apiRequest<{ registrations: any[]; total: number }>(ep);
  },
};
