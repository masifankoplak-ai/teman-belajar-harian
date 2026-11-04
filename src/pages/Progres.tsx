// Progres Belajar: ringkasan capaian PR per minggu, per mata pelajaran, dan kebiasaan.

import { BarChart3, CheckCircle2, Flame, NotebookPen, Trophy } from "lucide-react";

import { Card, EmptyState, Pill, Progress, SectionTitle } from "@/components/ui/kit";
import { hitungStreak, mingguBerisi, tambahHari, todayISO } from "@/lib/dates";
import { daftarMapel, useAppData } from "@/lib/store";

const LABEL_MINGGU = ["Minggu ini", "Minggu lalu", "2 minggu lalu", "3 minggu lalu"];

export function HalamanProgres() {
  const data = useAppData();
  const hariIni = todayISO();

  const prSelesai = data.pr.filter((t) => t.status === "selesai");
  const prAktif = data.pr.length - prSelesai.length;

  // Jumlah PR selesai per minggu, 4 minggu terakhir.
  const mingguIni = mingguBerisi(hariIni);
  const perMinggu = LABEL_MINGGU.map((label, i) => {
    const awal = i === 0 ? (mingguIni[0] ?? hariIni) : tambahHari(mingguIni[0] ?? hariIni, -7 * i);
    const tanggal = mingguBerisi(awal);
    const jumlah = prSelesai.filter((t) => tanggal.includes((t.selesaiPada ?? "").slice(0, 10))).length;
    return { label, jumlah };
  }).reverse();
  const maks = Math.max(1, ...perMinggu.map((m) => m.jumlah));

  // Capaian per mata pelajaran (dari PR).
  const mapelStat = daftarMapel(data)
    .map((m) => {
      const pr = data.pr.filter((t) => t.mapel === m);
      const selesai = pr.filter((t) => t.status === "selesai").length;
      return { mapel: m, total: pr.length, selesai };
    })
    .filter((s) => s.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  // Kebiasaan.
  const streakTerbaik = data.kebiasaan.reduce((maks, k) => Math.max(maks, hitungStreak(k.riwayat)), 0);
  const selesaiMinggu = data.kebiasaan.reduce((n, k) => n + mingguIni.filter((t) => k.riwayat.includes(t)).length, 0);
  const rataRata = data.kebiasaan.length === 0 ? 0 : Math.round((selesaiMinggu / (data.kebiasaan.length * 7)) * 100);

  const kosong = data.pr.length === 0 && data.kebiasaan.length === 0 && data.proyek.length === 0;

  return (
    <div className="space-y-5">
      {kosong ? (
        <EmptyState
          icon={<BarChart3 className="h-6 w-6" />}
          judul="Belum ada data progres"
          deskripsi="Isi jadwal, catat PR, dan tandai kebiasaan belajarmu — progres muncul di sini."
        />
      ) : (
        <>
          {/* Ringkasan utama */}
          {data.pr.length > 0 && (
            <Card className="bg-sky-soft p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Trophy className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-bold text-primary">
                    {prSelesai.length} dari {data.pr.length} PR selesai
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {prAktif > 0 ? `Sisa ${prAktif} PR lagi. Semangat terus!` : "Semua PR beres. Hebat!"}
                  </p>
                </div>
              </div>
              <Progress className="mt-3" value={(prSelesai.length / data.pr.length) * 100} tone={prAktif === 0 ? "success" : "primary"} />
            </Card>
          )}

          {/* PR selesai per minggu */}
          {prSelesai.length > 0 && (
            <section>
              <SectionTitle>PR Selesai per Minggu</SectionTitle>
              <Card className="p-4">
                <div className="flex items-end gap-3">
                  {perMinggu.map((m) => (
                    <div key={m.label} className="flex flex-1 flex-col items-center gap-1.5">
                      <span className="text-xs font-bold">{m.jumlah}</span>
                      <div className="flex h-24 w-full items-end rounded-xl bg-muted">
                        <div
                          className="w-full rounded-xl bg-primary transition-all duration-500"
                          style={{ height: `${Math.max(6, (m.jumlah / maks) * 100)}%`, opacity: m.jumlah === 0 ? 0.3 : 1 }}
                        />
                      </div>
                      <span className="text-center text-[10px] leading-tight text-muted-foreground">{m.label}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </section>
          )}

          {/* Per mata pelajaran */}
          {mapelStat.length > 0 && (
            <section>
              <SectionTitle>Capaian per Mapel</SectionTitle>
              <Card className="space-y-3.5 p-4">
                {mapelStat.map((s) => (
                  <div key={s.mapel}>
                    <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-bold">{s.mapel}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {s.selesai}/{s.total} selesai
                      </span>
                    </div>
                    <Progress value={(s.selesai / s.total) * 100} tone={s.selesai === s.total ? "success" : "primary"} />
                  </div>
                ))}
              </Card>
            </section>
          )}

          {/* Kebiasaan */}
          {data.kebiasaan.length > 0 && (
            <section>
              <SectionTitle>Progres Kebiasaan</SectionTitle>
              <Card className="p-4">
                <div className="flex flex-wrap gap-1.5">
                  <Pill tone="primary">
                    <Flame className="h-3 w-3" /> Streak terbaik {streakTerbaik} hari
                  </Pill>
                  <Pill tone={rataRata >= 70 ? "success" : "secondary"}>Rata-rata minggu ini {rataRata}%</Pill>
                </div>
                <div className="mt-3 space-y-2.5">
                  {data.kebiasaan.map((k) => {
                    const jumlah = mingguIni.filter((t) => k.riwayat.includes(t)).length;
                    return (
                      <div key={k.id}>
                        <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                          <span className="truncate font-bold">{k.nama}</span>
                          <span className="shrink-0 text-muted-foreground">{jumlah}/7 hari</span>
                        </div>
                        <Progress value={(jumlah / 7) * 100} tone={jumlah >= k.targetPerMinggu ? "success" : "primary"} />
                      </div>
                    );
                  })}
                </div>
              </Card>
            </section>
          )}

          {/* Catatan & proyek */}
          <Card className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
              <NotebookPen className="h-5 w-5" />
            </div>
            <div className="flex-1 text-sm">
              <p className="font-bold">Koleksi belajarmu</p>
              <p className="text-xs text-muted-foreground">
                {data.catatan.length} catatan · {data.proyek.filter((p) => p.status === "selesai").length} proyek selesai ·{" "}
                {data.ujian.filter((u) => u.tanggal >= hariIni).length} ujian mendatang
              </p>
            </div>
            <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
          </Card>
        </>
      )}
    </div>
  );
}
