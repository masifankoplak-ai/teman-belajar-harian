// Kalender Akademik: tampilan bulanan gabungan ujian, tenggat PR/proyek, dan kegiatan.

import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Modal,
  Pill,
  SectionTitle,
  Select,
  Textarea,
} from "@/components/ui/kit";
import { NAMA_BULAN, NAMA_HARI, formatTanggal, indeksHari, parseISO, todayISO, toISO } from "@/lib/dates";
import { idBaru, mutate, useAppData } from "@/lib/store";
import type { JenisAktivitas } from "@/lib/types";

const JENIS_AKTIVITAS: JenisAktivitas[] = ["Kegiatan Sekolah", "Proyek", "Target Belajar", "Lainnya"];

type Acara = {
  id: string;
  jenis: "ujian" | "pr" | "proyek" | "aktivitas";
  label: string;
  judul: string;
  sub: string;
};

const WARNA_TITIK: Record<Acara["jenis"], string> = {
  ujian: "bg-destructive",
  pr: "bg-accent",
  proyek: "bg-primary",
  aktivitas: "bg-success",
};

type FormAktivitas = { judul: string; jam: string; jenis: JenisAktivitas; catatan: string };

export function HalamanKalender() {
  const data = useAppData();
  const hariIni = todayISO();
  const [bulanOffset, setBulanOffset] = useState(0);
  const [tanggalPilih, setTanggalPilih] = useState(hariIni);
  const [form, setForm] = useState<FormAktivitas | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [hapusId, setHapusId] = useState<string | null>(null);

  // Kumpulkan semua acara ke peta tanggal.
  const petaAcara = new Map<string, Acara[]>();
  const tambahAcara = (tanggal: string, a: Acara) => {
    if (!tanggal) return;
    const arr = petaAcara.get(tanggal) ?? [];
    arr.push(a);
    petaAcara.set(tanggal, arr);
  };
  data.ujian.forEach((u) => tambahAcara(u.tanggal, { id: u.id, jenis: "ujian", label: u.jenis, judul: u.nama, sub: u.jam ? `Pukul ${u.jam}` : "" }));
  data.pr.filter((t) => t.status !== "selesai").forEach((t) => tambahAcara(t.tenggat, { id: t.id, jenis: "pr", label: "Tenggat PR", judul: t.judul, sub: t.mapel }));
  data.proyek.filter((p) => p.status !== "selesai").forEach((p) => tambahAcara(p.tenggat, { id: p.id, jenis: "proyek", label: "Tenggat Proyek", judul: p.judul, sub: p.mapel }));
  data.aktivitas.forEach((a) => tambahAcara(a.tanggal, { id: a.id, jenis: "aktivitas", label: a.jenis, judul: a.judul, sub: a.jam ? `Pukul ${a.jam}` : "" }));

  // Info bulan yang ditampilkan.
  const basis = new Date();
  basis.setDate(1);
  basis.setMonth(basis.getMonth() + bulanOffset);
  const tahunBulan = basis.getFullYear();
  const bulanKe = basis.getMonth();
  const kunciBulan = `${tahunBulan}-${String(bulanKe + 1).padStart(2, "0")}`;
  const hariPertama = indeksHari(parseISO(`${kunciBulan}-01`));
  const jumlahHari = new Date(tahunBulan, bulanKe + 1, 0).getDate();
  const jumlahSel = Math.ceil((hariPertama + jumlahHari) / 7) * 7;

  const acaraHariIni = petaAcara.get(tanggalPilih) ?? [];
  const aktivitasHari = data.aktivitas.filter((a) => a.tanggal === tanggalPilih);

  const bukaEdit = (a: { id: string; tanggal: string; jam: string; judul: string; jenis: JenisAktivitas; catatan: string }) => {
    setEditId(a.id);
    setForm({ judul: a.judul, jam: a.jam, jenis: a.jenis, catatan: a.catatan });
  };

  const simpan = () => {
    if (!form) return;
    if (!form.judul.trim()) {
      toast.error("Nama kegiatan belum diisi.");
      return;
    }
    const nilai = { judul: form.judul.trim(), jam: form.jam, jenis: form.jenis, catatan: form.catatan.trim() };
    mutate((d) => {
      if (editId) {
        const lama = d.aktivitas.find((x) => x.id === editId);
        if (lama) Object.assign(lama, nilai);
      } else {
        d.aktivitas.push({ id: idBaru(), tanggal: tanggalPilih, ...nilai });
      }
    });
    toast.success(editId ? "Kegiatan diperbarui." : "Kegiatan ditambahkan!");
    setForm(null);
    setEditId(null);
  };

  return (
    <div className="space-y-4">
      {/* Navigasi bulan */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <Button variant="ghost" size="iconSm" onClick={() => setBulanOffset((v) => v - 1)} aria-label="Bulan sebelumnya">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <p className="font-display text-lg font-bold">
            {NAMA_BULAN[bulanKe] ?? ""} {tahunBulan}
            {bulanOffset === 0 && <span className="ml-2 text-xs font-bold text-muted-foreground">bulan ini</span>}
          </p>
          <Button variant="ghost" size="iconSm" onClick={() => setBulanOffset((v) => v + 1)} aria-label="Bulan berikutnya">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-muted-foreground">
          {NAMA_HARI.map((h) => (
            <div key={h}>{h.slice(0, 3)}</div>
          ))}
        </div>
        <div className="mt-1.5 grid grid-cols-7 gap-1">
          {Array.from({ length: jumlahSel }, (_, i) => {
            const nomor = i - hariPertama + 1;
            if (nomor < 1 || nomor > jumlahHari) return <div key={i} />;
            const iso = `${kunciBulan}-${String(nomor).padStart(2, "0")}`;
            const daftar = petaAcara.get(iso) ?? [];
            const dipilih = iso === tanggalPilih;
            const kini = iso === hariIni;
            return (
              <button
                key={i}
                onClick={() => setTanggalPilih(iso)}
                className={`flex h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-sm font-bold transition-colors ${
                  dipilih ? "bg-primary text-primary-foreground" : kini ? "bg-secondary" : "hover:bg-muted"
                }`}
              >
                <span>{nomor}</span>
                <span className="flex h-1 gap-0.5">
                  {daftar.slice(0, 3).map((a, k) => (
                    <span key={`${a.jenis}-${a.id}-${k}`} className={`h-1 w-1 rounded-full ${dipilih ? "bg-white/80" : WARNA_TITIK[a.jenis]}`} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Rincian hari terpilih */}
      <section>
        <SectionTitle
          aksi={
            <Button size="sm" variant="soft" onClick={() => { setEditId(null); setForm({ judul: "", jam: "", jenis: "Kegiatan Sekolah", catatan: "" }); }}>
              <Plus className="h-4 w-4" /> Kegiatan
            </Button>
          }
        >
          {formatTanggal(tanggalPilih)}
        </SectionTitle>

        {acaraHariIni.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-6 w-6" />}
            judul="Tidak ada agenda"
            deskripsi="Hari ini kosong — waktunya santai atau menambah kegiatan."
          />
        ) : (
          <div className="space-y-2">
            {acaraHariIni.map((a) => {
              const aktiv = a.jenis === "aktivitas" ? data.aktivitas.find((x) => x.id === a.id) : undefined;
              return (
                <Card key={`${a.jenis}-${a.id}`} className="flex items-center gap-3 p-3">
                  <span className={`h-9 w-1.5 shrink-0 rounded-full ${WARNA_TITIK[a.jenis]}`} />
                  <div className="min-w-0 flex-1" onClick={() => aktiv && bukaEdit(aktiv)}>
                    <p className="truncate font-bold">{a.judul}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.label}
                      {a.sub ? ` · ${a.sub}` : ""}
                    </p>
                  </div>
                  {aktiv ? (
                    <button onClick={() => setHapusId(aktiv.id)} className="shrink-0 rounded-xl p-1.5 text-muted-foreground hover:bg-muted" aria-label="Hapus kegiatan">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : (
                    <Pill tone="secondary">Otomatis</Pill>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal tambah/ubah kegiatan */}
      <Modal open={form !== null} onClose={() => setForm(null)} title={editId ? "Ubah Kegiatan" : "Kegiatan Baru"}>
        {form && (
          <div className="space-y-4">
            <p className="text-xs font-bold text-muted-foreground">{formatTanggal(tanggalPilih)}</p>
            <Field label="Nama kegiatan">
              <Input value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} placeholder="Misalnya: Upacara bendera" maxLength={60} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Jenis">
                <Select value={form.jenis} onChange={(e) => setForm({ ...form, jenis: e.target.value as JenisAktivitas })}>
                  {JENIS_AKTIVITAS.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Jam (boleh kosong)">
                <Input type="time" value={form.jam} onChange={(e) => setForm({ ...form, jam: e.target.value })} />
              </Field>
            </div>
            <Field label="Catatan (boleh kosong)">
              <Textarea value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} maxLength={300} />
            </Field>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setForm(null)}>
                Batal
              </Button>
              <Button className="flex-1" onClick={simpan}>
                Simpan
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={hapusId !== null}
        title="Hapus kegiatan ini?"
        onConfirm={() => {
          if (!hapusId) return;
          mutate((d) => {
            d.aktivitas = d.aktivitas.filter((x) => x.id !== hapusId);
          });
          toast.success("Kegiatan dihapus.");
        }}
        onClose={() => setHapusId(null)}
      />
    </div>
  );
}
