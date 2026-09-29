import { api } from "./api";

/** 
 * Represents the team members associated with a project.
 */
export interface Team {
    lead: string;    // Name of the project lead
    designer: string; // Name of the UI/UX designer
}

/**
 * Represents a project entry in the TECHSHASTRA showcase.
 */
export interface Project {
    id: string;          // Unique identifier for the project
    title: string;       // Public title of the project
    description: string; // Brief summary of the project goals
    image?: string;      // Optional URL for the project thumbnail
    image_url?: string;
    tags: string[];      // Array of technologies or domains (e.g., IoT, AI)
    tech_stack?: string[];
    team: Team;          // Lead and designer info
    github: string;      // Link to the source code repository
    github_url?: string;
    demo?: string;       // Optional link to a live demonstration
    live_url?: string;
    status: "Completed" | "In Progress"; // Current development stage
    language: "javascript" | "python" | "other"; // Primary execution environment
    createdAt: number;   // Timestamp of project creation
}

const STORAGE_KEY = "techshastra_projects";

// Fallback for crypto.randomUUID() in non-secure contexts or older browsers
const generateId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * DEMO DATA: Hardcoded projects used for initial demonstration.
 * Feel free to remove or replace these in your final application.
 */
export const hardcodedProjects: Project[] = [
    {
        id: "proj-1",
        title: "AURA Autonomous Rover",
        description: "AI-guided terrain mapping rover for harsh Himalayan environments with custom 6-wheel rocker-bogie chassis, stereoscopic depth perception, and LiDAR sensor suite.",
        image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
        image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
        tags: ["Robotics & IoT", "ROS", "Hardware", "C++", "Computer Vision"],
        tech_stack: ["Robotics & IoT", "ROS", "Hardware", "C++", "Computer Vision"],
        team: { lead: "Ayush Verma", designer: "Robotics Lead" },
        github: "https://github.com/techshastra-club/aura-rover",
        github_url: "https://github.com/techshastra-club/aura-rover",
        demo: "",
        live_url: "",
        status: "In Progress",
        language: "other",
        createdAt: 1700000000000
    },
    {
        id: "proj-2",
        title: "UTU Campus Portal",
        description: "Unified student ecosystem platform connecting colleges across Uttarakhand with real-time academic records, notice broadcasting, and course material exchange.",
        image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80",
        image_url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80",
        tags: ["Web Development", "React", "TypeScript", "Tailwind", "Go"],
        tech_stack: ["Web Development", "React", "TypeScript", "Tailwind", "Go"],
        team: { lead: "Tanmay Raje", designer: "Technical Secretary" },
        github: "https://github.com/facebook/react",
        github_url: "https://github.com/facebook/react",
        demo: "https://react.dev",
        live_url: "https://react.dev",
        status: "Completed",
        language: "javascript",
        createdAt: 1700000001000
    },
    {
        id: "proj-3",
        title: "Sentinel Shield",
        description: "Autonomous intrusion detection and zero-trust protocol tester engineered with eBPF probes and WireGuard mesh encapsulation.",
        image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80",
        image_url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80",
        tags: ["Cybersecurity", "Go", "Rust", "Docker", "WireGuard"],
        tech_stack: ["Cybersecurity", "Go", "Rust", "Docker", "WireGuard"],
        team: { lead: "Priya Joshi", designer: "Security Lead" },
        github: "https://github.com/techshastra-club/sentinel-shield",
        github_url: "https://github.com/techshastra-club/sentinel-shield",
        demo: "",
        live_url: "",
        status: "In Progress",
        language: "other",
        createdAt: 1700000002000
    },
    {
        id: "proj-4",
        title: "Drishti Vision ML",
        description: "Real-time edge neural detection for agricultural crop disease diagnostics trained on Himalayan flora datasets.",
        image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
        image_url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
        tags: ["AI & ML", "Python", "PyTorch", "Computer Vision"],
        tech_stack: ["AI & ML", "Python", "PyTorch", "Computer Vision"],
        team: { lead: "Rahul Rawat", designer: "AI Researcher" },
        github: "https://github.com/techshastra-club/drishti-vision",
        github_url: "https://github.com/techshastra-club/drishti-vision",
        demo: "",
        live_url: "",
        status: "Completed",
        language: "python",
        createdAt: 1700000003000
    },
    {
        id: "proj-b97848719a591b87",
        title: "Quantum Simulator",
        description: "Quantum computing circuit visualizer and simulation engine.",
        image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80",
        image_url: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80",
        tags: ["Python", "Qiskit", "WebAssembly"],
        tech_stack: ["Python", "Qiskit", "WebAssembly"],
        team: { lead: "Aryan Sharma", designer: "Quantum Research Fellow" },
        github: "",
        github_url: "",
        demo: "",
        live_url: "",
        status: "In Progress",
        language: "python",
        createdAt: 1700000004000
    }
];

export const getStoredProjects = (): Project[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

/**
 * Retrieves all projects, merging locally stored ones with default seeded projects.
 * @returns Array of projects without duplicates
 */
export const getAllProjects = (): Project[] => {
    const stored = getStoredProjects();
    const storedIds = new Set(stored.map(p => p.id));
    const uniqueHardcoded = hardcodedProjects.filter(p => !storedIds.has(p.id));
    return [...stored, ...uniqueHardcoded];
};

export const getProject = (id: string): Project | null => {
    const projects = getAllProjects();
    return projects.find(p => p.id === id) || null;
};

export const addProject = (project: Omit<Project, "id" | "createdAt">): Project => {
    const projects = getStoredProjects();
    const newProject: Project = {
        ...project,
        id: generateId(),
        createdAt: Date.now(),
    };

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([newProject, ...projects]));
    } catch (e) {
        console.error("Storage failed", e);
        throw e; // Rethrow to be handled by the UI
    }

    return newProject;
};

export const deleteProject = (id: string) => {
    const projects = getStoredProjects();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects.filter(p => p.id !== id)));
};

export const parseGitHubUrl = (url: string | undefined | null) => {
    try {
        if (!url || typeof url !== 'string') return null;
        let cleanUrl = url.trim();
        if (!cleanUrl || cleanUrl === '#' || !cleanUrl.includes('github.com')) return null;
        
        // Remove query strings, hashes, and trailing slashes
        cleanUrl = cleanUrl.split('?')[0].split('#')[0].replace(/\/+$/, "");
        
        // Match github.com/owner/repo (with or without .git, or subpaths like /tree/main)
        const match = cleanUrl.match(/github\.com[/:]([\w.-]+)\/([\w.-]+)/i);
        if (match) {
            const owner = match[1];
            const repo = match[2].replace(/\.git$/i, "").replace(/\/+$/, "");
            if (owner && repo && owner.toLowerCase() !== 'github.com' && !owner.includes(':')) {
                return { owner, repo };
            }
        }
    } catch (e) {
        console.error("Invalid GitHub URL", e);
    }
    return null;
};

/**
 * Fetches projects from the Go backend API, caching results in localStorage.
 * Falls back to local store if backend is unreachable.
 */
export const fetchProjectsFromBackend = async (): Promise<Project[]> => {
    try {
        const remote = await api.getProjects();
        if (remote && Array.isArray(remote) && remote.length > 0) {
            const mapped: Project[] = remote.map((r: any) => {
                const tagsList = Array.isArray(r.tags)
                    ? r.tags
                    : (typeof r.tags === 'string' ? r.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []);
                const statusVal = (r.status === 'Completed' || r.status === 'In Progress')
                    ? r.status
                    : (r.status === 'active' || r.status === 'ongoing' ? 'In Progress' : 'Completed');

                return {
                    id: r.id,
                    title: r.title,
                    description: r.description,
                    image: r.image || r.image_url || '',
                    image_url: r.image_url || r.image || '',
                    tags: tagsList,
                    tech_stack: tagsList,
                    team: r.team || { lead: r.lead_name || 'Team Lead', designer: r.lead_role || 'Core Team' },
                    github: r.github || r.github_url || '',
                    github_url: r.github_url || r.github || '',
                    demo: r.demo || r.live_url || '',
                    live_url: r.live_url || r.demo || '',
                    status: statusVal,
                    language: r.language || 'other',
                    createdAt: r.createdAt || (r.created_at ? new Date(r.created_at).getTime() : Date.now()),
                };
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
            return mapped;
        }
    } catch (err) {
        console.warn("Go backend unreachable, using local projects:", err);
    }
    return getAllProjects();
};

/**
 * Creates project on Go backend API and updates local store.
 */
export const createProjectRemote = async (project: Omit<Project, "id" | "createdAt">): Promise<Project> => {
    try {
        const created = await api.createProject(project);
        const current = getStoredProjects();
        localStorage.setItem(STORAGE_KEY, JSON.stringify([created, ...current.filter(p => p.id !== created.id)]));
        return created;
    } catch (err) {
        console.warn("Go backend unreachable, creating project locally:", err);
        return addProject(project);
    }
};
