import { useEffect, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Home,
  Moon,
  MoreHorizontal,
  NotebookPen,
  Settings,
  Sun,
  TrendingUp,
  CalendarCog,
  ListChecks,
} from "lucide-react";
import { Toaster } from "sonner";

import { Button } from "@/components/ui/kit";
import { getTema, initTema, setTema, useAppData } from "@/lib/store";
import { navigate, pecahJalur, useRoute } from "@/lib/router";
import { formatTanggal, todayISO } from "@/lib/dates";
import { Onboarding } from "@/pages/Onboarding";
import { Dashboard } from "@/pages/Dashboard";
import { HalamanJadwal } from "@/pages/Jadwal";
import { HalamanTugas } from "@/pages/Tugas";
import { HalamanBelajar } from "@/pages/Belajar";
import { HalamanProgres } from "@/pages/Progres";
import { HalamanUjian } from "@/pages/Ujian";
import { HalamanKalender } from "@/pages/Kalender";
import { HalamanCatatan } from "@/pages/Catatan";
import { HalamanProyek } from "@/pages/Proyek";
import { HalamanPengaturan } from "@/pages/Pengaturan";

const MENU_BAWAH = [
  { path: "/beranda", label: "Beranda", icon: Home },
  { path: "/jadwal", label: "Jadwal", icon: CalendarDays },
  { path: "/tugas", label: "Tugas", icon: ClipboardList },
  { path: "/belajar", label: "Belajar", icon: BookOpen },
  { path: "/progres", label: "Progres", icon: TrendingUp },
];

const MENU_LAIN = [
  { path: "/kalender", label: "Kalender Akademik", icon: CalendarCog },
  { path: "/ujian", label: "Ulangan & Ujian", icon: NotebookPen },
  { path: "/catatan", label: "Catatan Belajar", icon: NotebookPen },
  { path: "/proyek", label: "Tugas & Proyek", icon: ListChecks },
  { path: "/pengaturan", label: "Profil & Pengaturan", icon: Settings },
];

const JUDUL: Record<string, string> = {
  "/beranda": "Beranda",
  "/jadwal": "Jadwal Pelajaran",
  "/tugas": "Pekerjaan Rumah",
  "/belajar": "Target & Kebiasaan",
  "/progres": "Progres Belajar",
  "/ujian": "Ulangan & Ujian",
  "/kalender": "Kalender Akademik",
  "/catatan": "Catatan Belajar",
  "/proyek": "Tugas & Proyek",
  "/pengaturan": "Profil & Pengaturan",
};

function halamanDari(path: string, data: ReturnType<typeof useAppData>) {
  if (path.startsWith("/mapel/")) {
    const id = path.slice("/mapel/".length);
    const mapel = data.jadwal.find((j) => j.id === id);
    return { judul: mapel?.mapel ?? "Detail Mapel", elemen: <HalamanJadwal mapelId={id} /> };
  }
  switch (path) {
    case "/jadwal":
      return { judul: JUDUL[path], elemen: <HalamanJadwal /> };
    case "/tugas":
      return { judul: JUDUL[path], elemen: <HalamanTugas /> };
    case "/belajar":
      return { judul: JUDUL[path], elemen: <HalamanBelajar /> };
    case "/progres":
      return { judul: JUDUL[path], elemen: <HalamanProgres /> };
    case "/ujian":
      return { judul: JUDUL[path], elemen: <HalamanUjian /> };
    case "/kalender":
      return { judul: JUDUL[path], elemen: <HalamanKalender /> };
    case "/catatan":
      return { judul: JUDUL[path], elemen: <HalamanCatatan /> };
    case "/proyek":
      return { judul: JUDUL[path], elemen: <HalamanProyek /> };
    case "/pengaturan":
      return { judul: JUDUL[path], elemen: <HalamanPengaturan /> };
    default:
      return { judul: "Beranda", elemen: <Dashboard /> };
  }
}

export function AppShell() {
  const data = useAppData();
  const jalur = useRoute();
  const { path } = pecahJalur(jalur);
  const [menuTerbuka, setMenuTerbuka] = useState(false);
  const [gelap, setGelap] = useState(() => getTema() === "gelap");

  useEffect(() => initTema(), []);

  if (!data.profil) {
    return (
      <>
        <Onboarding />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  const { judul, elemen } = halamanDari(path, data);

  const gantiTema = () => {
    const baru = gelap ? "terang" : "gelap";
    setTema(baru);
    setGelap(baru === "gelap");
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col bg-background">
      {/* Kepala */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="flex items-center gap-2.5 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-bold leading-tight">{judul}</p>
            {path === "/beranda" && (
              <p className="truncate text-xs text-muted-foreground">{formatTanggal(todayISO())}</p>
            )}
          </div>
          <Button variant="ghost" size="iconSm" onClick={gantiTema} aria-label="Ganti tema">
            {gelap ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <div className="relative">
            <Button variant="ghost" size="iconSm" onClick={() => setMenuTerbuka((v) => !v)} aria-label="Menu lainnya">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
            {menuTerbuka && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuTerbuka(false)} />
                <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-2xl border bg-popover p-1.5 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
                  {MENU_LAIN.map((m) => (
                    <button
                      key={m.path}
                      onClick={() => {
                        setMenuTerbuka(false);
                        navigate(m.path);
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
                        path === m.path ? "bg-secondary text-primary" : "hover:bg-muted"
                      }`}
                    >
                      <m.icon className="h-4.5 w-4.5" />
                      {m.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Isi halaman */}
      <main className="flex-1 px-4 pb-32 pt-4">{elemen}</main>

      {/* Navigasi bawah */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-1.5">
          {MENU_BAWAH.map((m) => {
            const aktif = path === m.path;
            return (
              <button
                key={m.path}
                onClick={() => navigate(m.path)}
                className="relative flex min-w-14 flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 transition-colors"
              >
                <m.icon className={`h-6 w-6 transition-colors ${aktif ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-[11px] font-bold transition-colors ${aktif ? "text-primary" : "text-muted-foreground"}`}>
                  {m.label}
                </span>
                {aktif && <span className="absolute -top-1 h-1 w-6 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>
      </nav>

      <Toaster position="top-center" richColors />
    </div>
  );
}
