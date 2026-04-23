export interface Resume {
  id: string;
  userId: string;
  fileUrl: string;
  fileName: string;
  score?: number;
  isActive: boolean;
  createdAt: string;
}

export interface AnalysisResult {
  id: string;
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  skills: string[];
  careerPath: string;
  experienceLevel: "entry" | "mid" | "senior" | "lead";
  atsScore: number;
  recommendations: string[];
  brandingKit?: {
    linkedinHeadline: string;
    linkedinAbout: string;
    coldDM: string;
  };
  isPublic?: boolean;
  resume?: Resume;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "REMOTE" | "INTERNSHIP";
  skillsRequired: string[];
  description: string;
  salaryMin?: number;
  salaryMax?: number;
  matchScore?: number;
  isActive: boolean;
  createdAt: string;
}

export interface Application {
  id: string;
  userId: string;
  jobId: string;
  status: "APPLIED" | "INTERVIEW" | "OFFER" | "REJECTED" | "WITHDRAWN";
  appliedAt: string;
  notes?: string;
}

export interface RoadmapWeek {
  id: string;
  week: string; // "Week 1", etc.
  title: string;
  description: string;
  resources: string[];
  progress: number;
}

export interface Roadmap {
  title: string;
  description: string;
  steps: RoadmapWeek[];
}
