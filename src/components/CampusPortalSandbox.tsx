import React, { useState } from "react";
import { 
    BookOpen, 
    Bell, 
    Calculator, 
    Users, 
    Activity, 
    CheckCircle2, 
    Search, 
    ExternalLink, 
    Calendar,
    GraduationCap,
    Laptop,
    Shield
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const CampusPortalSandbox = () => {
    const [activeTab, setActiveTab] = useState<"notices" | "calculator" | "hub">("notices");
    const [searchQuery, setSearchQuery] = useState("");
    
    // SGPA Calculator State
    const [credits, setCredits] = useState<number[]>([4, 4, 3, 3, 2]);
    const [grades, setGrades] = useState<number[]>([10, 9, 8, 9, 10]);

    const calculateSGPA = () => {
        const totalCredits = credits.reduce((a, b) => a + b, 0);
        const earnedPoints = credits.reduce((sum, c, i) => sum + (c * (grades[i] || 0)), 0);
        return totalCredits > 0 ? (earnedPoints / totalCredits).toFixed(2) : "0.00";
    };

    const notices = [
        {
            id: 1,
            title: "TechShastra Himalayan Innovation Sprint 2026",
            date: "Today, 10:30 AM",
            category: "Club Event",
            content: "48-hour state-wide technical hackathon registration is now open for all UTU affiliated engineering institutes."
        },
        {
            id: 2,
            title: "Even Semester Examination Scheme & Admit Card Release",
            date: "Yesterday",
            category: "Academics",
            content: "Detailed theory and laboratory examination schedules for B.Tech CSE, ECE, and Mechanical branches are live."
        },
        {
            id: 3,
            title: "Hands-on Workshop: ROS & Autonomous Mobile Robotics",
            date: "2 days ago",
            category: "Workshop",
            content: "Joint masterclass by TechShastra Robotics Division on Linux kernel drivers and stereoscopic SLAM."
        }
    ];

    const filteredNotices = notices.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        n.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="w-full h-full min-h-[620px] bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
            {/* Top Campus App Bar */}
            <header className="bg-slate-900/90 border-b border-slate-800 px-6 py-4 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md shadow-violet-500/20">
                        <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm tracking-wide text-white">UTU Smart Campus Portal</span>
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-0 text-[9px] uppercase tracking-wider py-0">
                                Live Virtual Port
                            </Badge>
                        </div>
                        <p className="text-[11px] text-slate-400">Veer Madho Singh Bhandari Uttarakhand Technical University</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                    <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/50">
                        <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                        <span className="text-slate-400 font-mono text-[11px]">API: 12ms</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400 font-mono text-[11px]">1,420 Online</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-medium text-slate-300">
                            TR
                        </div>
                        <div className="text-left hidden md:block">
                            <p className="text-xs font-medium text-slate-200">Tanmay Raje</p>
                            <p className="text-[10px] text-slate-400">CSE • 2026 Batch</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="bg-slate-900/50 border-b border-slate-800/60 px-6 flex gap-2">
                <button
                    onClick={() => setActiveTab("notices")}
                    className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all ${
                        activeTab === "notices"
                            ? "border-violet-500 text-white"
                            : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                >
                    <Bell className="w-3.5 h-3.5" />
                    Notice Broadcasts
                </button>
                <button
                    onClick={() => setActiveTab("calculator")}
                    className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all ${
                        activeTab === "calculator"
                            ? "border-violet-500 text-white"
                            : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                >
                    <Calculator className="w-3.5 h-3.5" />
                    SGPA Estimator
                </button>
                <button
                    onClick={() => setActiveTab("hub")}
                    className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all ${
                        activeTab === "hub"
                            ? "border-violet-500 text-white"
                            : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                >
                    <Laptop className="w-3.5 h-3.5" />
                    TechShastra Club Desk
                </button>
            </div>

            {/* Tab Body */}
            <div className="p-6 flex-1 overflow-y-auto">
                {activeTab === "notices" && (
                    <div className="max-w-4xl mx-auto space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search notices, events, updates..."
                                    className="pl-9 h-9 text-xs bg-slate-900 border-slate-800 text-slate-200 rounded-xl"
                                />
                            </div>
                            <span className="text-xs text-slate-400 font-mono">{filteredNotices.length} bulletins</span>
                        </div>

                        <div className="space-y-3">
                            {filteredNotices.map((n) => (
                                <div 
                                    key={n.id}
                                    className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-violet-500/30 transition-all space-y-2"
                                >
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-violet-500/20 text-violet-300 border-0 text-[10px]">
                                            {n.category}
                                        </Badge>
                                        <span className="text-[11px] text-slate-500 font-mono">{n.date}</span>
                                    </div>
                                    <h4 className="text-sm font-semibold text-slate-100">{n.title}</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">{n.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "calculator" && (
                    <div className="max-w-xl mx-auto p-6 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-6">
                        <div>
                            <h3 className="text-base font-semibold text-white">Semester Grade Point (SGPA) Estimator</h3>
                            <p className="text-xs text-slate-400">Interactive calculation engine connected to UTU 10-point grading scale.</p>
                        </div>

                        <div className="space-y-3">
                            {credits.map((c, idx) => (
                                <div key={idx} className="flex items-center gap-4 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                                    <span className="text-xs font-mono text-slate-400 w-16">Sub #{idx + 1}</span>
                                    <div className="flex-1 flex items-center gap-2">
                                        <span className="text-[11px] text-slate-400">Credits:</span>
                                        <input
                                            type="number"
                                            value={c}
                                            onChange={(e) => {
                                                const newC = [...credits];
                                                newC[idx] = Number(e.target.value) || 0;
                                                setCredits(newC);
                                            }}
                                            className="w-14 h-7 text-xs bg-slate-900 border border-slate-700 rounded text-center text-white"
                                            min="1"
                                            max="6"
                                        />
                                    </div>
                                    <div className="flex-1 flex items-center gap-2">
                                        <span className="text-[11px] text-slate-400">Grade Pt:</span>
                                        <input
                                            type="number"
                                            value={grades[idx]}
                                            onChange={(e) => {
                                                const newG = [...grades];
                                                newG[idx] = Number(e.target.value) || 0;
                                                setGrades(newG);
                                            }}
                                            className="w-14 h-7 text-xs bg-slate-900 border border-slate-700 rounded text-center text-white"
                                            min="0"
                                            max="10"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 rounded-xl bg-violet-950/40 border border-violet-800/40 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-violet-300 uppercase tracking-widest font-mono">Calculated SGPA</p>
                                <p className="text-2xl font-bold text-white font-mono mt-0.5">{calculateSGPA()} / 10.0</p>
                            </div>
                            <Badge className="bg-violet-500 text-white border-0 text-xs px-3 py-1">
                                First Division Distinction
                            </Badge>
                        </div>
                    </div>
                )}

                {activeTab === "hub" && (
                    <div className="max-w-4xl mx-auto space-y-4">
                        <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-900/30 via-indigo-900/20 to-slate-900 border border-violet-700/30 space-y-3">
                            <h3 className="text-base font-semibold text-white">TechShastra Engineering Council Hub</h3>
                            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                                Direct integration between the UTU Campus Portal and TechShastra's Go backend REST microservices, providing autonomous student pipelines and project tracking.
                            </p>
                            <div className="flex flex-wrap gap-2 pt-2">
                                <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[10px] font-mono">
                                    Status: Online
                                </Badge>
                                <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[10px] font-mono">
                                    SQLite DB: persistent
                                </Badge>
                                <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[10px] font-mono">
                                    Latency: 14ms
                                </Badge>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Sandbox Footer Bar */}
            <footer className="bg-slate-900 border-t border-slate-800 px-6 py-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>TECHSHASTRA EPHEMERAL SANDBOX VM</span>
                <span>SANDBOX PORT: 3000 • TLS: VALID</span>
            </footer>
        </div>
    );
};

export default CampusPortalSandbox;
