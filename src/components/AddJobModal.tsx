"use client";

import { useState } from "react";
import { Dialog } from "./ui/Dialog";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Button } from "./ui/Button";
import { generateId } from "@/lib/storage";
import type { Job, ColumnStatus } from "@/lib/types";

interface AddJobModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (job: Job) => void;
}

export function AddJobModal({ open, onClose, onAdd }: AddJobModalProps) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const reset = () => {
    setTitle("");
    setCompany("");
    setDescription("");
    setNotes("");
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleAdd = () => {
    if (!title.trim() || !company.trim()) {
      setError("Title and company are required.");
      return;
    }

    const job: Job = {
      id: generateId(),
      title: title.trim(),
      company: company.trim(),
      description: description.trim(),
      notes: notes.trim(),
      status: "wishlist" as ColumnStatus,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    onAdd(job);
    reset();
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Add Job">
      <div className="space-y-4">
        <Textarea
          label="Job Listing"
          placeholder="Paste the full job listing here..."
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Input
          label="Job Title"
          placeholder="e.g. Senior Software Engineer"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <Input
          label="Company"
          placeholder="e.g. Acme Inc."
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />

        <Textarea
          label="Notes"
          placeholder="Salary range, contacts, context..."
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!title.trim() || !company.trim()}>
            Add to Board
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
