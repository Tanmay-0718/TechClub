import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    ArrowLeft, 
    ExternalLink, 
    Github, 
    Code2, 
    Rocket, 
    AlertCircle, 
    Cpu, 
    ShieldAlert, 
    Terminal, 
    RefreshCw, 
    Clock, 
    Lock, 
    CheckCircle2, 
    Sparkles
} from "lucide-react";
import { getAllProjects, fetchProjectsFromBackend, parseGitHubUrl, type Project, hardcodedProjects } from "@/lib/projectStore";
import PythonRunner from "@/components/PythonRunner";
import CampusPortalSandbox from "@/components/CampusPortalSandbox";
import BorderGlow from "@/components/BorderGlow";

interface DeployabilityAssessment {
    isDeployable: boolean;
    type: 'live_web' | 'github_sandbox' | 'python_env' | 'none';
    category: 'hardware' | 'daemon' | 'missing' | 'web';
    title: string;
    reason: string;
    targetUrl?: string;
    gitInfo?: { owner: string; repo: string } | null;
}

const assessDeployability = (proj: Project): DeployabilityAssessment => {
    const gitUrl = proj.github || proj.github_url || "";
    const gitInfo = parseGitHubUrl(gitUrl);
    const demoUrl = (proj.demo || proj.live_url || "").trim();
    const hasValidDemo = demoUrl.startsWith("http://") || demoUrl.startsWith("https://");

    const tagsLower = (proj.tags || []).map(t => (typeof t === 'string' ? t.toLowerCase() : ''));
    const titleLower = (proj.title || "").toLowerCase();
    const descLower = (proj.description || "").toLowerCase();

    // Check 1: Hardware & Physical Robotics (e.g. AURA Rover, ROS, Arduino, Sensors)
    const isHardware = tagsLower.some(t => 
        t.includes("hardware") || t.includes("robotics") || t.includes("ros") || 
        t.includes("iot") || t.includes("rover") || t.includes("microcontroller") || 
        t.includes("sensor") || t.includes("c++") || t.includes("esp32")
    ) || titleLower.includes("rover") || descLower.includes("chassis") || descLower.includes("himalayan rover");

    if (isHardware) {
        return {
            isDeployable: false,
            type: 'none',
            category: 'hardware',
            title: "This project is not deployable or cannot be showcased",
            reason: "Physical Hardware & Robotics Architecture: This project is engineered for physical outdoor rovers, motor controllers, stereoscopic depth cameras, and embedded sensors. It requires physical hardware execution and cannot be deployed in a client-side browser sandbox.",
            gitInfo,
        };
    }

    // Check 2: Low-level Kernel / Daemon / System Security Service (e.g. Sentinel Shield)
    const isDaemon = tagsLower.some(t => 
        t.includes("wireguard") || t.includes("kernel") || t.includes("ebpf") || 
        t.includes("daemon") || (t.includes("cybersecurity") && !hasValidDemo && !gitInfo)
    ) || titleLower.includes("sentinel") || descLower.includes("intrusion detection");

    if (isDaemon) {
        return {
            isDeployable: false,
            type: 'none',
            category: 'daemon',
            title: "This project is not deployable or cannot be showcased",
            reason: "System Daemon & Kernel Service: This project requires dedicated OS kernel networking privileges, eBPF probe socket access, and server-level daemon infrastructure that cannot be virtualized in an isolated client-side sandbox environment.",
            gitInfo,
        };
    }

    // Check 3: Live Web Deployment (has direct demo URL)
    if (hasValidDemo) {
        return {
            isDeployable: true,
            type: 'live_web',
            category: 'web',
            title: "Temporary Web Deployment",
            reason: "Live web application ready for ephemeral sandbox deployment.",
            targetUrl: demoUrl,
            gitInfo,
        };
    }

    // Check 4: Python interactive project with valid repository
    if (proj.language === 'python' && gitInfo) {
        return {
            isDeployable: true,
            type: 'python_env',
            category: 'web',
            title: "Interactive Python Runtime",
            reason: "WebAssembly Pyodide sandbox configured for Python execution.",
            gitInfo,
        };
    }

    // Check 5: Web project with valid GitHub repository
    if (gitInfo && (tagsLower.some(t => t.includes("react") || t.includes("vue") || t.includes("web") || t.includes("html") || t.includes("javascript") || t.includes("typescript") || t.includes("node")) || proj.language === 'javascript')) {
        return {
            isDeployable: true,
            type: 'github_sandbox',
            category: 'web',
            title: "Containerized Web Sandbox",
            reason: "Interactive containerized sandbox running repository preview.",
            gitInfo,
        };
    }

    // Default: Missing web deployment / missing repo or non-deployable
    return {
        isDeployable: false,
        type: 'none',
        category: 'missing',
        title: "This project is not deployable or cannot be showcased",
        reason: "No Web Deployment Configured: This project currently does not provide a live web endpoint, public deployment URL, or containerized browser deployment artifact.",
        gitInfo,
    };
};

const STAGING_STEPS = [
    "Allocating ephemeral sandbox container instance...",
    "Mounting build bundle and configuring virtual networking...",
    "Binding ephemeral localhost port (3000) with TLS tunnel...",
    "Spinning up live web preview server...",
    "Temporary deployment active! Connecting viewport."
];

const ProjectLive = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    // Ephemeral Sandbox Staging & Lifecycle
    const [isStaging, setIsStaging] = useState(true);
    const [stagingStep, setStagingStep] = useState(0);
    const [stagingProgress, setStagingProgress] = useState(15);
    
    // Sandbox Session Timer (5 minutes = 300s)
    const [timeLeft, setTimeLeft] = useState(300);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isExpired, setIsExpired] = useState(false);
    const [iframeLoading, setIframeLoading] = useState(true);
    const [iframeKey, setIframeKey] = useState(0);

    // 1. Fetch & locate project
    useEffect(() => {
        let isMounted = true;

        const findProject = async () => {
            setLoading(true);
            let found = getAllProjects().find(p => p.id === id);

            if (!found) {
                try {
                    const remoteProjects = await fetchProjectsFromBackend();
                    found = remoteProjects.find(p => p.id === id);
                } catch {
                    // Ignore backend error
                }
            }

            if (!found) {
                found = hardcodedProjects.find(p => p.id === id);
            }

            if (isMounted) {
                if (found) {
                    setProject(found);
                } else {
                    setProject(null);
                }
                setLoading(false);
            }
        };

        findProject();

        return () => {
            isMounted = false;
        };
    }, [id]);

    // 2. Ephemeral Deployment Staging Simulation (for deployable projects)
    useEffect(() => {
        if (!project) return;
        const assessment = assessDeployability(project);
        if (!assessment.isDeployable) {
            setIsStaging(false);
            return;
        }

        setIsStaging(true);
        setStagingStep(0);
        setStagingProgress(15);
        setIsSessionActive(false);
        setIsExpired(false);
        setTimeLeft(300);

        const stepInterval = setInterval(() => {
            setStagingStep(prev => {
                if (prev < STAGING_STEPS.length - 1) {
                    const next = prev + 1;
                    setStagingProgress(Math.min(100, Math.round(((next + 1) / STAGING_STEPS.length) * 100)));
                    return next;
                } else {
                    clearInterval(stepInterval);
                    setIsStaging(false);
                    setIsSessionActive(true);
                    setIframeLoading(false);
                    return prev;
                }
            });
        }, 650);

        return () => clearInterval(stepInterval);
    }, [project, iframeKey]);

    // 3. Ephemeral Countdown Timer
    useEffect(() => {
        if (!isSessionActive || isExpired) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setIsSessionActive(false);
                    setIsExpired(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isSessionActive, isExpired]);

    // Handlers
    const handleExtendSession = () => {
        setTimeLeft(prev => prev + 300); // Add 5 more minutes
        setIsSessionActive(true);
        setIsExpired(false);
    };

    const handleRestartSandbox = () => {
        setIframeLoading(true);
        setIframeKey(prev => prev + 1);
    };

    const formatTimer = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col justify-between">
                <Navbar />
                <div className="flex flex-col items-center justify-center py-40 space-y-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-foreground/50 text-xs tracking-widest uppercase font-mono">Initializing TechShastra Environment...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-background flex flex-col justify-between">
                <Navbar />
                <main className="container mx-auto px-4 py-32 max-w-2xl text-center space-y-6">
                    <div className="w-16 h-16 rounded-3xl glass mx-auto flex items-center justify-center text-primary border border-primary/20">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-heading font-light">Project Not Located</h1>
                    <p className="text-sm font-light text-foreground/60 italic">
                        The requested project could not be found in our digital archives or local repository.
                    </p>
                    <Button onClick={() => navigate("/projects")} className="rounded-full bg-primary text-primary-foreground px-8">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Showcase
                    </Button>
                </main>
                <Footer />
            </div>
        );
    }

    const assessment = assessDeployability(project);

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-4 py-24 max-w-6xl">
                {/* Navigation & Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                    <div className="space-y-2">
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/projects")}
                            className="px-0 hover:bg-transparent text-foreground/50 hover:text-primary transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            <span className="text-xs uppercase tracking-widest font-light">Back to Showcase</span>
                        </Button>

                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-3xl md:text-5xl font-heading font-light tracking-tight">
                                {project.title}
                            </h1>
                            {assessment.isDeployable ? (
                                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] tracking-widest uppercase px-3 py-1 font-mono">
                                    🟢 Temporary Sandbox
                                </Badge>
                            ) : (
                                <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] tracking-widest uppercase px-3 py-1 font-mono">
                                    🔒 Non-Deployable
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Session Timer (Visible when Deployable and not Staging) */}
                        {assessment.isDeployable && !isStaging && (
                            <div className={`glass rounded-full px-4 py-2 flex items-center gap-2 border ${
                                timeLeft < 60 ? 'border-red-500/40 bg-red-500/10 text-red-400' : 'border-primary/20 bg-primary/5 text-primary'
                            }`}>
                                <Clock className="w-3.5 h-3.5 animate-pulse" />
                                <span className="text-[10px] uppercase tracking-widest font-mono font-medium">Session:</span>
                                <span className="font-mono text-sm font-bold">{formatTimer(timeLeft)}</span>
                            </div>
                        )}

                        {/* Extend Session Button */}
                        {assessment.isDeployable && !isStaging && (
                            <Button
                                variant="outline"
                                onClick={handleExtendSession}
                                className="glass border-primary/20 rounded-full text-xs font-mono px-4 h-10 hover:bg-primary/10"
                            >
                                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary" />
                                +5 Min
                            </Button>
                        )}

                        {/* Restart / Redeploy Button */}
                        {assessment.isDeployable && !isStaging && (
                            <Button
                                variant="outline"
                                onClick={handleRestartSandbox}
                                className="glass border-0 rounded-full text-xs font-mono px-4 h-10 hover:bg-white/5"
                                title="Re-deploy Temporary Sandbox"
                            >
                                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                                Re-deploy
                            </Button>
                        )}

                        {/* Source Button if github exists */}
                        {project.github && project.github !== "#" && (
                            <Button variant="outline" className="glass border-0 rounded-full px-5 h-10" asChild>
                                <a href={project.github} target="_blank" rel="noreferrer">
                                    <Github className="w-4 h-4 mr-2" />
                                    <span className="text-[10px] uppercase tracking-widest">Source</span>
                                </a>
                            </Button>
                        )}

                        {/* External Full View Button if demo exists */}
                        {project.demo && (
                            <Button className="bg-primary text-primary-foreground rounded-full px-6 h-10 shadow-lg" asChild>
                                <a href={project.demo} target="_blank" rel="noreferrer">
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    <span className="text-[10px] uppercase tracking-widest">Full View</span>
                                </a>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Main Sandbox Section */}
                <div className="space-y-12 mb-16">
                    {/* CASE 1: PROJECT IS NOT DEPLOYABLE */}
                    {!assessment.isDeployable ? (
                        <BorderGlow
                            borderRadius={28}
                            backgroundColor="#0c0a14"
                            glowColor="40 80 80"
                            colors={['#f59e0b', '#c084fc', '#6366f1']}
                            glowRadius={40}
                            glowIntensity={1.0}
                            coneSpread={25}
                            edgeSensitivity={30}
                            animated={true}
                            fillOpacity={0.4}
                            className="w-full shadow-2xl"
                        >
                            <div className="overflow-hidden p-8 md:p-14 relative rounded-[inherit]">
                                {/* Decorative ambient gradients */}
                                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
                                <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

                                {/* Telemetry Bar */}
                                <div className="flex items-center justify-between pb-6 border-b border-foreground/10 text-xs font-mono text-foreground/40 mb-8">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                                        <span className="text-amber-400 font-semibold tracking-wider">SANDBOX STATUS: OFFLINE</span>
                                    </div>
                                    <span className="uppercase tracking-widest hidden sm:inline">
                                        SYSTEM TIER: {assessment.category === 'hardware' ? 'EMBEDDED HARDWARE' : assessment.category === 'daemon' ? 'KERNEL SERVICE' : 'LOCAL ARTIFACT'}
                                    </span>
                                </div>

                                {/* Core Non-Deployable Card */}
                                <div className="max-w-3xl mx-auto text-center space-y-6">
                                    <div className="w-20 h-20 rounded-3xl glass border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-xl shadow-amber-500/10">
                                        {assessment.category === 'hardware' ? (
                                            <Cpu className="w-10 h-10 animate-pulse" />
                                        ) : assessment.category === 'daemon' ? (
                                            <ShieldAlert className="w-10 h-10 animate-pulse" />
                                        ) : (
                                            <AlertCircle className="w-10 h-10 animate-pulse" />
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <h2 className="text-2xl md:text-4xl font-heading font-light tracking-tight text-foreground">
                                            This project is not deployable or cannot be showcased
                                        </h2>
                                        <p className="text-sm md:text-base font-light text-foreground/70 leading-relaxed italic max-w-2xl mx-auto">
                                            {assessment.reason}
                                        </p>
                                    </div>

                                    {/* Architecture & Specs Breakdown */}
                                    <div className="grid sm:grid-cols-3 gap-4 pt-4 text-left">
                                        <div className="glass p-5 rounded-2xl border border-foreground/5 space-y-2">
                                            <p className="text-[10px] uppercase font-mono tracking-widest text-foreground/40">Execution Model</p>
                                            <p className="text-xs font-medium text-foreground">
                                                {assessment.category === 'hardware' ? 'Physical Bare-Metal' : assessment.category === 'daemon' ? 'Root Network Daemon' : 'Non-Web Binary'}
                                            </p>
                                        </div>
                                        <div className="glass p-5 rounded-2xl border border-foreground/5 space-y-2">
                                            <p className="text-[10px] uppercase font-mono tracking-widest text-foreground/40">Target Platform</p>
                                            <p className="text-xs font-medium text-foreground">
                                                {assessment.category === 'hardware' ? 'Microcontroller & LiDAR' : assessment.category === 'daemon' ? 'Linux Kernel & eBPF' : 'Standalone Artifact'}
                                            </p>
                                        </div>
                                        <div className="glass p-5 rounded-2xl border border-foreground/5 space-y-2">
                                            <p className="text-[10px] uppercase font-mono tracking-widest text-foreground/40">Browser Virtualization</p>
                                            <p className="text-xs font-medium text-amber-400">Unavailable</p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
                                        {project.github && project.github !== "#" && (
                                            <Button className="bg-primary text-primary-foreground rounded-full px-8 h-12 shadow-lg" asChild>
                                                <a href={project.github} target="_blank" rel="noreferrer">
                                                    <Github className="w-4 h-4 mr-2" />
                                                    <span className="text-xs uppercase tracking-widest">Explore Source Code</span>
                                                </a>
                                            </Button>
                                        )}

                                        <Button
                                            variant="outline"
                                            onClick={() => navigate("/projects")}
                                            className="glass border-0 rounded-full px-8 h-12 hover:bg-white/5"
                                        >
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            <span className="text-xs uppercase tracking-widest">Back to Showcase</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </BorderGlow>
                    ) : (
                        /* CASE 2: PROJECT IS DEPLOYABLE -> TEMPORARY SANDBOX */
                        <div className="space-y-4">
                            {/* Staging Phase */}
                            {isStaging ? (
                                <BorderGlow
                                    borderRadius={28}
                                    backgroundColor="#0c0a14"
                                    glowColor="190 90 60"
                                    colors={['#38bdf8', '#c084fc', '#818cf8']}
                                    glowRadius={40}
                                    glowIntensity={1.0}
                                    coneSpread={25}
                                    edgeSensitivity={30}
                                    animated={true}
                                    fillOpacity={0.35}
                                    className="w-full shadow-2xl"
                                >
                                    <div className="min-h-[580px] p-8 md:p-12 flex flex-col justify-between relative overflow-hidden rounded-[inherit]">
                                        <div className="flex items-center justify-between border-b border-foreground/10 pb-4 text-xs font-mono text-foreground/40">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                                                <span className="text-cyan-400 font-semibold tracking-wider">DEPLOYING TEMPORARY SANDBOX...</span>
                                            </div>
                                            <span>TECHSHASTRA RUNTIME ENGINE</span>
                                        </div>

                                        <div className="max-w-xl mx-auto w-full text-center space-y-6 my-auto">
                                            <div className="w-16 h-16 rounded-2xl glass border border-primary/30 flex items-center justify-center mx-auto text-primary animate-pulse shadow-lg shadow-primary/20">
                                                <Rocket className="w-8 h-8" />
                                            </div>

                                            <div className="space-y-2">
                                                <h3 className="text-xl md:text-2xl font-heading font-light tracking-tight">
                                                    Spinning Up Ephemeral Environment
                                                </h3>
                                                <p className="text-xs font-mono text-primary/80">
                                                    {STAGING_STEPS[stagingStep]}
                                                </p>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="w-full bg-foreground/10 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-primary via-cyan-400 to-primary h-full transition-all duration-500"
                                                    style={{ width: `${stagingProgress}%` }}
                                                />
                                            </div>

                                            {/* Deployment Console Log */}
                                            <div className="text-left glass p-4 rounded-xl font-mono text-[11px] text-foreground/60 space-y-1.5 border border-foreground/5 max-h-36 overflow-hidden">
                                                {STAGING_STEPS.slice(0, stagingStep + 1).map((step, idx) => (
                                                    <div key={idx} className="flex items-center gap-2">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                                        <span className={idx === stagingStep ? "text-cyan-300 font-medium" : ""}>{step}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <Button
                                                variant="ghost"
                                                onClick={() => {
                                                    setIsStaging(false);
                                                    setIsSessionActive(true);
                                                    setIframeLoading(false);
                                                }}
                                                className="text-[10px] uppercase font-mono tracking-widest text-foreground/40 hover:text-foreground"
                                            >
                                                Skip Animation & Launch →
                                            </Button>
                                        </div>

                                        <div className="flex justify-between text-[10px] font-mono text-foreground/30 pt-4 border-t border-foreground/5">
                                            <span>ISOLATION: CONTAINER_VIRTUALIZED</span>
                                            <span>TTL: 5 MINUTES</span>
                                        </div>
                                    </div>
                                </BorderGlow>
                            ) : (
                                /* Live Temporary Sandbox Viewport Frame */
                                <BorderGlow
                                    borderRadius={28}
                                    backgroundColor="#0c0a14"
                                    glowColor="190 90 60"
                                    colors={['#38bdf8', '#c084fc', '#818cf8']}
                                    glowRadius={40}
                                    glowIntensity={1.0}
                                    coneSpread={25}
                                    edgeSensitivity={30}
                                    animated={true}
                                    fillOpacity={0.25}
                                    className="w-full shadow-2xl"
                                >
                                    <div className="overflow-hidden relative rounded-[inherit]">
                                        {/* Mock Browser & Container Header Bar */}
                                        <div className="glass border-b border-foreground/10 px-6 py-3.5 flex items-center justify-between gap-4 flex-wrap">
                                            {/* Window controls & Status */}
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                                    <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                                                </div>
                                                <div className="flex items-center gap-2 pl-2 border-l border-foreground/10">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-semibold">
                                                        Live Temporary Deployment
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Virtual URL address bar */}
                                            <div className="hidden md:flex items-center gap-2 glass px-4 py-1.5 rounded-full border border-foreground/5 text-xs font-mono text-foreground/60 flex-1 max-w-md mx-auto">
                                                <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                                                <span className="truncate text-emerald-300/80">
                                                    https://sandbox-{project.id.slice(0, 8)}.techshastra.live:3000
                                                </span>
                                            </div>

                                            {/* Right Controls: Timer & Restart */}
                                            <div className="flex items-center gap-3">
                                                <div className={`px-3 py-1 rounded-full text-xs font-mono font-medium flex items-center gap-1.5 ${
                                                    timeLeft < 60 ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary'
                                                }`}>
                                                    <Clock className="w-3 h-3" />
                                                    <span>{formatTimer(timeLeft)}</span>
                                                </div>

                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={handleRestartSandbox}
                                                    className="h-8 px-2.5 rounded-full hover:bg-white/5 text-foreground/60 hover:text-foreground"
                                                    title="Restart Sandbox"
                                                >
                                                    <RefreshCw className="w-3.5 h-3.5" />
                                                </Button>

                                                {assessment.targetUrl && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 px-2.5 rounded-full hover:bg-white/5 text-foreground/60 hover:text-foreground"
                                                        asChild
                                                        title="Open in new window"
                                                    >
                                                        <a href={assessment.targetUrl} target="_blank" rel="noreferrer">
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                        </a>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Viewport Area */}
                                        <div className="relative min-h-[620px] bg-black/60">
                                            {/* Loading spinner while iframe mounts */}
                                            {iframeLoading && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 z-10 bg-black/40 backdrop-blur-sm">
                                                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                    <p className="text-xs font-mono text-foreground/50 tracking-wider">Mounting temporary deployment viewport...</p>
                                                </div>
                                            )}

                                            {/* 1. Live Web Demo via CampusPortalSandbox or iframe */}
                                            {project.id === 'proj-2' ? (
                                                <CampusPortalSandbox />
                                            ) : assessment.type === 'live_web' && assessment.targetUrl ? (
                                                <iframe
                                                    key={iframeKey}
                                                    src={assessment.targetUrl}
                                                    className="w-full h-[620px] border-0"
                                                    title={project.title}
                                                    sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
                                                    allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
                                                    onLoad={() => setIframeLoading(false)}
                                                />
                                            ) : assessment.type === 'python_env' && assessment.gitInfo ? (
                                                /* 2. Python WebAssembly Sandbox */
                                                <div className="p-4">
                                                    <PythonRunner owner={assessment.gitInfo.owner} repo={assessment.gitInfo.repo} />
                                                </div>
                                            ) : assessment.type === 'github_sandbox' && assessment.gitInfo ? (
                                                /* 3. Fast CodeSandbox Web Container */
                                                <iframe
                                                    key={iframeKey}
                                                    src={`https://codesandbox.io/embed/github/${assessment.gitInfo.owner}/${assessment.gitInfo.repo}?fontsize=14&theme=dark&view=preview&hidenavigation=1&editorsize=0&hidedevtools=1`}
                                                    className="w-full h-[620px] border-0"
                                                    title={project.title}
                                                    sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
                                                    allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
                                                    onLoad={() => setIframeLoading(false)}
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-[620px] p-8 text-center space-y-4">
                                                    <AlertCircle className="w-12 h-12 text-foreground/30" />
                                                    <p className="text-sm font-light text-foreground/50">Runtime container not initialized.</p>
                                                </div>
                                            )}

                                            {/* Session Expired Overlay */}
                                            {isExpired && (
                                                <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center z-20 space-y-6">
                                                    <div className="w-16 h-16 rounded-full glass flex items-center justify-center text-amber-400 border border-amber-500/30">
                                                        <Clock className="w-8 h-8" />
                                                    </div>

                                                    <div className="space-y-2 max-w-md">
                                                        <h3 className="text-2xl font-heading font-light tracking-tight">
                                                            Temporary Sandbox Expired
                                                        </h3>
                                                        <p className="text-xs font-light text-foreground/70 leading-relaxed">
                                                            This ephemeral deployment has completed its 5-minute session to preserve runtime resources. You can extend the session or trigger a fresh deployment immediately.
                                                        </p>
                                                    </div>

                                                    <div className="flex flex-wrap gap-4 justify-center">
                                                        <Button
                                                            onClick={handleExtendSession}
                                                            className="bg-primary text-primary-foreground rounded-full px-8 py-5 text-xs font-mono uppercase tracking-widest shadow-xl"
                                                        >
                                                            <Sparkles className="w-4 h-4 mr-2" />
                                                            Extend Session (+5 Mins)
                                                        </Button>

                                                        <Button
                                                            variant="outline"
                                                            onClick={handleRestartSandbox}
                                                            className="glass border-0 rounded-full px-8 py-5 text-xs font-mono uppercase tracking-widest hover:bg-white/5"
                                                        >
                                                            <RefreshCw className="w-4 h-4 mr-2" />
                                                            Re-deploy Sandbox
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </BorderGlow>
                            )}
                        </div>
                    )}

                    {/* Project Specifications & Documentation Cards */}
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="glass p-8 rounded-3xl space-y-6">
                                <h3 className="font-heading text-sm tracking-[0.2em] uppercase text-primary flex items-center gap-2">
                                    <Code2 className="w-4 h-4" />
                                    Project Documentation
                                </h3>
                                <p className="text-lg font-light text-foreground/80 leading-relaxed italic">
                                    "{project.description}"
                                </p>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {project.tags.map((tag, idx) => (
                                        <span key={idx} className="px-3.5 py-1.5 bg-primary/10 rounded-full text-[10px] uppercase font-mono tracking-widest text-primary/80 border border-primary/20">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="glass p-8 rounded-3xl space-y-8 h-fit">
                            <h3 className="font-heading text-sm tracking-[0.2em] uppercase text-primary flex items-center gap-2">
                                <Rocket className="w-4 h-4" />
                                Project Leads
                            </h3>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center text-sm font-bold text-primary border border-primary/20">
                                        {project.team?.lead ? project.team.lead[0] : "L"}
                                    </div>
                                    <div>
                                        <p className="text-sm font-heading font-light text-foreground">{project.team?.lead || "Team Lead"}</p>
                                        <p className="text-[10px] uppercase font-mono tracking-widest text-foreground/40">Technical Lead</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center text-sm font-bold text-foreground/60 border border-foreground/10">
                                        {project.team?.designer ? project.team.designer[0] : "D"}
                                    </div>
                                    <div>
                                        <p className="text-sm font-heading font-light text-foreground">{project.team?.designer || "Architect"}</p>
                                        <p className="text-[10px] uppercase font-mono tracking-widest text-foreground/40">UI/UX & Systems Architect</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ProjectLive;
