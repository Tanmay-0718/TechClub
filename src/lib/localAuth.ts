/**
 * Local resilient fallback authentication for TechShastra.
 * Ensures the website functions smoothly on Vercel even when the Go backend
 * is offline or not yet connected to a cloud database.
 */
import { BackendMember } from './api';

const MEMBERS_KEY = 'techshastra_local_members';
const PASSWORDS_KEY = 'techshastra_local_passwords';
const CURRENT_USER_KEY = 'techshastra_current_user';

// Simple deterministic hash for local fallback
export function hashPassword(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'lh_' + Math.abs(hash).toString(16) + '_' + str.length;
}

export function getLocalMembers(): BackendMember[] {
  try {
    const data = localStorage.getItem(MEMBERS_KEY);
    if (!data) return getInitialSeedMembers();
    return JSON.parse(data);
  } catch {
    return getInitialSeedMembers();
  }
}

function getInitialSeedMembers(): BackendMember[] {
  return [
    {
      id: 'admin_1',
      name: 'Super Admin',
      email: 'admin@techshastra.club',
      role: 'admin',
      bio: 'TechShastra Lead Administrator & Faculty Coordinator',
      skills: 'Full Stack, Go, Cloud Architecture, DevOps',
      github: 'https://github.com/Tanmay-0718',
      created_at: new Date('2026-01-01').toISOString(),
      projects_count: 5,
      activity_count: 42,
      registration_count: 10,
    },
    {
      id: 'student_1',
      name: 'Tanmay Nautiyal',
      email: 'nautiyaltanmay00@gmail.com',
      role: 'student',
      student_id: '250000101094',
      bio: 'Robotics and Full Stack Developer exploring AI and Cloud Systems.',
      skills: 'React, Go, Python, ROS, AI',
      github: 'https://github.com/Tanmay-0718',
      created_at: new Date().toISOString(),
      projects_count: 2,
      activity_count: 15,
      registration_count: 3,
    }
  ];
}

export function saveLocalMember(member: BackendMember, plainPassword?: string): void {
  const members = getLocalMembers();
  const index = members.findIndex(m => m.email.toLowerCase() === member.email.toLowerCase());
  if (index >= 0) {
    members[index] = { ...members[index], ...member };
  } else {
    members.push(member);
  }
  try {
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
    if (plainPassword) {
      const passwords = getStoredPasswords();
      passwords[member.email.toLowerCase()] = hashPassword(plainPassword);
      localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
    }
  } catch (err) {
    console.error('Failed to save member to localStorage:', err);
  }
}

function getStoredPasswords(): Record<string, string> {
  try {
    const data = localStorage.getItem(PASSWORDS_KEY);
    if (!data) {
      return {
        'admin@techshastra.club': hashPassword('admin123'),
        'nautiyaltanmay00@gmail.com': hashPassword('password123'),
      };
    }
    return JSON.parse(data);
  } catch {
    return {
      'admin@techshastra.club': hashPassword('admin123'),
    };
  }
}

export function verifyLocalMember(email: string, plainPassword: string): BackendMember | null {
  const normEmail = email.trim().toLowerCase();
  const members = getLocalMembers();
  const member = members.find(m => m.email.toLowerCase() === normEmail);
  if (!member) return null;

  const passwords = getStoredPasswords();
  const storedHash = passwords[normEmail];
  
  // If stored password exists, check hash
  if (storedHash) {
    if (storedHash === hashPassword(plainPassword)) {
      return member;
    }
    // Also accept default admin password
    if (normEmail === 'admin@techshastra.club' && plainPassword === 'admin123') {
      return member;
    }
    return null;
  }

  // If no password stored yet, accept and save
  saveLocalMember(member, plainPassword);
  return member;
}

export function updateLocalMember(updated: BackendMember): void {
  const members = getLocalMembers();
  const index = members.findIndex(m => m.id === updated.id || m.email.toLowerCase() === updated.email.toLowerCase());
  if (index >= 0) {
    members[index] = { ...members[index], ...updated };
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
  }
}

export function changeLocalPassword(email: string, oldPass: string, newPass: string): boolean {
  const normEmail = email.trim().toLowerCase();
  const passwords = getStoredPasswords();
  const currentHash = passwords[normEmail];

  if (currentHash && currentHash !== hashPassword(oldPass)) {
    return false;
  }

  passwords[normEmail] = hashPassword(newPass);
  localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
  return true;
}

export function getCachedCurrentUser(): BackendMember | null {
  try {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setCachedCurrentUser(user: BackendMember | null): void {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}
