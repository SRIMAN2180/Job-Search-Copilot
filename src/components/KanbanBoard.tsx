"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { COLUMNS, type ColumnStatus, type Job } from "@/lib/types";
import { getJobs, saveJobs } from "@/lib/storage";
import { Column } from "./Column";
import { AddJobModal } from "./AddJobModal";
import { JobDetailModal } from "./JobDetailModal";
import { JobSearchModal } from "./JobSearchModal";
import { Button } from "./ui/Button";

export function KanbanBoard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setJobs(getJobs());
    setMounted(true);
    const onStorage = () => setJobs(getJobs());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const jobId = active.id as string;
    const newStatus = over.id as ColumnStatus;

    if (!COLUMNS.find((c) => c.status === newStatus)) return;

    setJobs((prev) => {
      const updated = prev.map((j) =>
        j.id === jobId ? { ...j, status: newStatus, updatedAt: Date.now() } : j
      );
      saveJobs(updated);
      return updated;
    });
  };

  const handleAddJob = (job: Job) => {
    setJobs((prev) => {
      const updated = [job, ...prev];
      saveJobs(updated);
      return updated;
    });
    setAddOpen(false);
  };

  const handleUpdateJob = (updated: Job) => {
    setJobs((prev) => {
      const mapped = prev.map((j) => (j.id === updated.id ? updated : j));
      saveJobs(mapped);
      return mapped;
    });
    setSelectedJob(updated);
  };

  const handleDeleteJob = (id: string) => {
    setJobs((prev) => {
      const filtered = prev.filter((j) => j.id !== id);
      saveJobs(filtered);
      return filtered;
    });
    setSelectedJob(null);
  };

  const columns = COLUMNS.map((col) => ({
    ...col,
    jobs: jobs.filter((j) => j.status === col.status),
  }));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  if (!mounted) return null;

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 bg-surface/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <h1 className="text-lg font-heading text-text-primary tracking-tight">Pipeline</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/settings")}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSearchOpen(true)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </Button>
          <Button onClick={() => setAddOpen(true)}>+ Add Job</Button>
        </div>
      </header>

      <div className="flex-1 overflow-x-auto p-6">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 h-full min-w-max">
            {columns.map((col) => (
              <Column
                key={col.status}
                status={col.status}
                label={col.label}
                jobs={col.jobs}
                onJobClick={setSelectedJob}
              />
            ))}
          </div>
        </DndContext>
      </div>

      <AddJobModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAddJob}
      />

      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onUpdate={handleUpdateJob}
          onDelete={handleDeleteJob}
        />
      )}

      <JobSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onAdd={(job) => {
          setJobs((prev) => {
            const updated = [job, ...prev];
            saveJobs(updated);
            return updated;
          });
        }}
      />
    </div>
  );
}
