// Profil & Pengaturan: profil pelajar, tema, pengingat, dan cadangan data.

import { useRef, useState } from "react";
import { Bell, Download, Palette, RefreshCcw, Upload, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Button, Card, ConfirmDialog, Field, Input, SectionTitle, Segmented, Select } from "@/components/ui/kit";
import { aturUlangPengingat, izinkanNotifikasi, perangkatNative } from "@/lib/notify";
import { VERSI_DATA, getData, imporJSON, mutate, resetData, setTema, unduhCadangan, useAppData, type Tema } from "@/lib/store";
import type { Jenjang, Notifikasi } from "@/lib/types";

const JENJANG: Jenjang[] = ["SD", "SMP", "SMA", "SMK"];
const HARI_PILIH = [0, 1, 2, 3, 5, 7];
const LABEL_HARI: Record<number, string> = { 0: "H-0 (hari H)", 1: "H-1", 2: "H-2", 3: "H-3", 5: "H-5", 7: "H-7" };

function Saklar({ label, deskripsi, nilai, onChange }: { label: string; deskripsi?: string; nilai: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!nilai)} className="flex w-full items-center justify-between gap-3 rounded-2xl px-1 py-2.5 text-left" role="switch" aria-checked={nilai}>
      <span className="min-w-0">
        <span className="block text-sm font-bold">{label}</span>
        {deskripsi && <span className="block text-xs text-muted-foreground">{deskripsi}</span>}
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${nilai ? "bg-primary" : "bg-muted-foreground/30"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${nilai ? "left-[1.375rem]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

export function HalamanPengaturan() {
  const data = useAppData();
  const profil = data.profil;
  const [tema, setTemaState] = useState<Tema>(() => {
    try {
      const v = localStorage.getItem("teman-belajarku:tema");
      return v === "gelap" || v === "sistem" ? v : "terang";
    } catch {
      return "terang";
    }
  });
  const [formProfil, setFormProfil] = useState(() => ({
    nama: profil?.nama ?? "",
    sekolah: profil?.sekolah ?? "",
    jenjang: (profil?.jenjang ?? "SMP") as Jenjang,
    kelas: profil?.kelas ?? "",
    tahunAjaran: profil?.tahunAjaran ?? "",
  }));
  const [hapus, setHapus] = useState(false);
  const unggah = useRef<HTMLInputElement>(null);

  if (!profil) return null;

  const gantiTema = (t: Tema) => {
    setTemaState(t);
    setTema(t);
  };

  const simpanProfil = () => {
    if (!formProfil.nama.trim()) {
      toast.error("Nama tidak boleh kosong.");
      return;
    }
    mutate((d) => {
      if (d.profil) Object.assign(d.profil, { ...formProfil, nama: formProfil.nama.trim(), sekolah: formProfil.sekolah.trim(), kelas: formProfil.kelas.trim(), tahunAjaran: formProfil.tahunAjaran.trim() });
    });
    toast.success("Profil disimpan.");
  };

  const ubahNotifikasi = (fn: (n: Notifikasi) => void) => {
    mutate((d) => fn(d.notifikasi));
    void aturUlangPengingat(getData());
  };

  return (
    <div className="space-y-5">
      {/* Profil */}
      <section>
        <SectionTitle>Profilku</SectionTitle>
        <Card className="space-y-4 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <UserRound className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-bold">{profil.nama}</p>
              <p className="truncate text-xs text-muted-foreground">
                {profil.jenjang} kelas {profil.kelas || "-"}
                {profil.sekolah ? ` · ${profil.sekolah}` : ""}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <Field label="Nama">
              <Input value={formProfil.nama} onChange={(e) => setFormProfil({ ...formProfil, nama: e.target.value })} maxLength={30} />
            </Field>
            <Field label="Nama sekolah">
              <Input value={formProfil.sekolah} onChange={(e) => setFormProfil({ ...formProfil, sekolah: e.target.value })} maxLength={40} />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Jenjang">
                <Select value={formProfil.jenjang} onChange={(e) => setFormProfil({ ...formProfil, jenjang: e.target.value as Jenjang })}>
                  {JENJANG.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Kelas">
                <Input value={formProfil.kelas} onChange={(e) => setFormProfil({ ...formProfil, kelas: e.target.value })} inputMode="numeric" maxLength={4} />
              </Field>
              <Field label="Tahun ajaran">
                <Input value={formProfil.tahunAjaran} onChange={(e) => setFormProfil({ ...formProfil, tahunAjaran: e.target.value })} maxLength={12} />
              </Field>
            </div>
            <Button className="w-full" onClick={simpanProfil}>
              Simpan Profil
            </Button>
          </div>
        </Card>
      </section>

      {/* Tema */}
      <section>
        <SectionTitle>Tampilan</SectionTitle>
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold">
            <Palette className="h-4 w-4 text-primary" /> Tema aplikasi
          </div>
          <Segmented
            options={[
              { value: "terang", label: "Terang" },
              { value: "gelap", label: "Gelap" },
              { value: "sistem", label: "Sistem" },
            ]}
            value={tema}
            onChange={(v) => gantiTema(v as Tema)}
          />
          <p className="mt-2 text-xs text-muted-foreground">Sistem mengikuti pengaturan gelap/terang di HP-mu.</p>
        </Card>
      </section>

      {/* Pengingat */}
      <section>
        <SectionTitle>Pengingat</SectionTitle>
        <Card className="p-4">
          <div className="mb-1 flex items-center gap-2 text-sm font-bold">
            <Bell className="h-4 w-4 text-primary" /> Notifikasi lokal
          </div>
          {perangkatNative() ? (
            <Button
              variant="soft"
              size="sm"
              className="mb-2"
              onClick={async () => {
                const ok = await izinkanNotifikasi();
                toast[ok ? "success" : "error"](ok ? "Notifikasi diizinkan." : "Izin notifikasi ditolak.");
              }}
            >
              Izinkan notifikasi di HP ini
            </Button>
          ) : (
            <p className="mb-2 text-xs text-muted-foreground">Pengingat muncul otomatis di aplikasi HP (Android). Di browser, pengaturan ini disimpan saja.</p>
          )}

          <Saklar label="Tenggat PR" deskripsi="Ingatkan sebelum PR dikumpulkan" nilai={data.notifikasi.tenggatPR} onChange={(v) => ubahNotifikasi((n) => { n.tenggatPR = v; })} />
          <Saklar label="Jadwal ujian" deskripsi="Ingatkan mendekati hari ujian" nilai={data.notifikasi.jadwalUjian} onChange={(v) => ubahNotifikasi((n) => { n.jadwalUjian = v; })} />
          <Saklar label="Kegiatan sekolah" deskripsi="Ingatkan kegiatan di kalender" nilai={data.notifikasi.kegiatanSekolah} onChange={(v) => ubahNotifikasi((n) => { n.kegiatanSekolah = v; })} />
          <Saklar label="Kebiasaan harian" deskripsi="Ingatan harian untuk kebiasaan belajar" nilai={data.notifikasi.kebiasaanHarian} onChange={(v) => ubahNotifikasi((n) => { n.kebiasaanHarian = v; })} />
          <Saklar label="Jadwal belajar" deskripsi="Ingatkan sesi belajar harian" nilai={data.notifikasi.jadwalBelajar} onChange={(v) => ubahNotifikasi((n) => { n.jadwalBelajar = v; })} />

          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Jam pengingat">
              <Input type="time" value={data.notifikasi.jamPengingat} onChange={(e) => ubahNotifikasi((n) => { n.jamPengingat = e.target.value; })} />
            </Field>
          </div>

          <div className="mt-3">
            <p className="mb-1.5 text-sm font-bold text-foreground/80">Ingatkan PR</p>
            <div className="flex flex-wrap gap-1.5">
              {HARI_PILIH.map((h) => {
                const aktif = data.notifikasi.hariSebelumPR.includes(h);
                return (
                  <button
                    key={h}
                    onClick={() =>
                      ubahNotifikasi((n) => {
                        n.hariSebelumPR = aktif ? n.hariSebelumPR.filter((x) => x !== h) : [...n.hariSebelumPR, h].sort((a, b) => a - b);
                      })
                    }
                    className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                      aktif ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {LABEL_HARI[h] ?? `H-${h}`}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3">
            <p className="mb-1.5 text-sm font-bold text-foreground/80">Ingatkan ujian</p>
            <div className="flex flex-wrap gap-1.5">
              {HARI_PILIH.map((h) => {
                const aktif = data.notifikasi.hariSebelumUjian.includes(h);
                return (
                  <button
                    key={h}
                    onClick={() =>
                      ubahNotifikasi((n) => {
                        n.hariSebelumUjian = aktif ? n.hariSebelumUjian.filter((x) => x !== h) : [...n.hariSebelumUjian, h].sort((a, b) => a - b);
                      })
                    }
                    className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                      aktif ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {LABEL_HARI[h] ?? `H-${h}`}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      </section>

      {/* Data */}
      <section>
        <SectionTitle>Data & Cadangan</SectionTitle>
        <Card className="space-y-3 p-4">
          <p className="text-xs text-muted-foreground">
            Semua data tersimpan di perangkatmu. Simpan cadangan rutin supaya data aman saat ganti HP atau hapus data peramban.
          </p>
          <Button variant="soft" className="w-full" onClick={() => { unduhCadangan(); toast.success("Cadangan diunduh."); }}>
            <Download className="h-4.5 w-4.5" /> Unduh Cadangan
          </Button>
          <Button variant="soft" className="w-full" onClick={() => unggah.current?.click()}>
            <Upload className="h-4.5 w-4.5" /> Impor Cadangan
          </Button>
          <input
            ref={unggah}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              try {
                imporJSON(await file.text());
                toast.success("Cadangan berhasil dipulihkan!");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "File tidak bisa dibaca.");
              }
            }}
          />
          <Button variant="outline" className="w-full" onClick={() => setHapus(true)}>
            <RefreshCcw className="h-4.5 w-4.5" /> Mulai dari Awal
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">Versi data {VERSI_DATA}</p>
        </Card>
      </section>

      <ConfirmDialog
        open={hapus}
        title="Hapus semua data?"
        description="Profil, jadwal, PR, catatan, dan semua progres akan dihapus. Sebaiknya unduh cadangan dulu."
        confirmLabel="Hapus Semua"
        danger
        onConfirm={() => {
          resetData();
          toast.success("Data dikosongkan. Mulai lagi dari awal ya!");
        }}
        onClose={() => setHapus(false)}
      />
    </div>
  );
}
