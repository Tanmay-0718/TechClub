import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { StudentAuthProvider } from "@/hooks/useStudentAuth";
import { AuthProvider } from "@/lib/authContext";
import Index from "./pages/Index";
import AboutPage from "./pages/AboutPage";
import Join from "./pages/Join";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UserDashboard from "./pages/UserDashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectLive from "./pages/ProjectLive";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Resources from "./pages/Resources";
import Gallery from "./pages/Gallery";
import FAQ from "./pages/FAQ";
import Achievements from "./pages/Achievements";
import Socials from "./pages/Socials";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Publications from "./pages/Publications";
import ContactPage from "./pages/Contact";
import NotFound from "./pages/NotFound";
import MemberProfile from "./pages/MemberProfile";
import MemberEdit from "./pages/MemberEdit";
import Members from "./pages/Members";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedStudentRoute from "./components/ProtectedStudentRoute";
import { getStoredPageVisibility } from "./lib/adminStore";

// Reads page visibility from localStorage; redirects to / if hidden by admin
function PageGuard({ path, children }: { path: string; children: React.ReactNode }) {
  const pages = getStoredPageVisibility();
  const entry = pages.find(p => p.page_path === path);
  // If explicitly hidden, redirect home
  if (entry && !entry.is_visible) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <StudentAuthProvider>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/join" element={<Join />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
                <Route path="/auth" element={<Auth />} />

                <Route path="/projects" element={<PageGuard path="/projects"><Projects /></PageGuard>} />
              <Route path="/projects/:id" element={<PageGuard path="/projects"><ProjectDetail /></PageGuard>} />
              <Route path="/projects/:id/live" element={<PageGuard path="/projects"><ProjectLive /></PageGuard>} />

              <Route path="/events" element={<PageGuard path="/events"><Events /></PageGuard>} />
              <Route path="/events/:id" element={<PageGuard path="/events"><EventDetail /></PageGuard>} />

              <Route path="/blog" element={<PageGuard path="/blog"><Blog /></PageGuard>} />
              <Route path="/blog/:slug" element={<PageGuard path="/blog"><BlogPost /></PageGuard>} />

              <Route path="/resources" element={<PageGuard path="/resources"><Resources /></PageGuard>} />
              <Route path="/gallery" element={<PageGuard path="/gallery"><Gallery /></PageGuard>} />
              <Route path="/faq" element={<PageGuard path="/faq"><FAQ /></PageGuard>} />
              <Route path="/achievements" element={<PageGuard path="/achievements"><Achievements /></PageGuard>} />
              <Route path="/socials" element={<PageGuard path="/socials"><Socials /></PageGuard>} />
              <Route path="/publications" element={<PageGuard path="/publications"><Publications /></PageGuard>} />
              <Route path="/contact" element={<ContactPage />} />

              {/* Student members — directory + individual profiles + edit */}
              <Route
                path="/members"
                element={
                  <ProtectedStudentRoute>
                    <Members />
                  </ProtectedStudentRoute>
                }
              />
              <Route
                path="/members/:username"
                element={
                  <ProtectedStudentRoute>
                    <MemberProfile />
                  </ProtectedStudentRoute>
                }
              />
              <Route
                path="/members/:username/edit"
                element={
                  <ProtectedStudentRoute>
                    <MemberEdit />
                  </ProtectedStudentRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    {({ userRole }) => <Admin userRole={userRole} />}
                  </ProtectedRoute>
                }
              />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </StudentAuthProvider>
  </ThemeProvider>
);

export default App;
