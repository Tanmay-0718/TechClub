import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/authContext';
import { trackPageView } from '@/lib/activityTracker';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock, Mail, User, Github, Linkedin, Code, Sparkles, ArrowRight, ArrowLeft, BookOpen } from 'lucide-react';

export const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [skills, setSkills] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    trackPageView('Member Signup');
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password) {
      setError('Please provide your name, email, and a password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        student_id: studentId.trim(),
        bio: bio.trim(),
        github: github.trim(),
        linkedin: linkedin.trim(),
        skills: skills.trim(),
      });
      toast({
        title: "Account created!",
        description: "Welcome to TechShastra! Your account is active.",
      });
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20">
      {/* Minimal Top Brand Bar without site navigation links */}
      <header className="w-full max-w-7xl mx-auto px-6 pt-6 pb-2 flex items-center justify-between z-20">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="font-heading text-xl font-bold tracking-wider text-primary group-hover:opacity-80 transition-opacity">
            TECHSHASTRA
          </span>
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-foreground/60 hover:text-primary transition-colors px-3.5 py-1.5 rounded-full border border-foreground/10 glass"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-20 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-2xl relative z-10">
          <div className="glass border border-foreground/10 p-8 sm:p-12 rounded-3xl shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="space-y-6">
              {/* Header Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono tracking-widest uppercase">
                <Sparkles className="w-3 h-3" />
                <span>Join TechShastra Community</span>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-heading font-light tracking-tight text-foreground">
                  Create Member Account
                </h1>
                <p className="text-sm font-light text-foreground/60 leading-relaxed max-w-xl">
                  Connect with the university technical club, upload and showcase your projects, register for hackathons, and collaborate with other developers.
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs leading-relaxed font-mono">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-mono tracking-wider uppercase text-foreground/70">
                      Full Name *
                    </Label>
                    <div className="relative">
                      <User className="w-4 h-4 text-foreground/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tanmay Raje"
                        className="pl-10 h-11 bg-black/20 border-foreground/10 focus:border-primary/50 text-sm rounded-xl font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-mono tracking-wider uppercase text-foreground/70">
                      Email Address *
                    </Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-foreground/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tanmay@utu.ac.in"
                        className="pl-10 h-11 bg-black/20 border-foreground/10 focus:border-primary/50 text-sm rounded-xl font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs font-mono tracking-wider uppercase text-foreground/70">
                      Password *
                    </Label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-foreground/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="•••••••• (min 6 chars)"
                        className="pl-10 h-11 bg-black/20 border-foreground/10 focus:border-primary/50 text-sm rounded-xl font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-xs font-mono tracking-wider uppercase text-foreground/70">
                      Confirm Password *
                    </Label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-foreground/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10 h-11 bg-black/20 border-foreground/10 focus:border-primary/50 text-sm rounded-xl font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentId" className="text-xs font-mono tracking-wider uppercase text-foreground/70">
                      Student ID / Roll No. (Optional)
                    </Label>
                    <div className="relative">
                      <BookOpen className="w-4 h-4 text-foreground/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <Input
                        id="studentId"
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="UTU-2024-CS-042"
                        className="pl-10 h-11 bg-black/20 border-foreground/10 focus:border-primary/50 text-sm rounded-xl font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skills" className="text-xs font-mono tracking-wider uppercase text-foreground/70">
                      Technical Skills (Optional)
                    </Label>
                    <div className="relative">
                      <Code className="w-4 h-4 text-foreground/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <Input
                        id="skills"
                        type="text"
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                        placeholder="React, Go, Python, ROS, AI"
                        className="pl-10 h-11 bg-black/20 border-foreground/10 focus:border-primary/50 text-sm rounded-xl font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="github" className="text-xs font-mono tracking-wider uppercase text-foreground/70">
                      GitHub Profile URL (Optional)
                    </Label>
                    <div className="relative">
                      <Github className="w-4 h-4 text-foreground/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <Input
                        id="github"
                        type="url"
                        value={github}
                        onChange={(e) => setGithub(e.target.value)}
                        placeholder="https://github.com/username"
                        className="pl-10 h-11 bg-black/20 border-foreground/10 focus:border-primary/50 text-sm rounded-xl font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin" className="text-xs font-mono tracking-wider uppercase text-foreground/70">
                      LinkedIn Profile URL (Optional)
                    </Label>
                    <div className="relative">
                      <Linkedin className="w-4 h-4 text-foreground/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <Input
                        id="linkedin"
                        type="url"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        placeholder="https://linkedin.com/in/username"
                        className="pl-10 h-11 bg-black/20 border-foreground/10 focus:border-primary/50 text-sm rounded-xl font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-xs font-mono tracking-wider uppercase text-foreground/70">
                    Short Bio (Optional)
                  </Label>
                  <Textarea
                    id="bio"
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us a little bit about yourself, your tech stack, and what you're working on..."
                    className="bg-black/20 border-foreground/10 focus:border-primary/50 text-sm rounded-xl font-mono resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-mono uppercase tracking-widest shadow-xl shadow-primary/25 mt-4"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Complete Registration & Access Hub
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <div className="pt-4 border-t border-foreground/10 text-center">
                <p className="text-xs text-foreground/60">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Signup;
