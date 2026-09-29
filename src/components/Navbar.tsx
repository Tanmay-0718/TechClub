import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import { getStudentSession } from "@/lib/studentStore";
import { useAuth } from "@/lib/authContext";
import { User, LogOut, ShieldCheck, LayoutDashboard } from "lucide-react";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const studentSession = getStudentSession();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileMenuOpen]);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Projects", href: "/projects" },
    { label: "Events", href: "/events" },
    // { label: "Blog", href: "/blog" },
    { label: "Socials", href: "/socials" },
    // { label: "Research & Books", href: "/publications" },
    // { label: "Resources", href: "/resources" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
        ? "glass py-2"
        : "bg-transparent py-4"
        }`}
    >
      <div className="container mx-auto px-4 relative">
        <div className="flex items-center justify-between">
          {/* Logo — left */}
          <Link to="/" className="flex items-center space-x-3 group shrink-0" onClick={() => setIsMobileMenuOpen(false)}>
            <img src="/favicon.ico" alt="TECHSHASTRA Logo" className="w-8 h-8 object-contain group-hover:scale-110 transition-transform duration-300" />
            <span className="font-heading text-lg tracking-[0.15em] font-light text-foreground group-hover:text-primary transition-colors">
              TECHSHASTRA
            </span>
          </Link>

          {/* Desktop Navigation — center */}
          <div className="hidden md:flex items-center space-x-8 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              link.href.startsWith('#') ? (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-light tracking-wider text-foreground/70 hover:text-foreground active:scale-95 transition-[color,transform] duration-150 ease-emil-out"
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.querySelector(link.href);
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-sm font-light tracking-wider text-foreground/70 hover:text-foreground active:scale-95 transition-[color,transform] duration-150 ease-emil-out"
                >
                  {link.label}
                </Link>
              )
            ))}
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center space-x-4 shrink-0">
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 text-xs font-mono tracking-wider text-foreground/70 hover:text-foreground active:scale-95 transition-all glass px-3.5 py-1.5 rounded-full border border-foreground/10 hover:border-primary/40"
                >
                  <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                    {user?.name ? user.name.slice(0, 1).toUpperCase() : 'U'}
                  </div>
                  <span className="truncate max-w-[120px]">{user?.name}</span>
                </Link>

                {(user?.role === 'admin' || user?.role === 'core') && (
                  <Link
                    to="/admin"
                    className="text-xs font-mono uppercase tracking-widest text-primary hover:text-primary/80 flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Admin
                  </Link>
                )}

                <Button
                  onClick={logout}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2.5 rounded-full text-foreground/40 hover:text-foreground text-xs font-mono"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="rounded-full px-4 text-xs font-mono text-foreground/70 hover:text-foreground">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" className="rounded-full px-5 text-xs font-mono tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                    Join Now
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground/70 active:scale-90 transition-transform duration-100 ease-emil-out z-50 relative rounded-full"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Overlay — rendered into document.body to break out of containing blocks */}
        {typeof document !== "undefined" && createPortal(
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                className="fixed inset-0 z-[100] flex flex-col md:hidden overflow-y-auto"
                style={{ backgroundColor: "hsl(var(--background))" }}
              >
                {/* Mobile Menu Header with Logo & Close */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-foreground/10 sticky top-0 z-10" style={{ backgroundColor: "hsl(var(--background))" }}>
                  <Link
                    to="/"
                    className="flex items-center space-x-3 active:scale-95 transition-transform duration-100 ease-emil-out"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <img src="/favicon.ico" alt="TECHSHASTRA Logo" className="w-8 h-8 object-contain" />
                    <span className="font-heading text-lg tracking-[0.15em] font-light text-foreground">
                      TECHSHASTRA
                    </span>
                  </Link>
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-foreground hover:bg-foreground/10 active:scale-90 transition-transform duration-100 ease-emil-out rounded-full w-9 h-9"
                      onClick={() => setIsMobileMenuOpen(false)}
                      aria-label="Close menu"
                    >
                      <X className="w-6 h-6" />
                    </Button>
                  </div>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 flex flex-col items-center justify-center space-y-6 px-6 py-10">
                  {navLinks.map((link, idx) => (
                    <motion.div
                      key={link.label}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.04 + idx * 0.03, duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                      className="w-full text-center"
                    >
                      {link.href.startsWith('#') ? (
                        <a
                          href={link.href}
                          className="block text-2xl font-heading font-light tracking-widest text-foreground/80 hover:text-primary active:scale-95 transition-[color,transform] duration-150 ease-emil-out py-2"
                          onClick={(e) => {
                            e.preventDefault();
                            setIsMobileMenuOpen(false);
                            const element = document.querySelector(link.href);
                            element?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          to={link.href}
                          className="block text-2xl font-heading font-light tracking-widest text-foreground/80 hover:text-primary active:scale-95 transition-[color,transform] duration-150 ease-emil-out py-2"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {link.label}
                        </Link>
                      )}
                    </motion.div>
                  ))}

                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + navLinks.length * 0.04 }}
                    className="w-full max-w-xs pt-4 space-y-3"
                  >
                    {isAuthenticated ? (
                      <div className="space-y-2">
                        <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button size="lg" className="w-full rounded-full font-mono text-xs uppercase tracking-widest bg-primary text-primary-foreground shadow-xl">
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            My Dashboard & Projects
                          </Button>
                        </Link>
                        {(user?.role === 'admin' || user?.role === 'core') && (
                          <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                            <Button size="lg" variant="outline" className="w-full rounded-full font-mono text-xs uppercase tracking-widest gap-2">
                              <ShieldCheck className="w-4 h-4 text-primary" />
                              Admin Console
                            </Button>
                          </Link>
                        )}
                        <Button
                          size="lg"
                          variant="ghost"
                          onClick={() => {
                            logout();
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full rounded-full font-mono text-xs text-foreground/60"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign Out
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button size="lg" variant="outline" className="w-full rounded-full font-mono text-xs uppercase tracking-widest mb-2">
                            Sign In
                          </Button>
                        </Link>
                        <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button size="lg" className="w-full rounded-full font-mono text-xs uppercase tracking-widest bg-primary text-primary-foreground shadow-xl">
                            Join Club / Sign Up
                          </Button>
                        </Link>
                      </div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
    </nav>
  );
};

export default Navbar;
