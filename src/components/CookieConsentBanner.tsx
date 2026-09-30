import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Cookie,
  Shield,
  Activity,
  Sliders,
  Check,
  ChevronRight,
  Sparkles,
  Lock,
} from 'lucide-react';
import {
  getStoredCookiePreferences,
  saveCookiePreferences,
  acceptAllCookies,
  acceptEssentialOnly,
  CookiePreferences,
  DEFAULT_PREFERENCES,
} from '@/lib/cookieConsent';

export const OPEN_COOKIE_SETTINGS_EVENT = 'techshastra_open_cookie_settings';

/**
 * Programmatically open the cookie settings modal from anywhere in the app.
 */
export function openCookieSettings() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_COOKIE_SETTINGS_EVENT));
  }
}

export const CookieConsentBanner: React.FC = () => {
  const [hasPrompted, setHasPrompted] = useState<boolean>(true); // default true to avoid flash
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const stored = getStoredCookiePreferences();
    if (!stored) {
      // User hasn't consented yet, show banner after a gentle delay
      const timer = setTimeout(() => setHasPrompted(false), 800);
      return () => clearTimeout(timer);
    } else {
      setPreferences(stored);
      setHasPrompted(true);
    }
  }, []);

  // Listen for global open requests (from footer or privacy page)
  useEffect(() => {
    const handleOpen = () => {
      const stored = getStoredCookiePreferences() || DEFAULT_PREFERENCES;
      setPreferences(stored);
      setIsModalOpen(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, handleOpen);
  }, []);

  const handleAcceptAll = () => {
    const updated = acceptAllCookies();
    setPreferences(updated);
    setHasPrompted(true);
    setIsModalOpen(false);
  };

  const handleEssentialOnly = () => {
    const updated = acceptEssentialOnly();
    setPreferences(updated);
    setHasPrompted(true);
    setIsModalOpen(false);
  };

  const handleSaveCustom = () => {
    const updated = saveCookiePreferences(preferences);
    setPreferences(updated);
    setHasPrompted(true);
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Floating Bottom Consent Banner */}
      {!hasPrompted && (
        <aside
          role="dialog"
          aria-label="Cookie consent banner"
          className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
        >
          <div className="glass bg-background/95 dark:bg-[#0c0a13]/95 border border-primary/20 p-5 sm:p-6 rounded-2xl shadow-2xl backdrop-blur-xl relative overflow-hidden">
            {/* Ambient subtle glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                  <Cookie className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-sm font-semibold tracking-wide text-foreground">
                      Privacy & Cookies
                    </h3>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-primary/10 text-primary border border-primary/20">
                      GDPR
                    </span>
                  </div>
                  <p className="text-xs text-foreground/70 leading-relaxed">
                    We use cookies and local storage to secure your student login, remember your theme, and collect anonymous telemetry to improve club workshops and hackathons.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                <Button
                  onClick={handleAcceptAll}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs rounded-xl shadow-md transition-all active:scale-95"
                >
                  Accept All
                </Button>
                <Button
                  onClick={handleEssentialOnly}
                  variant="outline"
                  size="sm"
                  className="border-foreground/15 text-foreground/80 hover:text-foreground text-xs rounded-xl active:scale-95"
                >
                  Essential Only
                </Button>
                <Button
                  onClick={() => setIsModalOpen(true)}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-foreground/60 hover:text-primary active:scale-95 sm:ml-auto px-2"
                >
                  <Sliders className="w-3.5 h-3.5 mr-1" />
                  Customize
                </Button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-foreground/40 pt-1 border-t border-foreground/5">
                <Link to="/privacy" className="hover:text-primary transition-colors underline underline-offset-2">
                  Read Privacy Policy
                </Link>
                <span>TechShastra VMSB UTU</span>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Detailed Settings Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg glass bg-background/95 dark:bg-[#0d0b16]/98 border border-primary/20 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2 text-primary font-mono text-xs tracking-wider uppercase">
              <Shield className="w-4 h-4" />
              <span>Cookie & Data Preferences</span>
            </div>
            <DialogTitle className="text-2xl font-heading font-light tracking-tight text-foreground">
              Manage Your Privacy
            </DialogTitle>
            <DialogDescription className="text-xs text-foreground/60 leading-relaxed">
              Customize how TechShastra handles cookies and browser storage on your device. You can update these settings at any time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* 1. Necessary */}
            <div className="p-4 rounded-2xl bg-foreground/[0.03] border border-foreground/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-primary" />
                  <span className="font-heading text-sm font-medium text-foreground">
                    Strictly Necessary
                  </span>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
                  Always Active
                </span>
              </div>
              <p className="text-xs text-foreground/60 leading-relaxed pl-6.5">
                Required to authenticate your member session (JWT), manage role permissions, and maintain your dark/light theme choice. The site cannot function without these.
              </p>
            </div>

            {/* 2. Analytics & Telemetry */}
            <div className="p-4 rounded-2xl bg-foreground/[0.03] border border-foreground/10 space-y-2 transition-colors hover:border-foreground/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span className="font-heading text-sm font-medium text-foreground">
                    Club Telemetry & Analytics
                  </span>
                </div>
                <Switch
                  checked={preferences.analytics}
                  onCheckedChange={(val) => setPreferences(prev => ({ ...prev, analytics: val }))}
                />
              </div>
              <p className="text-xs text-foreground/60 leading-relaxed pl-6.5">
                Enables aggregated, anonymous page hit tracking and project interest counters. Helps faculty and club organizers understand which tech domains need more workshops.
              </p>
            </div>

            {/* 3. User Preferences */}
            <div className="p-4 rounded-2xl bg-foreground/[0.03] border border-foreground/10 space-y-2 transition-colors hover:border-foreground/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="font-heading text-sm font-medium text-foreground">
                    Interface Preferences
                  </span>
                </div>
                <Switch
                  checked={preferences.preferences}
                  onCheckedChange={(val) => setPreferences(prev => ({ ...prev, preferences: val }))}
                />
              </div>
              <p className="text-xs text-foreground/60 leading-relaxed pl-6.5">
                Remembers your selected programming language in live sandbox runners, project category filters, and table view layouts across visits.
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-foreground/10">
            <Button
              onClick={handleAcceptAll}
              variant="outline"
              size="sm"
              className="border-foreground/15 text-xs rounded-xl"
            >
              Accept All
            </Button>
            <Button
              onClick={handleSaveCustom}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-xl sm:ml-auto px-5"
            >
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
export default CookieConsentBanner;
