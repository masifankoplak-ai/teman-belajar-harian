// Tugas & Proyek: proyek jangka panjang dengan tahapan ceklis dan progres.

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
  Progress,
  SectionTitle,
  Segmented,
  Select,
  Textarea,
} from "@/components/ui/kit";
import { labelTenggat, todayISO } from "@/lib/dates";
import { daftarMapel, idBaru, mutate, useAppData } from "@/lib/store";
import type { Prioritas, Proyek, StatusPR } from "@/lib/types";

const KATEGORI = ["Tugas Kelompok", "Proyek P5", "PR Besar", "Lomba", "Lainnya"];

const OPSI_FILTER = [
  { value: "semua", label: "Semua" },
  { value: "belum", label: "Belum" },
  { value: "dikerjakan", label: "Dikerjakan" },
  { value: "selesai", label: "Selesai" },
] as const;
type Filter = (typeof OPSI_FILTER)[number]["value"];

type FormProyek = {
  judul: string;
  deskripsi: string;
  kategori: string;
  mapel: string;
  tanggalMulai: string;
  tenggat: string;
  prioritas: Prioritas;
  catatan: string;
};

const formKosong = (): FormProyek => ({
  judul: "",
  deskripsi: "",
  kategori: "Tugas Kelompok",
  mapel: "",
  tanggalMulai: todayISO(),
  tenggat: todayISO(),
  prioritas: "sedang",
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

export function HalamanProyek() {
  const data = useAppData();
  const [filter, setFilter] = useState<Filter>("semua");
  const [form, setForm] = useState<FormProyek | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [hapusId, setHapusId] = useState<string | null>(null);
  const [teksBaru, setTeksBaru] = useState<Record<string, string>>({});

  const daftar = data.proyek
    .filter((p) => filter === "semua" || p.status === filter)
    .sort((a, b) => {
      if (a.status === "selesai" && b.status !== "selesai") return 1;
      if (b.status === "selesai" && a.status !== "selesai") return -1;
      return a.tenggat.localeCompare(b.tenggat);
    });

  const siklusStatus = (p: Proyek) => {
    const urutan: StatusPR[] = ["belum", "dikerjakan", "selesai"];
    const berikut = urutan[(urutan.indexOf(p.status) + 1) % urutan.length] ?? "belum";
    mutate((d) => {
      const item = d.proyek.find((x) => x.id === p.id);
      if (!item) return;
      item.status = berikut;
      if (berikut === "selesai" && !item.selesaiPada) item.selesaiPada = new Date().toISOString();
      if (berikut !== "selesai") delete item.selesaiPada;
    });
    if (berikut === "selesai") toast.success(`Kerja bagus! "${p.judul}" selesai 🎉`);
  };

  const toggleTahap = (p: Proyek, idTahap: string) => {
    mutate((d) => {
      const item = d.proyek.find((x) => x.id === p.id);
      const c = item?.tahapan.find((x) => x.id === idTahap);
      if (!item || !c) return;
      c.selesai = !c.selesai;
    });
  };

  const tambahTahap = (p: Proyek) => {
    const teks = (teksBaru[p.id] ?? "").trim();
    if (!teks) return;
    mutate((d) => {
      const item = d.proyek.find((x) => x.id === p.id);
      item?.tahapan.push({ id: idBaru(), teks, selesai: false });
    });
    setTeksBaru((t) => ({ ...t, [p.id]: "" }));
  };

  const hapusTahap = (p: Proyek, idTahap: string) => {
    mutate((d) => {
      const item = d.proyek.find((x) => x.id === p.id);
      if (item) item.tahapan = item.tahapan.filter((x) => x.id !== idTahap);
    });
  };

  const bukaEdit = (p: Proyek) => {
    setEditId(p.id);
    setForm({
      judul: p.judul,
      deskripsi: p.deskripsi,
      kategori: p.kategori,
      mapel: p.mapel,
      tanggalMulai: p.tanggalMulai,
      tenggat: p.tenggat,
      prioritas: p.prioritas,
      catatan: p.catatan,
    });
  };

  const simpan = () => {
    if (!form) return;
    if (!form.judul.trim()) {
      toast.error("Judul proyek belum diisi.");
      return;
    }
    const nilai = {
      judul: form.judul.trim(),
      deskripsi: form.deskripsi.trim(),
      kategori: form.kategori,
      mapel: form.mapel.trim(),
      tanggalMulai: form.tanggalMulai || todayISO(),
      tenggat: form.tenggat || todayISO(),
      prioritas: form.prioritas,
      catatan: form.catatan.trim(),
    };
    mutate((d) => {
      if (editId) {
        const lama = d.proyek.find((x) => x.id === editId);
        if (lama) Object.assign(lama, nilai);
      } else {
        d.proyek.push({ id: idBaru(), ...nilai, status: "belum", tahapan: [] });
      }
    });
    toast.success(editId ? "Proyek diperbarui." : "Proyek ditambahkan!");
    setForm(null);
    setEditId(null);
  };

  return (
    <div className="space-y-4">
      <SectionTitle
        aksi={
          <Button size="sm" variant="soft" onClick={() => { setEditId(null); setForm(formKosong()); }}>
            <Plus className="h-4 w-4" /> Baru
          </Button>
        }
      >
        Tugas & Proyek
      </SectionTitle>

      <Segmented options={OPSI_FILTER.map((o) => ({ ...o }))} value={filter} onChange={setFilter} />

      <div className="space-y-3">
        {daftar.length === 0 ? (
          <EmptyState
            icon={<Plus className="h-6 w-6" />}
            judul={data.proyek.length === 0 ? "Belum ada proyek" : "Tidak ada proyek di kategori ini"}
            deskripsi="Pecah tugas besar jadi tahapan kecil supaya lebih ringan dikerjakan."
            aksi={
              <Button variant="soft" size="sm" onClick={() => { setEditId(null); setForm(formKosong()); }}>
                <Plus className="h-4 w-4" /> Tambah Proyek
              </Button>
            }
          />
        ) : (
          daftar.map((p) => {
            const selesaiTahap = p.tahapan.filter((c) => c.selesai).length;
            const targetTepat = p.status === "selesai" || (p.tahapan.length > 0 && selesaiTahap === p.tahapan.length);
            return (
              <Card key={p.id} className={`border-l-4 p-4 ${GARIS_PRIORITAS[p.prioritas]}`}>
                <div className="flex items-start gap-3">
                  <button onClick={() => siklusStatus(p)} className="mt-0.5 shrink-0" aria-label="Ubah status">
                    {ikonStatus(p.status)}
                  </button>
                  <div className="min-w-0 flex-1" onClick={() => bukaEdit(p)}>
                    <p className={`truncate font-bold ${p.status === "selesai" ? "text-muted-foreground line-through" : ""}`}>{p.judul}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {p.mapel || p.kategori} · {p.kategori}
                    </p>
                    {p.status !== "selesai" && (
                      <div className="mt-2">
                        <Pill tone={nadaTenggat(p.tenggat)}>{labelTenggat(p.tenggat)}</Pill>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setHapusId(p.id)} className="shrink-0 rounded-xl p-1.5 text-muted-foreground hover:bg-muted" aria-label="Hapus proyek">
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>

                {p.deskripsi && <p className="mt-2 line-clamp-2 pl-9 text-sm text-muted-foreground">{p.deskripsi}</p>}

                {/* Progres tahapan */}
                {p.tahapan.length > 0 && (
                  <div className="mt-3 pl-9">
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-muted-foreground">Tahapan</span>
                      <span className="text-muted-foreground">
                        {selesaiTahap}/{p.tahapan.length} selesai
                      </span>
                    </div>
                    <Progress value={(selesaiTahap / p.tahapan.length) * 100} tone={targetTepat ? "success" : "primary"} />
                  </div>
                )}

                <div className="mt-2 space-y-1 pl-9">
                  {p.tahapan.map((c) => (
                    <div key={c.id} className="flex items-center gap-2">
                      <button
                        onClick={() => toggleTahap(p, c.id)}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${c.selesai ? "border-success bg-success text-white" : "border-border bg-card"}`}
                        aria-label="Tandai tahapan"
                      >
                        {c.selesai && <span className="text-[10px] font-black">✓</span>}
                      </button>
                      <span className={`flex-1 text-sm ${c.selesai ? "text-muted-foreground line-through" : ""}`}>{c.teks}</span>
                      <button onClick={() => hapusTahap(p, c.id)} className="rounded-lg p-1 text-muted-foreground/60 hover:bg-muted" aria-label="Hapus tahapan">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={teksBaru[p.id] ?? ""}
                      onChange={(e) => setTeksBaru((t) => ({ ...t, [p.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && tambahTahap(p)}
                      placeholder="Tambah tahapan…"
                      maxLength={60}
                      className="py-2 text-xs"
                    />
                    <Button variant="soft" size="sm" onClick={() => tambahTahap(p)} aria-label="Tambah tahapan" className="shrink-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal tambah/ubah */}
      <Modal open={form !== null} onClose={() => setForm(null)} title={editId ? "Ubah Proyek" : "Proyek Baru"} wide>
        {form && (
          <div className="space-y-4">
            <Field label="Judul proyek">
              <Input value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} placeholder="Misalnya: Poster Lingkungan Sekolah" maxLength={60} />
            </Field>
            <Field label="Deskripsi (boleh kosong)">
              <Textarea value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} maxLength={500} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Kategori">
                <Select value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })}>
                  {KATEGORI.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Mata pelajaran">
                <Input value={form.mapel} onChange={(e) => setForm({ ...form, mapel: e.target.value })} list="mapel-proyek" placeholder="Misalnya: IPS" maxLength={30} />
                <datalist id="mapel-proyek">
                  {daftarMapel(data).map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Mulai">
                <Input type="date" value={form.tanggalMulai} onChange={(e) => setForm({ ...form, tanggalMulai: e.target.value })} />
              </Field>
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
        title="Hapus proyek ini?"
        description="Tahapan yang sudah dibuat juga akan hilang."
        onConfirm={() => {
          if (!hapusId) return;
          mutate((d) => {
            d.proyek = d.proyek.filter((x) => x.id !== hapusId);
          });
          toast.success("Proyek dihapus.");
        }}
        onClose={() => setHapusId(null)}
      />
    </div>
  );
}
