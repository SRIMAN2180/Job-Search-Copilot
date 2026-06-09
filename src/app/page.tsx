"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSettings } from "@/lib/storage";
import { KanbanBoard } from "@/components/KanbanBoard";

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const settings = getSettings();
    if (!settings.openRouterKey || !settings.resumeText) {
      router.replace("/settings");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return <div className="h-screen bg-[#0a0a0b]" />;

  return <KanbanBoard />;
}
