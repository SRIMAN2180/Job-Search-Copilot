export type ColumnStatus =
  | "wishlist"
  | "applied"
  | "interviewing"
  | "offer"
  | "rejected";

export interface Kit {
  coverLetter: string;
  resumeBullets: string[];
  interviewQuestions: string[];
  companyBrief: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  url?: string;
  description: string;
  notes: string;
  status: ColumnStatus;
  createdAt: number;
  updatedAt: number;
  kit?: Kit;
}

export interface Settings {
  openRouterKey: string;
  resumeText: string;
  resumeFileName?: string;
  model: string;
}

export const COLUMNS: { status: ColumnStatus; label: string }[] = [
  { status: "wishlist", label: "Wishlist" },
  { status: "applied", label: "Applied" },
  { status: "interviewing", label: "Interviewing" },
  { status: "offer", label: "Offer" },
  { status: "rejected", label: "Rejected" },
];

export const DEFAULT_SETTINGS: Settings = {
  openRouterKey: "",
  resumeText: "",
  model: "openai/gpt-4o-mini",
};
