"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Job } from "@/lib/types";

interface JobCardProps {
  job: Job;
  onClick: () => void;
}

export function JobCard({ job, onClick }: JobCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: job.id });

  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        zIndex: isDragging ? 50 : undefined,
      }
    : undefined;

  const daysAgo = Math.floor(
    (Date.now() - job.createdAt) / (1000 * 60 * 60 * 24)
  );
  const timeLabel = daysAgo === 0 ? "Today" : `${daysAgo}d ago`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`group bg-surface rounded-lg border border-border transition-all duration-200 ${
        isDragging
          ? "opacity-30 shadow-xl scale-105"
          : "hover:border-accent/40 hover:shadow-[0_0_12px_rgba(217,119,6,0.08)]"
      }`}
    >
      <div onClick={onClick} className="p-3.5 cursor-pointer">
        <h4 className="text-sm font-heading text-text-primary truncate">
          {job.title}
        </h4>
        <p className="text-xs text-text-secondary mt-0.5 truncate">
          {job.company}
        </p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-[11px] text-text-muted">{timeLabel}</span>
          {job.kit && (
            <span className="text-[11px] text-accent">Kit ready</span>
          )}
        </div>
      </div>
    </div>
  );
}
