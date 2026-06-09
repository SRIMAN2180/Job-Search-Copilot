"use client";

import { useDroppable } from "@dnd-kit/core";
import type { ColumnStatus, Job } from "@/lib/types";
import { JobCard } from "./JobCard";

interface ColumnProps {
  status: ColumnStatus;
  label: string;
  jobs: Job[];
  onJobClick: (job: Job) => void;
}

export function Column({ status, label, jobs, onJobClick }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-72 flex flex-col rounded-xl border transition-all duration-200 ${
        isOver
          ? "border-accent/60 bg-accent-light/50 shadow-[0_0_20px_rgba(217,119,6,0.06)]"
          : "border-border bg-surface-secondary/50"
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
        <h3 className="text-sm font-heading text-text-primary">{label}</h3>
        <span className="text-xs font-medium text-text-muted bg-surface px-2 py-0.5 rounded-full">
          {jobs.length}
        </span>
      </div>
      <div className="flex-1 p-3 space-y-2.5 min-h-[180px] overflow-y-auto">
        {jobs.length === 0 && (
          <p className="text-xs text-text-muted/60 text-center mt-8 italic">
            No jobs yet
          </p>
        )}
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} onClick={() => onJobClick(job)} />
        ))}
      </div>
    </div>
  );
}
