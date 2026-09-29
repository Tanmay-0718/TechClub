/**
 * ProtectedRoute — guards admin and member pages.
 *
 * Supports:
 * - requireAdmin: checks admin session and user roles (super_admin / admin / core)
 * - general member authentication: checks useAuth() and redirects to /login
 */
import { useEffect, useState, useRef, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { type AdminRole } from "@/lib/adminStore";
import { useAuth } from "@/lib/authContext";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const IDLE_WARN_MS  = 25 * 60 * 1000;  // 25 min → show warning
const IDLE_LIMIT_MS = 30 * 60 * 1000;  // 30 min → force logout

interface ProtectedRouteProps {
  children: React.ReactNode | ((props: { userRole: AdminRole }) => React.ReactNode);
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<AdminRole | null>(null);
  const [showWarn, setShowWarn] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const warnTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doLogout = useCallback(() => {
    sessionStorage.removeItem("ts_admin_session");
    navigate(requireAdmin ? "/auth" : "/login", { replace: true });
  }, [navigate, requireAdmin]);

  const resetIdle = useCallback(() => {
    setShowWarn(false);
    if (warnTimer.current)  clearTimeout(warnTimer.current);
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    warnTimer.current  = setTimeout(() => setShowWarn(true),  IDLE_WARN_MS);
    logoutTimer.current = setTimeout(doLogout,                 IDLE_LIMIT_MS);
  }, [doLogout]);

  useEffect(() => {
    // 1. Check admin session in sessionStorage
    const raw = sessionStorage.getItem("ts_admin_session");
    if (raw) {
      try {
        const session = JSON.parse(raw);
        if (session.role === "super_admin" || session.role === "admin") {
          setUserRole(session.role as AdminRole);
        }
      } catch (_e) { /* invalid */ }
    } else if (user?.role === "admin" || user?.role === "core") {
      // 2. Also allow authenticated admin/core users
      setUserRole("admin");
    }
    setLoading(false);
  }, [user]);

  // Start idle timers once authenticated as admin
  useEffect(() => {
    if (!userRole) return;
    resetIdle();
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach(ev => window.addEventListener(ev, resetIdle, { passive: true }));
    return () => {
      events.forEach(ev => window.removeEventListener(ev, resetIdle));
      if (warnTimer.current)  clearTimeout(warnTimer.current);
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
    };
  }, [userRole, resetIdle]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-xs font-mono tracking-widest text-foreground/50 uppercase">Verifying Authorization...</p>
      </div>
    );
  }

  // Admin protection
  if (requireAdmin) {
    if (!userRole) return <Navigate to="/auth" replace />;
  } else {
    // General member protection
    if (!isAuthenticated && !userRole) {
      return <Navigate to="/login" replace />;
    }
  }

  return (
    <>
      {/* Idle warning banner for admin sessions */}
      {showWarn && (
        <div className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between gap-4 px-6 py-3 bg-amber-500 text-amber-950 text-sm font-medium shadow-lg">
          <span className="flex items-center gap-2">
            <AlertTriangle size={16} />
            Your session will expire in 5 minutes due to inactivity.
          </span>
          <Button size="sm" variant="outline"
            className="border-amber-800 text-amber-950 hover:bg-amber-600 h-7 text-xs"
            onClick={resetIdle}>
            Stay Logged In
          </Button>
        </div>
      )}

      {typeof children === "function"
        ? (children as any)({ userRole: userRole || "admin" })
        : children
      }
    </>
  );
};

export default ProtectedRoute;
