"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getSettings, saveSettings } from "@/lib/storage";
import type { Settings } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const existing = getSettings();
  const hasKey = !!existing.openRouterKey;

  const [settings, setSettings] = useState<Settings>({
    ...DEFAULT_SETTINGS,
    ...existing,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSave = () => {
    setSaving(true);
    saveSettings(settings);
    setTimeout(() => {
      setSaving(false);
      router.push("/");
    }, 300);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      if (file.type === "text/plain") {
        const text = await file.text();
        setSettings((s) => ({ ...s, resumeText: text, resumeFileName: file.name }));
      } else {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/resume-parse", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) {
          setSettings((s) => ({ ...s, resumeFileName: `Error: ${data.error}` }));
        } else if (data.text) {
          setSettings((s) => ({ ...s, resumeText: data.text, resumeFileName: file.name }));
        }
      }
    } catch {
      setSettings((s) => ({ ...s, resumeFileName: "Upload failed" }));
    }
    setUploading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-2 h-2 rounded-full bg-accent mx-auto mb-3" />
          <h1 className="text-3xl font-heading text-text-primary">Pipeline Settings</h1>
        </div>

        <div className="bg-surface rounded-xl border border-border p-6 space-y-6 animate-slide-up">
          <Input
            label="Open Router API Key"
            placeholder="sk-or-v1-..."
            type="password"
            value={settings.openRouterKey}
            onChange={(e) =>
              setSettings((s) => ({ ...s, openRouterKey: e.target.value }))
            }
          />
          <p className="text-xs text-text-muted -mt-4">
            Get your key at{" "}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:text-accent-hover underline transition-colors"
            >
              openrouter.ai/keys
            </a>
          </p>

          <div>
            <label className="text-sm font-medium text-text-primary block mb-2">
              Resume (upload .pdf or .txt file)
            </label>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-accent/40 transition-colors duration-200">
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="resume-upload"
              />
              <label
                htmlFor="resume-upload"
                className="cursor-pointer text-accent hover:text-accent-hover font-medium text-sm transition-colors"
              >
                {uploading
                  ? "Uploading..."
                  : settings.resumeFileName || "Click to upload your resume"}
              </label>
              {settings.resumeText && (
                <p className="text-xs text-success mt-2">Resume loaded</p>
              )}
            </div>
          </div>

          <Button
            onClick={handleSave}
            loading={saving}
            disabled={!settings.openRouterKey || !settings.resumeText}
            className="w-full"
          >
            {hasKey ? "Save Changes" : "Get Started"}
          </Button>
        </div>
      </div>
    </main>
  );
}
