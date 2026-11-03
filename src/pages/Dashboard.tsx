// Beranda: ringkasan hari ini — jadwal, PR mendekati tenggat, ujian, dan kebiasaan.

import { CalendarDays, ChevronRight, ClipboardList, Flame, NotebookPen, Target } from "lucide-react";
import { toast } from "sonner";

import { Card, EmptyState, Pill, Progress, SectionTitle } from "@/components/ui/kit";
import {
  formatTanggal,
  hitungStreak,
  indeksHariISO,
  labelHitungMundur,
  labelTenggat,
  menitDariJam,
  menitSekarang,
  sapaanWaktu,
  todayISO,
} from "@/lib/dates";
import { navigate } from "@/lib/router";
import { mutate, useAppData } from "@/lib/store";

export function Dashboard() {
  const data = useAppData();
  const hariIni = todayISO();
  const hari = indeksHariISO(hariIni);

  const jadwalHariIni = data.jadwal
    .filter((j) => j.hari === hari)
    .sort((a, b) => menitDariJam(a.jamMulai) - menitDariJam(b.jamMulai));

  const prAktif = data.pr
    .filter((t) => t.status !== "selesai")
    .sort((a, b) => a.tenggat.localeCompare(b.tenggat))
    .slice(0, 3);

  const ujianMendekat = data.ujian
    .filter((u) => u.tanggal >= hariIni)
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.jam.localeCompare(b.jam))
    .slice(0, 2);

  const selesaiHariIni = data.kebiasaan.filter((k) => k.riwayat.includes(hariIni)).length;
  const streakTerbaik = data.kebiasaan.reduce((maks, k) => Math.max(maks, hitungStreak(k.riwayat)), 0);
  const namaDepan = (data.profil?.nama ?? "").split(" ")[0] ?? "";

  const toggleKebiasaan = (id: string, nama: string, sudah: boolean) => {
    mutate((d) => {
      const k = d.kebiasaan.find((x) => x.id === id);
      if (!k) return;
      k.riwayat = sudah ? k.riwayat.filter((t) => t !== hariIni) : [...k.riwayat, hariIni];
    });
    if (!sudah) toast.success(`Mantap! "${nama}" selesai hari ini.`);
  };

  const nadaTenggat = (iso: string) => {
    const sel = labelTenggat(iso);
    if (sel.startsWith("Terlambat")) return "danger" as const;
    if (sel === "Hari ini" || sel === "Besok") return "warning" as const;
    return "secondary" as const;
  };

  return (
    <div className="space-y-6">
      {/* Sapaan */}
      <Card className="bg-sky-soft p-4">
        <p className="font-display text-xl font-bold text-primary">
          {sapaanWaktu()}, {namaDepan || "Sahabat"}!
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">{formatTanggal(hariIni)} · Semangat belajarnya!</p>
      </Card>

      {/* Jadwal hari ini */}
      <section>
        <SectionTitle aksi={<button onClick={() => navigate("/jadwal")} className="flex items-center gap-0.5 text-sm font-bold text-primary">Lihat semua <ChevronRight className="h-4 w-4" /></button>}>
          Jadwal Hari Ini
        </SectionTitle>
        {jadwalHariIni.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-6 w-6" />}
            judul="Tidak ada jadwal hari ini"
            deskripsi="Nikmati harimu, atau isi jadwal pelajaran dulu."
            aksi={
              <button onClick={() => navigate("/jadwal")} className="rounded-xl bg-secondary px-3 py-2 text-sm font-bold text-primary">
                Isi Jadwal
              </button>
            }
          />
        ) : (
          <div className="space-y-2">
            {jadwalHariIni.map((j) => {
              const sekarang = menitSekarang();
              const sedang = sekarang >= menitDariJam(j.jamMulai) && sekarang < menitDariJam(j.jamSelesai);
              return (
                <Card key={j.id} className={`flex items-center gap-3 p-3 ${sedang ? "ring-2 ring-primary/40" : ""}`}>
                  <div className="h-10 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: j.warna }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{j.mapel}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {j.jamMulai}–{j.jamSelesai}
                      {j.ruang ? ` · ${j.ruang}` : ""}
                    </p>
                  </div>
                  {sedang && <Pill tone="primary">Sedang</Pill>}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* PR mendekati tenggat */}
      <section>
        <SectionTitle aksi={<button onClick={() => navigate("/tugas")} className="flex items-center gap-0.5 text-sm font-bold text-primary">Lihat semua <ChevronRight className="h-4 w-4" /></button>}>
          PR Mendekati Tenggat
        </SectionTitle>
        {prAktif.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-6 w-6" />}
            judul="Tidak ada PR yang menggantung"
            deskripsi="Semua pekerjaan rumah beres. Kerja bagus!"
          />
        ) : (
          <div className="space-y-2">
            {prAktif.map((t) => (
              <Card key={t.id} className="flex items-center gap-3 p-3" onClick={() => navigate("/tugas")}>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{t.judul}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.mapel || "Tanpa mapel"} · {labelTenggat(t.tenggat)}
                  </p>
                </div>
                <Pill tone={nadaTenggat(t.tenggat)}>{labelTenggat(t.tenggat)}</Pill>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Ujian terdekat */}
      {ujianMendekat.length > 0 && (
        <section>
          <SectionTitle aksi={<button onClick={() => navigate("/ujian")} className="flex items-center gap-0.5 text-sm font-bold text-primary">Lihat semua <ChevronRight className="h-4 w-4" /></button>}>
            Ulangan & Ujian Terdekat
          </SectionTitle>
          <div className="space-y-2">
            {ujianMendekat.map((u) => (
              <Card key={u.id} className="flex items-center gap-3 p-3" onClick={() => navigate("/ujian")}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
                  <NotebookPen className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{u.nama}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.mapel || u.jenis}</p>
                </div>
                <Pill tone="primary">{labelHitungMundur(u.tanggal)}</Pill>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Kebiasaan hari ini */}
      {data.kebiasaan.length > 0 && (
        <section>
          <SectionTitle
            aksi={
              <span className="flex items-center gap-1 text-sm font-bold text-muted-foreground">
                <Flame className="h-4 w-4 text-accent" /> {streakTerbaik} hari
              </span>
            }
          >
            Kebiasaan Hari Ini
          </SectionTitle>
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-bold">
                {selesaiHariIni} dari {data.kebiasaan.length} selesai
              </p>
              <button onClick={() => navigate("/belajar")} className="flex items-center gap-0.5 text-sm font-bold text-primary">
                <Target className="h-4 w-4" /> Kelola
              </button>
            </div>
            <Progress value={(selesaiHariIni / data.kebiasaan.length) * 100} tone={selesaiHariIni === data.kebiasaan.length ? "success" : "primary"} />
            <div className="mt-3 flex flex-wrap gap-2">
              {data.kebiasaan.map((k) => {
                const sudah = k.riwayat.includes(hariIni);
                return (
                  <button
                    key={k.id}
                    onClick={() => toggleKebiasaan(k.id, k.nama, sudah)}
                    className={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                      sudah ? "border-success bg-success/15 text-success-foreground" : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${sudah ? "bg-success" : "bg-border"}`} />
                    {k.nama}
                  </button>
                );
              })}
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}
