import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/authContext';
import { api, BackendProject, BackendEvent } from '@/lib/api';
import { trackPageView } from '@/lib/activityTracker';
import { useToast } from '@/hooks/use-toast';
import {
  User, Mail, Github, Linkedin, Code, Calendar, Plus, Rocket,
  ExternalLink, LogOut, ShieldCheck, KeyRound, CheckCircle2,
  Clock, Loader2, Sparkles, FolderGit2
} from 'lucide-react';

export const UserDashboard = () => {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Tab state
  const [activeTab, setActiveTab] = useState('projects');

  // Edit profile form
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [skills, setSkills] = useState(user?.skills || '');
  const [github, setGithub] = useState(user?.github || '');
  const [linkedin, setLinkedin] = useState(user?.linkedin || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Project upload form
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [projTitle, setProjTitle] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projCategory, setProjCategory] = useState('Web & Cloud');
  const [projDomain, setProjDomain] = useState('Full Stack');
  const [projTags, setProjTags] = useState('');
  const [projGithub, setProjGithub] = useState('');
  const [projLive, setProjLive] = useState('');
  const [uploadingProj, setUploadingProj] = useState(false);

  // User's projects & events data
  const [userProjects, setUserProjects] = useState<BackendProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [events, setEvents] = useState<BackendEvent[]>([]);

  useEffect(() => {
    trackPageView('Member Dashboard');
    loadProjects();
    loadEvents();
  }, [user?.id]);

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const allProjects = await api.getProjects();
      // Filter projects authored by current user (or where author_id matches)
      const myProjs = allProjects.filter(p => p.author_id === user?.id || p.lead_name === user?.name);
      setUserProjects(myProjs);
    } catch {
      // Fallback
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadEvents = async () => {
    try {
      const allEvents = await api.getEvents();
      setEvents(allEvents);
    } catch {
      // Fallback
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({
        name,
        bio,
        skills,
        github,
        linkedin,
        avatar,
      });
      toast({
        title: "Profile updated!",
        description: "Your information has been saved successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Minimum 6 characters required.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }

    setSavingPassword(true);
    try {
      await api.changePassword(oldPassword, newPassword);
      toast({
        title: "Password changed!",
        description: "Your security credentials have been updated.",
      });
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      toast({
        title: "Password change failed",
        description: err.message || "Please check your current password.",
        variant: "destructive",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleUploadProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim() || !projDesc.trim()) {
      toast({ title: "Title and description required", variant: "destructive" });
      return;
    }

    setUploadingProj(true);
    try {
      await api.createProject({
        title: projTitle.trim(),
        description: projDesc.trim(),
        category: projCategory,
        domain: projDomain,
        tags: projTags.split(',').map(s => s.trim()).filter(Boolean),
        github: projGithub.trim(),
        demo: projLive.trim(),
        team: { lead: user?.name || 'Member', designer: 'TechShastra Club' },
        status: 'In Progress',
        language: 'other',
      });

      toast({
        title: "Project Published!",
        description: "Your project is now showcased in the club ecosystem for all members to see.",
      });

      setShowUploadModal(false);
      setProjTitle('');
      setProjDesc('');
      setProjTags('');
      setProjGithub('');
      setProjLive('');
      loadProjects();
    } catch (err: any) {
      toast({
        title: "Submission failed",
        description: err.message || "Could not publish project.",
        variant: "destructive",
      });
    } finally {
      setUploadingProj(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-16">
        {/* Profile Card Hero */}
        <div className="glass border border-foreground/10 p-6 sm:p-8 rounded-3xl mb-8 relative overflow-hidden backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-primary to-cyan-400 flex items-center justify-center text-2xl font-bold text-black shadow-xl shadow-primary/20">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  user?.name ? user.name.slice(0, 2).toUpperCase() : 'TS'
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-heading font-light tracking-tight text-foreground">
                    {user?.name}
                  </h1>
                  <Badge variant="outline" className="text-[10px] font-mono tracking-widest uppercase border-primary/30 text-primary bg-primary/10">
                    {user?.role || 'student'}
                  </Badge>
                  {user?.verified && (
                    <span className="flex items-center text-emerald-400 text-xs gap-1 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm font-mono text-foreground/50 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  {user?.email}
                  {user?.student_id && (
                    <span className="border-l border-foreground/20 pl-2">
                      ID: {user.student_id}
                    </span>
                  )}
                </p>

                {user?.bio && (
                  <p className="text-xs text-foreground/70 italic max-w-xl line-clamp-2 pt-1">
                    "{user.bio}"
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                onClick={() => setShowUploadModal(true)}
                className="flex-1 sm:flex-none h-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-mono uppercase tracking-widest shadow-lg shadow-primary/25"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Upload Project
              </Button>

              {(user?.role === 'admin' || user?.role === 'core') && (
                <Button
                  onClick={() => navigate('/admin')}
                  variant="outline"
                  className="glass border-0 h-10 rounded-full text-xs font-mono uppercase tracking-widest hover:bg-white/5"
                >
                  <ShieldCheck className="w-4 h-4 mr-1.5 text-primary" />
                  Admin
                </Button>
              )}

              <Button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                variant="ghost"
                className="h-10 rounded-full text-xs font-mono text-foreground/50 hover:text-foreground hover:bg-white/5 px-3"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-black/30 p-1 rounded-2xl border border-foreground/10">
            <TabsTrigger value="projects" className="rounded-xl text-xs font-mono uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FolderGit2 className="w-3.5 h-3.5 mr-1.5" />
              My Projects ({userProjects.length})
            </TabsTrigger>
            <TabsTrigger value="events" className="rounded-xl text-xs font-mono uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              Upcoming Events
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl text-xs font-mono uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <User className="w-3.5 h-3.5 mr-1.5" />
              Profile Settings
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: USER'S PROJECTS */}
          <TabsContent value="projects" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-heading font-light tracking-tight">
                  Your Uploaded Technical Projects
                </h2>
                <p className="text-xs text-foreground/50">
                  Projects uploaded here are public to the club community and visible on the global showcase.
                </p>
              </div>

              <Button
                onClick={() => setShowUploadModal(true)}
                size="sm"
                className="rounded-full bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 text-xs font-mono"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Upload New
              </Button>
            </div>

            {loadingProjects ? (
              <div className="flex items-center justify-center p-12 glass rounded-3xl">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : userProjects.length === 0 ? (
              <div className="glass border border-foreground/10 p-12 rounded-3xl text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
                  <Rocket className="w-7 h-7" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h3 className="text-base font-medium">No projects uploaded yet</h3>
                  <p className="text-xs text-foreground/50 leading-relaxed">
                    Have you built a web app, hardware bot, AI model, or cybersecurity script? Share it with the club!
                  </p>
                </div>
                <Button
                  onClick={() => setShowUploadModal(true)}
                  className="rounded-full bg-primary text-primary-foreground text-xs font-mono uppercase tracking-widest px-6"
                >
                  Publish Your First Project
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {userProjects.map((p) => (
                  <div key={p.id} className="glass border border-foreground/10 rounded-2xl p-6 flex flex-col justify-between hover:border-primary/40 transition-all group">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                          {p.category || 'Tech'}
                        </span>
                        <span className="text-[10px] font-mono text-foreground/40">
                          {p.status || 'Active'}
                        </span>
                      </div>

                      <h3 className="text-lg font-heading font-light tracking-tight group-hover:text-primary transition-colors">
                        {p.title}
                      </h3>

                      <p className="text-xs text-foreground/60 line-clamp-3 leading-relaxed">
                        {p.description}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-foreground/5 flex items-center justify-between">
                      <Link
                        to={`/projects/${p.id}`}
                        className="text-xs font-mono text-foreground/60 hover:text-foreground flex items-center gap-1"
                      >
                        Details →
                      </Link>

                      <Link
                        to={`/projects/${p.id}/live`}
                        className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
                      >
                        Launch Sandbox
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Explore All Club Projects Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-cyan-500/10 to-primary/10 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-heading font-medium text-foreground">
                  Looking for projects built by other club members?
                </h4>
                <p className="text-xs text-foreground/60">
                  Explore rovers, AI models, and student tools across all domains.
                </p>
              </div>
              <Button asChild variant="outline" className="glass border-0 rounded-full text-xs font-mono uppercase tracking-widest">
                <Link to="/projects">
                  Browse All Projects →
                </Link>
              </Button>
            </div>
          </TabsContent>

          {/* TAB 2: EVENTS */}
          <TabsContent value="events" className="space-y-6">
            <div>
              <h2 className="text-xl font-heading font-light tracking-tight">
                TechShastra University Events & Hackathons
              </h2>
              <p className="text-xs text-foreground/50">
                Register with a single click using your student account.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((ev) => (
                <div key={ev.id} className="glass border border-foreground/10 rounded-2xl p-6 flex flex-col justify-between hover:border-primary/40 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-foreground/40">
                      <span className="text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full text-[10px] uppercase">
                        {ev.status || 'Upcoming'}
                      </span>
                      <span>{ev.event_date}</span>
                    </div>

                    <h3 className="text-lg font-heading font-light tracking-tight">
                      {ev.title}
                    </h3>

                    <p className="text-xs text-foreground/60 line-clamp-3 leading-relaxed">
                      {ev.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-foreground/5 flex items-center justify-between">
                    <span className="text-xs font-mono text-foreground/40">
                      {ev.location || 'UTU Campus'}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/events/${ev.id}`)}
                      className="rounded-full bg-primary text-primary-foreground text-xs font-mono"
                    >
                      Register Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* TAB 3: SETTINGS */}
          <TabsContent value="settings" className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Profile Details */}
              <div className="glass border border-foreground/10 p-6 sm:p-8 rounded-3xl space-y-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-heading font-light">Edit Profile Information</h3>
                  <p className="text-xs text-foreground/50">Keep your technical profile up to date.</p>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-mono uppercase text-foreground/70">Name</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-black/20 border-foreground/10 text-sm font-mono rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-mono uppercase text-foreground/70">Skills</Label>
                    <Input
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      placeholder="React, Go, Docker, PyTorch"
                      className="bg-black/20 border-foreground/10 text-sm font-mono rounded-xl"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-mono uppercase text-foreground/70">GitHub URL</Label>
                      <Input
                        value={github}
                        onChange={(e) => setGithub(e.target.value)}
                        placeholder="https://github.com/..."
                        className="bg-black/20 border-foreground/10 text-sm font-mono rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-mono uppercase text-foreground/70">LinkedIn URL</Label>
                      <Input
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        placeholder="https://linkedin.com/..."
                        className="bg-black/20 border-foreground/10 text-sm font-mono rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-mono uppercase text-foreground/70">Bio</Label>
                    <Textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="bg-black/20 border-foreground/10 text-sm font-mono rounded-xl resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={savingProfile}
                    className="w-full rounded-full bg-primary text-primary-foreground text-xs font-mono uppercase tracking-widest"
                  >
                    {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                  </Button>
                </form>
              </div>

              {/* Password & Security */}
              <div className="glass border border-foreground/10 p-6 sm:p-8 rounded-3xl space-y-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-heading font-light">Security & Password</h3>
                  <p className="text-xs text-foreground/50">Update your account authentication credentials.</p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-mono uppercase text-foreground/70">Current Password</Label>
                    <Input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-black/20 border-foreground/10 text-sm font-mono rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-mono uppercase text-foreground/70">New Password</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="•••••••• (min 6 chars)"
                      className="bg-black/20 border-foreground/10 text-sm font-mono rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-mono uppercase text-foreground/70">Confirm New Password</Label>
                    <Input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-black/20 border-foreground/10 text-sm font-mono rounded-xl"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={savingPassword}
                    variant="outline"
                    className="w-full rounded-full glass border-0 text-xs font-mono uppercase tracking-widest hover:bg-white/5"
                  >
                    {savingPassword ? 'Updating Password...' : 'Update Password'}
                  </Button>
                </form>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Upload Project Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass border border-foreground/10 p-6 sm:p-8 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-heading font-light">Share / Upload Project</h3>
                  <p className="text-xs text-foreground/50">Showcase your technical work to the entire club.</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUploadModal(false)}
                  className="rounded-full w-8 h-8 p-0"
                >
                  ✕
                </Button>
              </div>

              <form onSubmit={handleUploadProject} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-mono uppercase text-foreground/70">Project Title *</Label>
                  <Input
                    value={projTitle}
                    onChange={(e) => setProjTitle(e.target.value)}
                    placeholder="e.g. Autonomous Drone Telemetry Dashboard"
                    className="bg-black/20 border-foreground/10 text-sm font-mono rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-mono uppercase text-foreground/70">Project Description *</Label>
                  <Textarea
                    rows={3}
                    value={projDesc}
                    onChange={(e) => setProjDesc(e.target.value)}
                    placeholder="What problem does it solve, what technologies were used, and how does it work?"
                    className="bg-black/20 border-foreground/10 text-sm font-mono rounded-xl resize-none"
                    required
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-mono uppercase text-foreground/70">Category</Label>
                    <select
                      value={projCategory}
                      onChange={(e) => setProjCategory(e.target.value)}
                      className="w-full h-10 px-3 bg-black/40 border border-foreground/10 rounded-xl text-sm font-mono text-foreground"
                    >
                      <option value="Web & Cloud">Web & Cloud</option>
                      <option value="Robotics">Robotics & Hardware</option>
                      <option value="AI & ML">AI & Machine Learning</option>
                      <option value="Cybersecurity">Cybersecurity</option>
                      <option value="Mobile App">Mobile Application</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-mono uppercase text-foreground/70">Tags (comma separated)</Label>
                    <Input
                      value={projTags}
                      onChange={(e) => setProjTags(e.target.value)}
                      placeholder="React, Go, Docker, IoT"
                      className="bg-black/20 border-foreground/10 text-sm font-mono rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-mono uppercase text-foreground/70">GitHub Repo URL</Label>
                    <Input
                      type="url"
                      value={projGithub}
                      onChange={(e) => setProjGithub(e.target.value)}
                      placeholder="https://github.com/..."
                      className="bg-black/20 border-foreground/10 text-sm font-mono rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-mono uppercase text-foreground/70">Live Demo URL</Label>
                    <Input
                      type="url"
                      value={projLive}
                      onChange={(e) => setProjLive(e.target.value)}
                      placeholder="https://..."
                      className="bg-black/20 border-foreground/10 text-sm font-mono rounded-xl"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowUploadModal(false)}
                    className="rounded-full text-xs font-mono"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={uploadingProj}
                    className="rounded-full bg-primary text-primary-foreground text-xs font-mono uppercase tracking-widest px-6"
                  >
                    {uploadingProj ? 'Publishing...' : 'Publish to Showcase'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default UserDashboard;
