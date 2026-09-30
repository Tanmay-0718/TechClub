import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { openCookieSettings } from '@/components/CookieConsentBanner';
import { trackPageView } from '@/lib/activityTracker';
import {
  Shield,
  Lock,
  Cookie,
  Activity,
  Sliders,
  Server,
  FileCheck2,
  Mail,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Database,
  Users,
} from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  useEffect(() => {
    trackPageView('Privacy Policy');
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 sm:px-6 pt-32 pb-24 max-w-4xl relative">
        {/* Background ambient glows */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

        {/* Header Breadcrumb */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-foreground/50 hover:text-primary transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            <span>Return to Home</span>
          </Link>
        </div>

        {/* Title & Badge */}
        <div className="space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono uppercase tracking-widest">
            <Shield className="w-3.5 h-3.5" />
            <span>University Club Compliance · DPDP Act 2023 & GDPR</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-heading font-light tracking-tight text-foreground">
            Privacy Policy & <span className="text-primary italic">Cookie Charter</span>
          </h1>

          <p className="text-sm font-light text-foreground/60 leading-relaxed max-w-2xl">
            Effective Date: September 2026 · TechShastra, Veer Madho Singh Bhandari Uttarakhand Technical University (VMSB UTU), Dehradun.
          </p>
        </div>

        {/* Quick Summary Card */}
        <div className="glass p-6 sm:p-8 rounded-3xl border border-primary/20 mb-12 shadow-xl backdrop-blur-xl relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="font-heading text-lg font-medium text-foreground">
                Our Privacy Pledge to Students & Members
              </h3>
              <p className="text-xs sm:text-sm text-foreground/70 leading-relaxed">
                TechShastra is built by students for students. We strictly collect only the academic and technical data required to verify your university credentials, manage hackathon/event registrations, display your open-source projects, and protect our systems from malicious traffic. <strong>We will never sell or monetize your data.</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="space-y-12 text-sm text-foreground/80 leading-relaxed font-light">
          {/* Section 1 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-mono text-xs font-bold">
                01
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-normal text-foreground">
                Information We Collect
              </h2>
            </div>
            <div className="pl-11 space-y-3">
              <p>
                When you create an account, submit an application, or participate in TechShastra events, we may collect:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-foreground/70">
                <li>
                  <strong className="text-foreground">Identity & University Records:</strong> Full Name, University Roll Number / Student ID, Course, Branch, and Academic Year.
                </li>
                <li>
                  <strong className="text-foreground">Contact Details:</strong> University or personal email address, optional contact number for emergency event logistics.
                </li>
                <li>
                  <strong className="text-foreground">Technical Profiles & Portfolios:</strong> GitHub username, LinkedIn profile link, personal portfolio URL, and technical skills (e.g., React, Go, ROS, Python).
                </li>
                <li>
                  <strong className="text-foreground">Project Metadata:</strong> Project titles, descriptions, live demo links, repository URLs, and team contributor details submitted to the TechShastra Showcase.
                </li>
                <li>
                  <strong className="text-foreground">Authentication Credentials:</strong> Passwords are cryptographically salted and hashed using industry-standard Bcrypt before ever touching persistent storage. We never store plaintext passwords.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-mono text-xs font-bold">
                02
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-normal text-foreground">
                Traffic Limits & Rate Limiting
              </h2>
            </div>
            <div className="pl-11 space-y-3">
              <p>
                To safeguard university servers and ensure fair availability for all students during high-traffic periods (such as hackathon registrations), we enforce automatic <strong>Traffic Rate Limiting</strong>:
              </p>
              <div className="p-4 rounded-2xl bg-foreground/[0.02] border border-foreground/10 space-y-2">
                <div className="flex items-center gap-2 text-primary font-mono text-xs font-semibold">
                  <Server className="w-4 h-4" />
                  <span>Automated Rate Limiter Specifications</span>
                </div>
                <p className="text-xs text-foreground/70 leading-relaxed">
                  Our Go API gateway employs a sliding-window token-bucket algorithm allowing up to <strong>60 requests per minute</strong> per IP address with burst allowances. Excessive bursts or automated script requests temporarily receive an HTTP 429 status code with a 10-second cooldown period.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-mono text-xs font-bold">
                03
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-normal text-foreground">
                Cookies & Browser Storage Settings
              </h2>
            </div>
            <div className="pl-11 space-y-4">
              <p>
                TechShastra utilizes browser cookies and HTML5 local storage strictly for functional, telemetry, and aesthetic purposes:
              </p>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border border-foreground/10 bg-foreground/[0.02] space-y-2">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <Lock className="w-4 h-4 text-primary" />
                    <span>Strictly Necessary</span>
                  </div>
                  <p className="text-xs text-foreground/60 leading-relaxed">
                    Maintains your JWT authentication session, checks user roles, and stores your light/dark theme preference. Always active.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-foreground/10 bg-foreground/[0.02] space-y-2">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span>Club Telemetry</span>
                  </div>
                  <p className="text-xs text-foreground/60 leading-relaxed">
                    Measures anonymous page views and project visit counts to help club mentors evaluate student engagement. Optional.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-foreground/10 bg-foreground/[0.02] space-y-2">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    <span>UI Preferences</span>
                  </div>
                  <p className="text-xs text-foreground/60 leading-relaxed">
                    Saves table view choices, filter categories, and developer sandbox preferences across browser sessions. Optional.
                  </p>
                </div>
              </div>

              {/* Interactive Cookie Settings Trigger */}
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-heading text-sm font-medium text-foreground">
                    Want to update your cookie preferences?
                  </h4>
                  <p className="text-xs text-foreground/60">
                    You can inspect or toggle non-essential cookies at any moment.
                  </p>
                </div>
                <Button
                  onClick={openCookieSettings}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs rounded-xl font-medium shrink-0"
                >
                  <Cookie className="w-3.5 h-3.5 mr-1.5" />
                  Open Cookie Settings
                </Button>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-mono text-xs font-bold">
                04
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-normal text-foreground">
                How We Use and Protect Your Data
              </h2>
            </div>
            <div className="pl-11 space-y-3">
              <p>
                Your data is utilized solely for official university club activities:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-foreground/70">
                <li>Verifying active student enrollment for club membership and voting rights.</li>
                <li>Processing RSVP and registration lists for hackathons, guest lectures, and coding competitions.</li>
                <li>Issuing verifiable digital certificates of participation and achievement.</li>
                <li>Enabling student developers to publish and showcase technical projects to alumni and recruiters.</li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-mono text-xs font-bold">
                05
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-normal text-foreground">
                Your Rights & Data Portability
              </h2>
            </div>
            <div className="pl-11 space-y-3">
              <p>
                Under the Indian Digital Personal Data Protection (DPDP) Act 2023 and global privacy standards, you hold full authority over your personal information:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-foreground/70">
                <li><strong className="text-foreground">Right to Review & Update:</strong> Modify your profile, skills, and links anytime in your <Link to="/dashboard" className="text-primary underline">Member Dashboard</Link>.</li>
                <li><strong className="text-foreground">Right to Erasure (Forget):</strong> You can request full deletion of your account and project submissions by contacting the TechShastra executive board.</li>
                <li><strong className="text-foreground">Right to Portability:</strong> Club admins can export full JSON backups of data to prevent vendor lock-in.</li>
              </ul>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-mono text-xs font-bold">
                06
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-normal text-foreground">
                Contact & University Administration
              </h2>
            </div>
            <div className="pl-11 space-y-3">
              <p>
                For privacy inquiries, data deletion requests, or technical concerns, please reach out to the university coordinating committee:
              </p>
              <div className="p-5 rounded-2xl bg-foreground/[0.02] border border-foreground/10 space-y-2 text-xs">
                <p><strong className="text-foreground">Data Controller:</strong> TechShastra Technical Society</p>
                <p><strong className="text-foreground">Institution:</strong> Veer Madho Singh Bhandari Uttarakhand Technical University (VMSB UTU)</p>
                <p><strong className="text-foreground">Address:</strong> Post Office Chandanwari, Prem Nagar, Suddhowala, Dehradun, Uttarakhand 248007</p>
                <p><strong className="text-foreground">Official Email:</strong> <a href="mailto:vmsb.utu.ddn.2023@gmail.com" className="text-primary hover:underline">vmsb.utu.ddn.2023@gmail.com</a></p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
