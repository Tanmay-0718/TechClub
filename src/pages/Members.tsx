/**
 * /members — Directory of all registered TechShastra students.
 * Visible to logged-in students + admins.
 */

import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Github, Linkedin, Search, Users, GraduationCap, Globe } from "lucide-react";
import { getAllStudents, type StudentProfile } from "@/lib/studentStore";
import { useStudentAuth } from "@/hooks/useStudentAuth";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const MemberCard = ({ student }: { student: StudentProfile }) => (
  <motion.div variants={fadeUp}>
    <Link to={`/members/${student.githubUsername}`}>
      <div className="glass rounded-3xl p-6 hover:bg-primary/5 transition-all duration-300 group cursor-pointer h-full flex flex-col gap-4">

        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-primary/20 flex-shrink-0 bg-primary/10 flex items-center justify-center">
            {/* Avatar loaded lazily from GitHub */}
            <img
              src={`https://avatars.githubusercontent.com/${student.githubUsername}?s=80`}
              alt={student.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <span className="text-xl font-heading text-primary hidden">
              {student.name[0].toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-heading font-light tracking-wide text-foreground group-hover:text-primary transition-colors truncate">
              {student.name}
            </p>
            <p className="text-xs text-foreground/40 font-light">@{student.githubUsername}</p>
          </div>
        </div>

        {/* Course / year */}
        {(student.course || student.year) && (
          <div className="flex items-center gap-1.5 text-xs text-foreground/50 font-light">
            <GraduationCap size={12} />
            {[student.course, student.year].filter(Boolean).join(", ")}
          </div>
        )}

        {/* Bio snippet */}
        {student.bio && (
          <p className="text-xs text-foreground/50 font-light line-clamp-2 italic">{student.bio}</p>
        )}

        {/* Top interests */}
        {student.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {student.interests.slice(0, 3).map((i) => (
              <Badge key={i} className="text-[9px] font-light bg-primary/10 text-primary border-0 px-2 py-0.5">
                {i}
              </Badge>
            ))}
            {student.interests.length > 3 && (
              <Badge variant="secondary" className="text-[9px] font-light px-2 py-0.5">
                +{student.interests.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Social icons */}
        <div className="flex items-center gap-3 text-foreground/30">
          <Github size={14} />
          {student.linkedinUrl && <Linkedin size={14} />}
          {student.portfolioUrl && <Globe size={14} />}
        </div>
      </div>
    </Link>
  </motion.div>
);

const Members = () => {
  const navigate = useNavigate();
  const { session } = useStudentAuth();
  const [query, setQuery] = useState("");
  const [filterInterest, setFilterInterest] = useState<string | null>(null);

  const allStudents = useMemo(() => getAllStudents().filter((s) => s.is_active), []);

  // Collect all unique interests for filter chips
  const allInterests = useMemo(() => {
    const set = new Set<string>();
    allStudents.forEach((s) => s.interests.forEach((i) => set.add(i)));
    return Array.from(set).sort();
  }, [allStudents]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return allStudents.filter((s) => {
      const matchQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.githubUsername.toLowerCase().includes(q) ||
        (s.course ?? "").toLowerCase().includes(q) ||
        s.skills.some((sk) => sk.toLowerCase().includes(q)) ||
        s.interests.some((i) => i.toLowerCase().includes(q));
      const matchInterest = !filterInterest || s.interests.includes(filterInterest);
      return matchQuery && matchInterest;
    });
  }, [allStudents, query, filterInterest]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-24 max-w-6xl">

        {/* Header */}
        <div className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass text-[10px] tracking-[0.2em] uppercase text-primary font-medium">
            <Users size={12} /> {allStudents.length} Members
          </div>
          <h1 className="text-4xl md:text-7xl font-heading font-light tracking-tight">
            <span className="text-foreground">Member </span>
            <span className="text-primary italic">Directory</span>
          </h1>
          <p className="text-lg text-foreground/50 max-w-xl mx-auto font-light italic">
            Explore the builders, hackers, and innovators of TechShastra.
          </p>
        </div>

        {/* Your profile shortcut */}
        {session && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-5 glass rounded-2xl flex items-center justify-between flex-wrap gap-3">
            <span className="text-sm text-foreground/60 font-light">
              Signed in as <strong className="text-foreground">{session.name}</strong>
            </span>
            <Button size="sm" variant="outline" className="rounded-full"
              onClick={() => navigate(`/members/${session.githubUsername}`)}>
              My Profile →
            </Button>
          </motion.div>
        )}

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, username, course, skill, interest…"
            className="pl-10 glass h-14 rounded-2xl border-0 focus-visible:ring-1 focus-visible:ring-primary/30 text-sm font-light"
          />
        </div>

        {/* Interest filters */}
        {allInterests.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10">
            <button
              onClick={() => setFilterInterest(null)}
              className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-light transition-all duration-300 ${!filterInterest ? "bg-primary text-primary-foreground" : "glass text-foreground/50 hover:text-foreground"}`}>
              All
            </button>
            {allInterests.map((i) => (
              <button key={i} onClick={() => setFilterInterest(filterInterest === i ? null : i)}
                className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-light transition-all duration-300 ${filterInterest === i ? "bg-primary text-primary-foreground" : "glass text-foreground/50 hover:text-foreground"}`}>
                {i}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-24 text-foreground/40 font-light">
            {allStudents.length === 0
              ? "No members yet. Be the first to sign up!"
              : "No members match your search."}
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((s) => <MemberCard key={s.id} student={s} />)}
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Members;
