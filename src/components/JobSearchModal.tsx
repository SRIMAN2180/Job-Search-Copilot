"use client";

import { useState } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { getSettings } from "@/lib/storage";
import { generateId } from "@/lib/storage";
import type { Job, ColumnStatus } from "@/lib/types";

const PREFS_KEY = "pipeline-search-prefs";

interface SearchPrefs {
  targetTitles: string;
  locations: string;
  workMode: string;
  minSalary: string;
  mustHaveKeywords: string;
  excludeKeywords: string;
}

const defaultPrefs: SearchPrefs = {
  targetTitles: "",
  locations: "",
  workMode: "any",
  minSalary: "",
  mustHaveKeywords: "",
  excludeKeywords: "",
};

function loadPrefs(): SearchPrefs {
  if (typeof window === "undefined") return defaultPrefs;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...defaultPrefs, ...JSON.parse(raw) } : defaultPrefs;
  } catch {
    return defaultPrefs;
  }
}

function savePrefs(prefs: SearchPrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  score: number;
  reason: string;
  company?: string;
}

interface JobSearchModalProps {
  open: boolean;
  onClose: () => void;
  onAdd?: (job: Job) => void;
}

export function JobSearchModal({ open, onClose, onAdd }: JobSearchModalProps) {
  const [prefs, setPrefs] = useState<SearchPrefs>(loadPrefs);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState("");
  const [added, setAdded] = useState<Set<number>>(new Set());
  const [saved, setSaved] = useState(false);

  const updatePref = (key: keyof SearchPrefs, val: string) =>
    setPrefs((p) => ({ ...p, [key]: val }));

  const handleSavePrefs = () => {
    savePrefs(prefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleSearch = async () => {
    setSearching(true);
    setError("");

    const settings = getSettings();
    if (!settings.openRouterKey || !settings.resumeText) {
      setError("Set up your API key and resume in Settings first.");
      setSearching(false);
      return;
    }

    try {
      const res = await fetch("/api/job-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: settings.resumeText,
          apiKey: settings.openRouterKey,
          model: settings.model,
          ...prefs,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setResults(data.jobs || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Search failed";
      setError(msg);
    }
    setSearching(false);
  };

  const handleAdd = async (idx: number, job: SearchResult) => {
    let company = job.company || "";
    if (!company) {
      company = prompt(`Enter company name for "${job.title}":`) || "";
      if (!company) return;
    }
    const siteSuffix = /\s*[-–—|,]\s*(?:LinkedIn|Indeed|Glassdoor|Jobs?)\s*$/i;
    const clean = job.title.replace(siteSuffix, "").trim();
    const m = clean.match(/^(.*?)\s+(?:at|[-–—|])\s+/);
    const shortTitle = m ? m[1].trim() : clean;
    let url: string | undefined;
    if (job.url) {
      try { const u = new URL(job.url); if (u.protocol === "http:" || u.protocol === "https:") url = job.url; } catch {}
    }
    const newJob: Job = {
      id: generateId(),
      title: shortTitle || job.title,
      company,
      url,
      description: job.snippet,
      notes: `Matched via auto-search (score: ${job.score}/10). ${job.reason}`.trim(),
      status: "wishlist" as ColumnStatus,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    onAdd?.(newJob);
    setAdded(new Set(added).add(idx));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-12 pb-20 animate-fade-in">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-3xl mx-4 animate-slide-up">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-text-muted tracking-[0.15em] uppercase mb-2">
            Automatic Search
          </p>
          <h1 className="text-3xl font-heading text-white tracking-tight">
            Find jobs
          </h1>
          <p className="text-sm text-text-secondary mt-2 leading-relaxed max-w-xl">
            Jobs are searched from the live web and matched against your saved
            resume and preferences using AI.
          </p>
        </div>

        {/* Form */}
        <div className="bg-surface rounded-2xl border border-border p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Target Titles"
              placeholder="e.g. Senior Frontend Engineer"
              value={prefs.targetTitles}
              onChange={(e) => updatePref("targetTitles", e.target.value)}
            />
            <Input
              label="Locations"
              placeholder="e.g. San Francisco, Remote"
              value={prefs.locations}
              onChange={(e) => updatePref("locations", e.target.value)}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary">
                Work Mode
              </label>
              <select
                value={prefs.workMode}
                onChange={(e) => updatePref("workMode", e.target.value)}
                className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors appearance-none cursor-pointer"
              >
                <option value="any">Any</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>
            </div>

            <Input
              label="Minimum Salary"
              placeholder="e.g. $120,000"
              value={prefs.minSalary}
              onChange={(e) => updatePref("minSalary", e.target.value)}
            />

            <Input
              label="Must-Have Keywords"
              placeholder="e.g. React, TypeScript, GraphQL"
              value={prefs.mustHaveKeywords}
              onChange={(e) => updatePref("mustHaveKeywords", e.target.value)}
            />
            <Input
              label="Exclude Keywords / Companies"
              placeholder="e.g. Java, Twitter, Meta"
              value={prefs.excludeKeywords}
              onChange={(e) => updatePref("excludeKeywords", e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            {saved ? (
              <span className="text-xs text-accent">Preferences saved</span>
            ) : (
              <Button variant="ghost" size="sm" onClick={handleSavePrefs}>
                Save preferences
              </Button>
            )}
            <Button
              onClick={handleSearch}
              loading={searching}
              className="bg-accent hover:bg-accent-hover text-white shadow-lg shadow-accent/20 active:scale-[0.97]"
            >
              {searching ? "Searching..." : "Find jobs"}
            </Button>
          </div>
        </div>

        {/* Results */}
        {error && (
          <div className="mt-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-8 space-y-3">
            <p className="text-xs text-text-muted">
              {results.length} results — ranked by relevance to your profile
            </p>
            {results.map((job, i) => (
              <div
                key={i}
                className={`bg-surface rounded-xl border border-border p-4 transition-colors hover:border-accent/30 ${added.has(i) ? "opacity-50" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-heading text-white truncate">
                        {job.title}
                      </h4>
                      <span
                        className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
                          job.score >= 8
                            ? "bg-accent/20 text-accent"
                            : job.score >= 5
                              ? "bg-surface-tertiary text-text-secondary"
                              : "bg-surface-tertiary text-text-muted"
                        }`}
                      >
                        {job.score}/10
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                      {job.snippet}
                    </p>
                    {job.reason && (
                      <p className="text-[11px] text-text-muted mt-1 italic">
                        {job.reason}
                      </p>
                    )}
                    {job.url && (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-accent hover:underline mt-1 block truncate"
                      >
                        {job.url.replace(/^https?:\/\//, "").slice(0, 60)}
                      </a>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={added.has(i) ? "ghost" : "primary"}
                    onClick={() => handleAdd(i, job)}
                    disabled={added.has(i)}
                    className={added.has(i) ? "" : "bg-accent hover:bg-accent-hover text-white"}
                  >
                    {added.has(i) ? "Added" : "Add"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!searching && results.length === 0 && !error && (
          <p className="text-sm text-text-muted text-center mt-10">
            Fill in your preferences and click <span className="text-accent font-medium">Find jobs</span> to start searching.
          </p>
        )}
      </div>
    </div>
  );
}
