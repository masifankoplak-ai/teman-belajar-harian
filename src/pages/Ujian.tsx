// Ulangan & Ujian: jadwal ujian dengan hitung mundur dan ceklis persiapan.

import { useState } from "react";
import { CalendarDays, NotebookPen, Plus, Trash2 } from "lucide-react";
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
import { formatTanggal, labelHitungMundur, todayISO } from "@/lib/dates";
import { daftarMapel, idBaru, mutate, useAppData } from "@/lib/store";
import type { JenisUjian, Ujian } from "@/lib/types";

const JENIS: JenisUjian[] = ["Ulangan Harian", "UTS", "UAS", "Ujian Praktik", "Ujian Sekolah", "Lainnya"];

type FormUjian = {
  jenis: JenisUjian;
  nama: string;
  mapel: string;
  tanggal: string;
  jam: string;
  lokasi: string;
  materi: string;
  catatan: string;
};

const formKosong = (): FormUjian => ({
  jenis: "Ulangan Harian",
  nama: "",
  mapel: "",
  tanggal: todayISO(),
  jam: "07:00",
  lokasi: "",
  materi: "",
  catatan: "",
});

function nadaHitung(iso: string): "primary" | "warning" | "secondary" {
  const label = labelHitungMundur(iso);
  if (label === "Hari ini" || label === "Besok") return "warning";
  if (label.startsWith("Sudah lewat")) return "secondary";
  return "primary";
}

function KartuUjian({ u, onEdit, onHapus }: { u: Ujian; onEdit: (u: Ujian) => void; onHapus: (id: string) => void }) {
  const [teks, setTeks] = useState("");
  const selesai = u.persiapan.filter((c) => c.selesai).length;

  const toggle = (idItem: string) => {
    mutate((d) => {
      const item = d.ujian.find((x) => x.id === u.id);
      const c = item?.persiapan.find((x) => x.id === idItem);
      if (!item || !c) return;
      c.selesai = !c.selesai;
    });
  };

  const tambahItem = () => {
    if (!teks.trim()) return;
    mutate((d) => {
      const item = d.ujian.find((x) => x.id === u.id);
      item?.persiapan.push({ id: idBaru(), teks: teks.trim(), selesai: false });
    });
    setTeks("");
  };

  const hapusItem = (idItem: string) => {
    mutate((d) => {
      const item = d.ujian.find((x) => x.id === u.id);
      if (item) item.persiapan = item.persiapan.filter((x) => x.id !== idItem);
    });
  };

  return (
    <Card className="p-4">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{u.nama}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {u.mapel || u.jenis} · {formatTanggal(u.tanggal)}
            {u.jam ? ` · ${u.jam}` : ""}
            {u.lokasi ? ` · ${u.lokasi}` : ""}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Pill tone="secondary">{u.jenis}</Pill>
            <Pill tone={nadaHitung(u.tanggal)}>{labelHitungMundur(u.tanggal)}</Pill>
          </div>
        </div>
        <button onClick={() => onEdit(u)} className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted" aria-label="Ubah ujian">
          <NotebookPen className="h-4.5 w-4.5" />
        </button>
        <button onClick={() => onHapus(u.id)} className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted" aria-label="Hapus ujian">
          <Trash2 className="h-4.5 w-4.5" />
        </button>
      </div>

      {u.materi && <p className="mt-2 text-sm text-muted-foreground">{u.materi}</p>}

      {/* Ceklis persiapan */}
      <div className="mt-3 rounded-2xl bg-muted/60 p-3">
        <p className="mb-2 text-xs font-bold text-muted-foreground">
          Persiapan {u.persiapan.length > 0 ? `· ${selesai}/${u.persiapan.length}` : ""}
        </p>
        {u.persiapan.length > 0 && (
          <div className="space-y-1">
            {u.persiapan.map((c) => (
              <button key={c.id} onClick={() => toggle(c.id)} className="flex w-full items-center gap-2 rounded-xl px-1 py-1 text-left text-sm hover:bg-muted">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${c.selesai ? "border-success bg-success text-white" : "border-border bg-card"}`}>
                  {c.selesai && <span className="text-[10px] font-black">✓</span>}
                </span>
                <span className={c.selesai ? "text-muted-foreground line-through" : ""}>{c.teks}</span>
              </button>
            ))}
          </div>
        )}
        <div className="mt-2 flex gap-2">
          <Input
            value={teks}
            onChange={(e) => setTeks(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && tambahItem()}
            placeholder="Tambah langkah persiapan…"
            maxLength={60}
            className="py-2 text-xs"
          />
          <Button variant="soft" size="sm" onClick={tambahItem} aria-label="Tambah persiapan" className="shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {u.catatan && <p className="mt-2 text-xs text-muted-foreground">{u.catatan}</p>}
    </Card>
  );
}

export function HalamanUjian() {
  const data = useAppData();
  const hariIni = todayISO();
  const [form, setForm] = useState<FormUjian | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [hapusId, setHapusId] = useState<string | null>(null);

  // Yang akan datang dulu, lalu yang sudah lewat.
  const daftar = [...data.ujian].sort((a, b) => {
    const na = a.tanggal < hariIni ? 1 : 0;
    const nb = b.tanggal < hariIni ? 1 : 0;
    return na - nb || a.tanggal.localeCompare(b.tanggal) || a.jam.localeCompare(b.jam);
  });

  const bukaEdit = (u: Ujian) => {
    setEditId(u.id);
    setForm({
      jenis: u.jenis,
      nama: u.nama,
      mapel: u.mapel,
      tanggal: u.tanggal,
      jam: u.jam,
      lokasi: u.lokasi,
      materi: u.materi,
      catatan: u.catatan,
    });
  };

  const simpan = () => {
    if (!form) return;
    if (!form.nama.trim()) {
      toast.error("Nama ujian belum diisi.");
      return;
    }
    const nilai = {
      jenis: form.jenis,
      nama: form.nama.trim(),
      mapel: form.mapel.trim(),
      tanggal: form.tanggal || todayISO(),
      jam: form.jam,
      lokasi: form.lokasi.trim(),
      materi: form.materi.trim(),
      catatan: form.catatan.trim(),
    };
    mutate((d) => {
      if (editId) {
        const lama = d.ujian.find((x) => x.id === editId);
        if (lama) Object.assign(lama, nilai);
      } else {
        d.ujian.push({ id: idBaru(), ...nilai, persiapan: [] });
      }
    });
    toast.success(editId ? "Ujian diperbarui." : "Ujian ditambahkan. Siap-siap ya!");
    setForm(null);
    setEditId(null);
  };

  const mendatang = daftar.filter((u) => u.tanggal >= hariIni).length;

  return (
    <div className="space-y-4">
      <SectionTitle
        aksi={
          <Button size="sm" variant="soft" onClick={() => { setEditId(null); setForm(formKosong()); }}>
            <Plus className="h-4 w-4" /> Baru
          </Button>
        }
      >
        Ulangan & Ujian
      </SectionTitle>

      {mendatang > 0 && (
        <Card className="bg-sky-soft p-3.5">
          <p className="text-sm font-bold text-primary">{mendatang} ujian mendatang. Siapkan materinya sedikit demi sedikit!</p>
        </Card>
      )}

      <div className="space-y-3">
        {daftar.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-6 w-6" />}
            judul="Belum ada jadwal ujian"
            deskripsi="Catat ulangan dan ujianmu di sini beserta checklist persiapannya."
            aksi={
              <Button variant="soft" size="sm" onClick={() => { setEditId(null); setForm(formKosong()); }}>
                <Plus className="h-4 w-4" /> Tambah Ujian
              </Button>
            }
          />
        ) : (
          daftar.map((u) => <KartuUjian key={u.id} u={u} onEdit={bukaEdit} onHapus={setHapusId} />)
        )}
      </div>

      {/* Modal tambah/ubah */}
      <Modal open={form !== null} onClose={() => setForm(null)} title={editId ? "Ubah Ujian" : "Tambah Ujian"}>
        {form && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Jenis">
                <Select value={form.jenis} onChange={(e) => setForm({ ...form, jenis: e.target.value as JenisUjian })}>
                  {JENIS.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Mata pelajaran">
                <Input value={form.mapel} onChange={(e) => setForm({ ...form, mapel: e.target.value })} list="mapel-ujian" placeholder="Misalnya: IPA" maxLength={30} />
                <datalist id="mapel-ujian">
                  {daftarMapel(data).map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </Field>
            </div>
            <Field label="Nama ujian">
              <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Misalnya: Ulangan Bab 3" maxLength={60} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tanggal">
                <Input type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
              </Field>
              <Field label="Jam">
                <Input type="time" value={form.jam} onChange={(e) => setForm({ ...form, jam: e.target.value })} />
              </Field>
            </div>
            <Field label="Tempat (boleh kosong)">
              <Input value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} placeholder="Misalnya: Ruang 7B" maxLength={40} />
            </Field>
            <Field label="Materi yang diujikan">
              <Textarea value={form.materi} onChange={(e) => setForm({ ...form, materi: e.target.value })} placeholder="Misalnya: Sistem tata surya halaman 30–40" maxLength={300} />
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
        title="Hapus ujian ini?"
        description="Ceklis persiapannya juga akan hilang."
        onConfirm={() => {
          if (!hapusId) return;
          mutate((d) => {
            d.ujian = d.ujian.filter((x) => x.id !== hapusId);
          });
          toast.success("Ujian dihapus.");
        }}
        onClose={() => setHapusId(null)}
      />
    </div>
  );
}
