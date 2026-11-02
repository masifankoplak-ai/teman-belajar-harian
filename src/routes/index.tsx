import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";

import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Teman Belajarku — Teman Setia Belajarmu" },
      { name: "description", content: "Kelola jadwal pelajaran, pekerjaan rumah, ulangan, catatan belajar, dan kebiasaan belajar. 100% offline, tanpa internet." },
      { property: "og:title", content: "Teman Belajarku — Teman Setia Belajarmu" },
      { property: "og:description", content: "Kelola jadwal pelajaran, PR, ulangan, dan kebiasaan belajar dalam satu aplikasi offline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Aplikasi,
});

/**
 * Seluruh aplikasi berjalan sebagai satu aplikasi klien dengan router hash
 * internal (lihat src/lib/router.ts) — data hanya di LocalStorage, tanpa backend.
 * Saat SSR (layar pertama) tampilkan layar sambutan, lalu aplikasi muncul.
 */
function Aplikasi() {
  const [siap, setSiap] = useState(false);
  useEffect(() => setSiap(true), []);

  if (!siap) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
          <GraduationCap className="h-11 w-11" />
        </div>
        <p className="font-display text-2xl font-bold text-primary">Teman Belajarku</p>
        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
        </div>
      </div>
    );
  }

  return <AppShell />;
}
