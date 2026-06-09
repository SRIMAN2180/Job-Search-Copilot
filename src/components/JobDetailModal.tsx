"use client";

import { useState, useEffect } from "react";
import { Dialog } from "./ui/Dialog";
import { Textarea } from "./ui/Textarea";
import { Button } from "./ui/Button";
import { getSettings } from "@/lib/storage";
import type { Job, Kit } from "@/lib/types";

interface JobDetailModalProps {
  job: Job;
  onClose: () => void;
  onUpdate: (job: Job) => void;
  onDelete: (id: string) => void;
}

export function JobDetailModal({ job, onClose, onUpdate, onDelete }: JobDetailModalProps) {
  const [editingNotes, setEditingNotes] = useState(job.notes);
  const [kit, setKit] = useState<Kit | undefined>(job.kit);
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingKit, setSavingKit] = useState(false);

  const [editingCover, setEditingCover] = useState(kit?.coverLetter || "");
  const [editingBullets, setEditingBullets] = useState(kit?.resumeBullets || []);
  const [editingQuestions, setEditingQuestions] = useState(kit?.interviewQuestions || []);
  const [editingBrief, setEditingBrief] = useState(kit?.companyBrief || "");

  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [regenError, setRegenError] = useState("");

  useEffect(() => {
    setEditingNotes(job.notes);
    setKit(job.kit);
    setEditingCover(job.kit?.coverLetter || "");
    setEditingBullets(job.kit?.resumeBullets || []);
    setEditingQuestions(job.kit?.interviewQuestions || []);
    setEditingBrief(job.kit?.companyBrief || "");
    setShowDeleteConfirm(false);
    setRegenError("");
  }, [job.id]);

  const updateKit = (newKit: Kit) => {
    setKit(newKit);
    setEditingCover(newKit.coverLetter);
    setEditingBullets(newKit.resumeBullets);
    setEditingQuestions(newKit.interviewQuestions);
    setEditingBrief(newKit.companyBrief);
    onUpdate({ ...job, kit: newKit, updatedAt: Date.now() });
  };

  const handleSaveNotes = () => {
    setSavingNotes(true);
    onUpdate({ ...job, notes: editingNotes, updatedAt: Date.now() });
    setSavingNotes(false);
  };

  const handleSaveKit = () => {
    setSavingKit(true);
    const updatedKit: Kit = {
      coverLetter: editingCover,
      resumeBullets: editingBullets,
      interviewQuestions: editingQuestions,
      companyBrief: editingBrief,
    };
    setKit(updatedKit);
    onUpdate({ ...job, kit: updatedKit, updatedAt: Date.now() });
    setSavingKit(false);
  };

  const handleRegenFull = async () => {
    setRegenerating("full");
    setRegenError("");
    const settings = getSettings();
    if (!settings.openRouterKey) {
      setRegenError("Set up your API key in Settings first.");
      setRegenerating(null);
      return;
    }
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription: job.description,
          resumeText: settings.resumeText,
          apiKey: settings.openRouterKey,
          model: settings.model,
        }),
      });
      if (res.ok) {
        const newKit: Kit = await res.json();
        updateKit(newKit);
      } else {
        setRegenError("Generation failed. Check your API key and try again.");
      }
    } catch {
      setRegenError("Generation failed. Check your connection and try again.");
    }
    setRegenerating(null);
  };

  const handleRegenSection = async (section: string, currentKit: Kit) => {
    setRegenerating(section);
    setRegenError("");
    const settings = getSettings();
    if (!settings.openRouterKey) {
      setRegenError("Set up your API key in Settings first.");
      setRegenerating(null);
      return;
    }
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription: job.description,
          resumeText: settings.resumeText,
          apiKey: settings.openRouterKey,
          model: settings.model,
          section,
        }),
      });
      if (res.ok) {
        const partial: Kit = await res.json();
        const merged: Kit = {
          coverLetter: section === "coverLetter" ? partial.coverLetter || currentKit.coverLetter : currentKit.coverLetter,
          resumeBullets: section === "resumeBullets" ? (partial.resumeBullets.length ? partial.resumeBullets : currentKit.resumeBullets) : currentKit.resumeBullets,
          interviewQuestions: section === "interviewQuestions" ? (partial.interviewQuestions.length ? partial.interviewQuestions : currentKit.interviewQuestions) : currentKit.interviewQuestions,
          companyBrief: section === "companyBrief" ? partial.companyBrief || currentKit.companyBrief : currentKit.companyBrief,
        };
        updateKit(merged);
      } else {
        setRegenError("Generation failed. Check your API key and try again.");
      }
    } catch {
      setRegenError("Generation failed. Check your connection and try again.");
    }
    setRegenerating(null);
  };

  const handleBulletChange = (idx: number, val: string) => {
    const next = [...editingBullets];
    next[idx] = val;
    setEditingBullets(next);
  };

  const handleQuestionChange = (idx: number, val: string) => {
    const next = [...editingQuestions];
    next[idx] = val;
    setEditingQuestions(next);
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const daysAgo = Math.floor(
    (Date.now() - job.createdAt) / (1000 * 60 * 60 * 24)
  );

  const currentKit = kit || {
    coverLetter: editingCover,
    resumeBullets: editingBullets,
    interviewQuestions: editingQuestions,
    companyBrief: editingBrief,
  };

  return (
    <Dialog open onClose={onClose} title={`${job.title} — ${job.company}`} wide>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs text-text-muted uppercase tracking-widest">Added</span>
            <p className="text-text-primary mt-0.5">
              {daysAgo === 0 ? "Today" : `${daysAgo} days ago`}
            </p>
          </div>
          {(() => {
            let safeUrl: string | undefined;
            if (job.url) {
              try { const u = new URL(job.url); if (u.protocol === "http:" || u.protocol === "https:") safeUrl = job.url; } catch {}
            }
            if (!safeUrl) return null;
            return (
              <div>
                <span className="text-xs text-text-muted uppercase tracking-widest">URL</span>
                <a
                  href={safeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:text-accent-hover block truncate mt-0.5 transition-colors"
                >
                  {safeUrl.replace(/^https?:\/\//, "")}
                </a>
              </div>
            );
          })()}
        </div>

        <div className="flex justify-end -mt-2">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-danger">Delete this job?</span>
              <button
                onClick={() => {
                  onDelete(job.id);
                  onClose();
                }}
                className="text-danger font-semibold hover:underline"
              >
                Yes
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-text-muted hover:underline"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-text-muted hover:text-danger transition-colors"
            >
              Delete
            </button>
          )}
        </div>

        {job.description && (
          <div className="bg-surface-secondary rounded-lg p-4 border border-border">
            <h4 className="text-xs text-text-muted uppercase tracking-widest mb-2">Description</h4>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
              {job.description}
            </p>
          </div>
        )}

        <div>
          <h4 className="text-xs text-text-muted uppercase tracking-widest mb-2">Notes</h4>
          <Textarea
            rows={3}
            value={editingNotes}
            onChange={(e) => setEditingNotes(e.target.value)}
            placeholder="Add notes..."
          />
          <div className="flex justify-end mt-2">
            <Button size="sm" variant="secondary" onClick={handleSaveNotes} loading={savingNotes}>
              Save Notes
            </Button>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="text-base font-heading text-text-primary mb-4">Application Kit</h3>

          {!kit && (
            <div className="space-y-3">
              <p className="text-xs text-text-muted text-center">
                Kit generation can take 30&ndash;60 seconds depending on the model
              </p>
              <Button
                onClick={() => handleRegenFull()}
                loading={regenerating === "full"}
                className="w-full animate-glow-pulse"
              >
                Generate Application Kit
              </Button>
            </div>
          )}

          {kit && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs text-text-muted uppercase tracking-widest">Cover Letter</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRegenSection("coverLetter", currentKit)}
                    loading={regenerating === "coverLetter"}
                  >
                    Regen
                  </Button>
                </div>
                <Textarea
                  rows={14}
                  value={editingCover}
                  onChange={(e) => setEditingCover(e.target.value)}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs text-text-muted uppercase tracking-widest">Resume Bullets</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRegenSection("resumeBullets", currentKit)}
                    loading={regenerating === "resumeBullets"}
                  >
                    Regen
                  </Button>
                </div>
                <div className="space-y-2">
                  {editingBullets.map((b, i) => (
                    <Textarea
                      key={i}
                      rows={2}
                      value={b}
                      onChange={(e) => handleBulletChange(i, e.target.value)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs text-text-muted uppercase tracking-widest">Interview Questions</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRegenSection("interviewQuestions", currentKit)}
                    loading={regenerating === "interviewQuestions"}
                  >
                    Regen
                  </Button>
                </div>
                <div className="space-y-2">
                  {editingQuestions.length === 0 && (
                    <p className="text-sm text-text-muted italic">No questions generated.</p>
                  )}
                  {editingQuestions.map((q, i) => (
                    <Textarea
                      key={i}
                      rows={2}
                      value={q}
                      onChange={(e) => handleQuestionChange(i, e.target.value)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs text-text-muted uppercase tracking-widest">Company Brief</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRegenSection("companyBrief", currentKit)}
                    loading={regenerating === "companyBrief"}
                  >
                    Regen
                  </Button>
                </div>
                <Textarea
                  rows={10}
                  value={editingBrief}
                  onChange={(e) => setEditingBrief(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4">
                {savingKit ? (
                  <span className="text-xs text-success">Saved!</span>
                ) : (
                  <span />
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={handleRegenFull} loading={regenerating === "full"}>
                    Regenerate Kit
                  </Button>
                  <Button size="sm" onClick={handleSaveKit}>
                    Save Kit Edits
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
