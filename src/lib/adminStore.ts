// ─── TYPES ───────────────────────────────────────────────────────────
export type AdminRole = "super_admin" | "admin";

export interface AdminCredential {
  id: string;
  name: string;
  mobile: string;
  dob: string;
  email?: string;
  role: AdminRole;
  is_blocked: boolean;
  blocked_at?: string;
  block_reason?: string;
  created_at: string;
}

export interface PageVisibility {
  id: string;
  page_path: string;
  page_name: string;
  is_visible: boolean;
  updated_at: string;
}

// ─── STORAGE KEYS ────────────────────────────────────────────────────
const STORAGE_KEY        = "ts_admin_credentials";
const PAGE_VISIBILITY_KEY = "ts_page_visibility";
const SUPER_ADMIN_KEY_STORAGE = "ts_super_admin_key";

// ─── CREDENTIAL KEY ──────────────────────────────────────────────────
// Format: lowercased-name + mobile + dob (same as before, kept compatible)
const generateCredKey = (name: string, mobile: string, dob: string): string =>
  `${name.toLowerCase().trim()}${mobile}${dob}`;

// ─── SUPER ADMIN (configurable) ───────────────────────────────────────
/**
 * Super admin credentials are stored in localStorage under SUPER_ADMIN_KEY_STORAGE
 * so they can be changed without editing source code.
 *
 * First-run default: name="Super Admin", mobile="1234567890", dob="2000-01-01"
 * The setup flow in Auth.tsx lets the super admin change these on first login.
 *
 * ponytail: still localStorage, still client-side. Ceiling: no server validation.
 * Upgrade: hash with SubtleCrypto PBKDF2 when a backend exists.
 */
const DEFAULT_SUPER_ADMIN = { name: "Super Admin", mobile: "1234567890", dob: "2000-01-01" };

export const getSuperAdminKey = (): string => {
  const stored = localStorage.getItem(SUPER_ADMIN_KEY_STORAGE);
  if (stored) return stored;
  // First run — persist the default so it can be changed later
  const key = generateCredKey(DEFAULT_SUPER_ADMIN.name, DEFAULT_SUPER_ADMIN.mobile, DEFAULT_SUPER_ADMIN.dob);
  localStorage.setItem(SUPER_ADMIN_KEY_STORAGE, key);
  return key;
};

export const setSuperAdminCredentials = (name: string, mobile: string, dob: string): void => {
  localStorage.setItem(SUPER_ADMIN_KEY_STORAGE, generateCredKey(name, mobile, dob));
};

/** Returns true if this is the first login (credentials still at default) */
export const isSuperAdminDefault = (): boolean => {
  const key = localStorage.getItem(SUPER_ADMIN_KEY_STORAGE);
  const defaultKey = generateCredKey(DEFAULT_SUPER_ADMIN.name, DEFAULT_SUPER_ADMIN.mobile, DEFAULT_SUPER_ADMIN.dob);
  return !key || key === defaultKey;
};

// ─── STORAGE HELPERS ─────────────────────────────────────────────────
const getCredentials = (): AdminCredential[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const getStoredCredentials = getCredentials;

const saveCredentials = (creds: AdminCredential[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
};

// ─── AUTH ────────────────────────────────────────────────────────────

export type VerifyResult =
  | { success: true;  role: AdminRole; id: string }
  | { success: false; blocked: true;  name: string }
  | { success: false; blocked: false };

/** Verify login credentials — now returns blocked status so Auth.tsx can show the right screen */
export const verifyAdmin = (name: string, mobile: string, dob: string): VerifyResult => {
  const key = generateCredKey(name, mobile, dob);

  // Check super admin
  if (key === getSuperAdminKey()) {
    return { success: true, role: "super_admin", id: "super_admin" };
  }

  // Check regular admins
  const creds = getCredentials();
  const admin = creds.find(c => generateCredKey(c.name, c.mobile, c.dob) === key);

  if (!admin) return { success: false, blocked: false };
  if (admin.is_blocked) return { success: false, blocked: true, name: admin.name };
  return { success: true, role: admin.role, id: admin.id };
};

/** Get user role by ID */
export const getUserRole = async (userId: string): Promise<AdminRole | null> => {
  if (userId === "super_admin") return "super_admin";
  const creds = getCredentials();
  const admin = creds.find(c => c.id === userId);
  return admin ? admin.role : null;
};

/** Check if user is blocked */
export const isUserBlocked = async (userId: string): Promise<boolean> => {
  if (userId === "super_admin") return false;
  const creds = getCredentials();
  const admin = creds.find(c => c.id === userId);
  return admin ? admin.is_blocked : false;
};

// ─── USER MANAGEMENT ─────────────────────────────────────────────────

export const getAdminUsers = async (): Promise<AdminCredential[]> => getCredentials();

export const createAdminCredential = (
  name: string,
  mobile: string,
  dob: string,
  role: AdminRole = "admin",
  email?: string
): AdminCredential => {
  const creds = getCredentials();
  const newCred: AdminCredential = {
    id: crypto.randomUUID(),   // was Date.now().toString()
    name, mobile, dob,
    email,
    role,
    is_blocked: false,
    created_at: new Date().toISOString(),
  };
  creds.push(newCred);
  saveCredentials(creds);
  return newCred;
};

export const blockAdmin = (userId: string, reason?: string): void => {
  const creds = getCredentials();
  const index = creds.findIndex(c => c.id === userId);
  if (index !== -1) {
    creds[index].is_blocked = true;
    creds[index].blocked_at = new Date().toISOString();
    creds[index].block_reason = reason;
    saveCredentials(creds);
  }
};

export const unblockAdmin = (userId: string): void => {
  const creds = getCredentials();
  const index = creds.findIndex(c => c.id === userId);
  if (index !== -1) {
    creds[index].is_blocked = false;
    creds[index].blocked_at = undefined;
    creds[index].block_reason = undefined;
    saveCredentials(creds);
  }
};

export const deleteAdminCredential = (userId: string): void => {
  saveCredentials(getCredentials().filter(c => c.id !== userId));
};

// ─── PAGE VISIBILITY ─────────────────────────────────────────────────

const getPageVisibility = (): PageVisibility[] => {
  const data = localStorage.getItem(PAGE_VISIBILITY_KEY);
  return data ? JSON.parse(data) : [];
};

export const getStoredPageVisibility = getPageVisibility;

const savePageVisibility = (pages: PageVisibility[]): void => {
  localStorage.setItem(PAGE_VISIBILITY_KEY, JSON.stringify(pages));
};

export const getAllPageVisibility = async (): Promise<PageVisibility[]> => getPageVisibility();

export const togglePageVisibility = async (pageId: string): Promise<void> => {
  const pages = getPageVisibility();
  const index = pages.findIndex(p => p.id === pageId);
  if (index !== -1) {
    pages[index].is_visible = !pages[index].is_visible;
    pages[index].updated_at = new Date().toISOString();
    savePageVisibility(pages);
  }
};

/** Set a page's visibility directly (used by revert logic) */
export const setPageVisibility = async (pageId: string, isVisible: boolean): Promise<void> => {
  const pages = getPageVisibility();
  const index = pages.findIndex(p => p.id === pageId);
  if (index !== -1) {
    pages[index].is_visible = isVisible;
    pages[index].updated_at = new Date().toISOString();
    savePageVisibility(pages);
  }
};

export const initializePages = (): void => {
  if (getPageVisibility().length > 0) return;
  const defaults: PageVisibility[] = [
    { id: "1", page_path: "/projects",    page_name: "Projects",    is_visible: true, updated_at: new Date().toISOString() },
    { id: "2", page_path: "/events",      page_name: "Events",      is_visible: true, updated_at: new Date().toISOString() },
    { id: "3", page_path: "/blog",        page_name: "Blog",        is_visible: true, updated_at: new Date().toISOString() },
    { id: "4", page_path: "/gallery",     page_name: "Gallery",     is_visible: true, updated_at: new Date().toISOString() },
    { id: "5", page_path: "/achievements",page_name: "Achievements",is_visible: true, updated_at: new Date().toISOString() },
    { id: "6", page_path: "/publications",page_name: "Publications",is_visible: true, updated_at: new Date().toISOString() },
    { id: "7", page_path: "/resources",   page_name: "Resources",   is_visible: true, updated_at: new Date().toISOString() },
    { id: "8", page_path: "/faq",         page_name: "FAQ",         is_visible: true, updated_at: new Date().toISOString() },
    { id: "9", page_path: "/socials",     page_name: "Socials",     is_visible: true, updated_at: new Date().toISOString() },
  ];
  savePageVisibility(defaults);
};

initializePages();
