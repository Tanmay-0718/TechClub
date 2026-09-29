/**
 * StudentAuth context + hook.
 * Wraps cookie-based student session so any component can read/update it.
 */
// eslint-disable-next-line react-refresh/only-export-components
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import {
  getStudentSession,
  signInStudent,
  signOutStudent,
  type StudentSession,
} from "@/lib/studentStore";

interface StudentAuthContextValue {
  session: StudentSession | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  /** Re-read cookie (call after profile edits that don't change session fields) */
  refresh: () => void;
}

const StudentAuthContext = createContext<StudentAuthContextValue | null>(null);

export const StudentAuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<StudentSession | null>(() =>
    getStudentSession()
  );

  const login = useCallback((email: string, password: string): boolean => {
    const s = signInStudent(email, password);
    if (s) { setSession(s); return true; }
    return false;
  }, []);

  const logout = useCallback(() => {
    signOutStudent();
    setSession(null);
  }, []);

  const refresh = useCallback(() => {
    setSession(getStudentSession());
  }, []);

  return (
    <StudentAuthContext.Provider value={{ session, login, logout, refresh }}>
      {children}
    </StudentAuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useStudentAuth = (): StudentAuthContextValue => {
  const ctx = useContext(StudentAuthContext);
  if (!ctx) throw new Error("useStudentAuth must be inside StudentAuthProvider");
  return ctx;
};
