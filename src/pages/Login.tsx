import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/authContext';
import { trackPageView } from '@/lib/activityTracker';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  useEffect(() => {
    trackPageView('Member Login');
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      toast({
        title: "Welcome back!",
        description: "You have signed in successfully.",
      });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-20 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="glass border border-foreground/10 p-8 sm:p-10 rounded-3xl shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="space-y-6">
              {/* Header Badge */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono tracking-widest uppercase">
                  <Sparkles className="w-3 h-3" />
                  <span>TechShastra Portal</span>
                </div>
                <Link to="/auth" className="text-[10px] font-mono tracking-wider text-foreground/40 hover:text-primary transition-colors flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Super Admin</span>
                </Link>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-heading font-light tracking-tight text-foreground">
                  Sign In
                </h1>
                <p className="text-sm font-light text-foreground/60 leading-relaxed">
                  Enter your credentials to access club projects, registered events, and developer community.
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs leading-relaxed font-mono">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-mono tracking-wider uppercase text-foreground/70">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-foreground/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@utu.ac.in"
                      className="pl-10 h-11 bg-black/20 border-foreground/10 focus:border-primary/50 text-sm rounded-xl font-mono"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-mono tracking-wider uppercase text-foreground/70">
                      Password
                    </Label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-foreground/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 h-11 bg-black/20 border-foreground/10 focus:border-primary/50 text-sm rounded-xl font-mono"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-mono uppercase tracking-widest shadow-lg shadow-primary/25 mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In to Account
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <div className="pt-4 border-t border-foreground/10 text-center">
                <p className="text-xs text-foreground/60">
                  Don't have an account yet?{' '}
                  <Link to="/signup" className="text-primary hover:underline font-medium">
                    Create account
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

export default Login;
