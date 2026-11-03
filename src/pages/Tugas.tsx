// Pekerjaan Rumah: daftar PR dengan filter status, siklus status, dan pengingat tenggat.

import { useState } from "react";
import { CheckCircle2, Circle, Clock, Plus, Trash2 } from "lucide-react";
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
  Segmented,
  Select,
  Textarea,
} from "@/components/ui/kit";
import { labelTenggat, todayISO } from "@/lib/dates";
import { daftarMapel, idBaru, mutate, useAppData } from "@/lib/store";
import type { PR, Prioritas, StatusPR } from "@/lib/types";

const OPSI_FILTER = [
  { value: "semua", label: "Semua" },
  { value: "belum", label: "Belum" },
  { value: "dikerjakan", label: "Dikerjakan" },
  { value: "selesai", label: "Selesai" },
] as const;
type Filter = (typeof OPSI_FILTER)[number]["value"];

type FormPR = {
  judul: string;
  mapel: string;
  deskripsi: string;
  tanggalDiberikan: string;
  tenggat: string;
  prioritas: Prioritas;
  estimasiMenit: string;
  catatan: string;
};

const formKosong = (): FormPR => ({
  judul: "",
  mapel: "",
  deskripsi: "",
  tanggalDiberikan: todayISO(),
  tenggat: todayISO(),
  prioritas: "sedang",
  estimasiMenit: "30",
  catatan: "",
});

const GARIS_PRIORITAS: Record<Prioritas, string> = {
  rendah: "border-l-muted-foreground/30",
  sedang: "border-l-accent",
  tinggi: "border-l-destructive",
};

function ikonStatus(status: StatusPR) {
  if (status === "selesai") return <CheckCircle2 className="h-6 w-6 text-success" />;
  if (status === "dikerjakan") return <Clock className="h-6 w-6 text-accent-foreground" />;
  return <Circle className="h-6 w-6 text-muted-foreground/50" />;
}

function nadaTenggat(iso: string): "danger" | "warning" | "secondary" {
  const label = labelTenggat(iso);
  if (label.startsWith("Terlambat")) return "danger";
  if (label === "Hari ini" || label === "Besok") return "warning";
  return "secondary";
}

export function HalamanTugas() {
  const data = useAppData();
  const [filter, setFilter] = useState<Filter>("semua");
  const [form, setForm] = useState<FormPR | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [hapusId, setHapusId] = useState<string | null>(null);

  const daftar = data.pr
    .filter((t) => filter === "semua" || t.status === filter)
    .sort((a, b) => {
      if (a.status === "selesai" && b.status !== "selesai") return 1;
      if (b.status === "selesai" && a.status !== "selesai") return -1;
      return a.tenggat.localeCompare(b.tenggat);
    });

  const siklusStatus = (t: PR) => {
    const urutan: StatusPR[] = ["belum", "dikerjakan", "selesai"];
    const berikut = urutan[(urutan.indexOf(t.status) + 1) % urutan.length] ?? "belum";
    mutate((d) => {
      const item = d.pr.find((x) => x.id === t.id);
      if (!item) return;
      item.status = berikut;
      if (berikut === "selesai" && !item.selesaiPada) item.selesaiPada = new Date().toISOString();
      if (berikut !== "selesai") delete item.selesaiPada;
    });
    if (berikut === "selesai") toast.success(`Kerja bagus! "${t.judul}" selesai 🎉`);
  };

  const bukaEdit = (t: PR) => {
    setEditId(t.id);
    setForm({
      judul: t.judul,
      mapel: t.mapel,
      deskripsi: t.deskripsi,
      tanggalDiberikan: t.tanggalDiberikan,
      tenggat: t.tenggat,
      prioritas: t.prioritas,
      estimasiMenit: String(t.estimasiMenit),
      catatan: t.catatan,
    });
  };

  const simpan = () => {
    if (!form) return;
    if (!form.judul.trim()) {
      toast.error("Judul PR belum diisi.");
      return;
    }
    const nilai = {
      judul: form.judul.trim(),
      mapel: form.mapel.trim(),
      deskripsi: form.deskripsi.trim(),
      tanggalDiberikan: form.tanggalDiberikan || todayISO(),
      tenggat: form.tenggat || todayISO(),
      prioritas: form.prioritas,
      estimasiMenit: Math.max(0, Math.round(Number(form.estimasiMenit) || 0)),
      catatan: form.catatan.trim(),
    };
    mutate((d) => {
      if (editId) {
        const lama = d.pr.find((x) => x.id === editId);
        if (lama) Object.assign(lama, nilai);
      } else {
        d.pr.push({ id: idBaru(), ...nilai, status: "belum" });
      }
    });
    toast.success(editId ? "PR diperbarui." : "PR ditambahkan. Semangat!");
    setForm(null);
    setEditId(null);
  };

  const hitung = {
    belum: data.pr.filter((t) => t.status === "belum").length,
    dikerjakan: data.pr.filter((t) => t.status === "dikerjakan").length,
    selesai: data.pr.filter((t) => t.status === "selesai").length,
  };

  return (
    <div className="space-y-4">
      <Segmented options={OPSI_FILTER.map((o) => ({ ...o }))} value={filter} onChange={setFilter} />

      {hitung.selesai > 0 && (
        <Card className="bg-success/10 p-3.5">
          <p className="text-sm font-bold text-success-foreground">
            {hitung.selesai} PR sudah selesai{hitung.belum + hitung.dikerjakan > 0 ? `, sisa ${hitung.belum + hitung.dikerjakan} lagi` : " — semua beres!"}
          </p>
        </Card>
      )}

      <div className="space-y-2">
        {daftar.length === 0 ? (
          <EmptyState
            icon={<Plus className="h-6 w-6" />}
            judul={filter === "semua" ? "Belum ada PR" : "Tidak ada PR di kategori ini"}
            deskripsi="Catat PR-mu di sini supaya tidak ada yang terlewat."
            aksi={
              <Button variant="soft" size="sm" onClick={() => { setEditId(null); setForm(formKosong()); }}>
                <Plus className="h-4 w-4" /> Tambah PR
              </Button>
            }
          />
        ) : (
          daftar.map((t) => (
            <Card key={t.id} className={`border-l-4 p-3.5 ${GARIS_PRIORITAS[t.prioritas]}`}>
              <div className="flex items-start gap-3">
                <button onClick={() => siklusStatus(t)} className="mt-0.5 shrink-0" aria-label="Ubah status">
                  {ikonStatus(t.status)}
                </button>
                <div className="min-w-0 flex-1" onClick={() => bukaEdit(t)}>
                  <p className={`truncate font-bold ${t.status === "selesai" ? "text-muted-foreground line-through" : ""}`}>{t.judul}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {t.mapel || "Tanpa mapel"}
                    {t.estimasiMenit > 0 ? ` · ±${t.estimasiMenit} menit` : ""}
                  </p>
                  {t.status !== "selesai" && (
                    <div className="mt-2">
                      <Pill tone={nadaTenggat(t.tenggat)}>{labelTenggat(t.tenggat)}</Pill>
                    </div>
                  )}
                </div>
                <button onClick={() => setHapusId(t.id)} className="shrink-0 rounded-xl p-1.5 text-muted-foreground hover:bg-muted" aria-label="Hapus PR">
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              </div>
              {t.deskripsi && <p className="mt-2 line-clamp-2 pl-9 text-sm text-muted-foreground">{t.deskripsi}</p>}
            </Card>
          ))
        )}
      </div>

      {/* Tombol tambah melayang */}
      {daftar.length > 0 && (
        <Button size="lg" className="w-full" onClick={() => { setEditId(null); setForm(formKosong()); }}>
          <Plus className="h-5 w-5" /> Tambah PR
        </Button>
      )}

      {/* Modal tambah/ubah */}
      <Modal open={form !== null} onClose={() => setForm(null)} title={editId ? "Ubah PR" : "Tambah PR"}>
        {form && (
          <div className="space-y-4">
            <Field label="Judul PR">
              <Input value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} placeholder="Misalnya: Soal halaman 45" maxLength={60} />
            </Field>
            <Field label="Mata pelajaran">
              <Input value={form.mapel} onChange={(e) => setForm({ ...form, mapel: e.target.value })} list="mapel-pr" placeholder="Misalnya: Matematika" maxLength={30} />
              <datalist id="mapel-pr">
                {daftarMapel(data).map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </Field>
            <Field label="Detail soal / instruksi (boleh kosong)">
              <Textarea value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} placeholder="Tulis detailnya di sini…" maxLength={500} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tenggat">
                <Input type="date" value={form.tenggat} onChange={(e) => setForm({ ...form, tenggat: e.target.value })} />
              </Field>
              <Field label="Prioritas">
                <Select value={form.prioritas} onChange={(e) => setForm({ ...form, prioritas: e.target.value as Prioritas })}>
                  <option value="rendah">Rendah</option>
                  <option value="sedang">Sedang</option>
                  <option value="tinggi">Tinggi</option>
                </Select>
              </Field>
            </div>
            <Field label="Estimasi waktu (menit)">
              <Input type="number" min={0} max={600} value={form.estimasiMenit} onChange={(e) => setForm({ ...form, estimasiMenit: e.target.value })} />
            </Field>
            <Field label="Catatan tambahan (boleh kosong)">
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
        title="Hapus PR ini?"
        description="PR yang dihapus tidak bisa dikembalikan."
        onConfirm={() => {
          if (!hapusId) return;
          mutate((d) => {
            d.pr = d.pr.filter((x) => x.id !== hapusId);
          });
          toast.success("PR dihapus.");
        }}
        onClose={() => setHapusId(null)}
      />
    </div>
  );
}
