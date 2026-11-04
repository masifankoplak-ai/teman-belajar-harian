// Catatan Belajar: ringkasan pelajaran, rumus, dan catatan bebas yang bisa disematkan.

import { useState } from "react";
import { NotebookPen, Pencil, Pin, PinOff, Plus, Search, Trash2 } from "lucide-react";
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
  Segmented,
  Select,
  Textarea,
} from "@/components/ui/kit";
import { daftarMapel, idBaru, mutate, useAppData } from "@/lib/store";
import type { Catatan, JenisCatatan } from "@/lib/types";

const JENIS: JenisCatatan[] = ["Ringkasan", "Rumus", "Definisi", "Penting", "Bebas"];

const OPSI_JENIS = [
  { value: "semua", label: "Semua" },
  ...JENIS.map((j) => ({ value: j, label: j })),
] as const;
type Filter = (typeof OPSI_JENIS)[number]["value"];

type FormCatatan = { judul: string; isi: string; mapel: string; jenis: JenisCatatan };

const formKosong = (): FormCatatan => ({ judul: "", isi: "", mapel: "", jenis: "Ringkasan" });

export function HalamanCatatan() {
  const data = useAppData();
  const [cari, setCari] = useState("");
  const [filter, setFilter] = useState<Filter>("semua");
  const [form, setForm] = useState<FormCatatan | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [hapusId, setHapusId] = useState<string | null>(null);

  const kunci = cari.trim().toLowerCase();
  const daftar = data.catatan
    .filter((c) => filter === "semua" || c.jenis === filter)
    .filter((c) => !kunci || `${c.judul} ${c.isi} ${c.mapel}`.toLowerCase().includes(kunci))
    .sort((a, b) => {
      if (a.dipin !== b.dipin) return a.dipin ? -1 : 1;
      return b.diperbarui.localeCompare(a.diperbarui);
    });

  const sematkan = (c: Catatan) => {
    mutate((d) => {
      const item = d.catatan.find((x) => x.id === c.id);
      if (item) item.dipin = !item.dipin;
    });
    toast.success(c.dipin ? "Sematan dilepas." : "Catatan disematkan di atas.");
  };

  const bukaEdit = (c: Catatan) => {
    setEditId(c.id);
    setForm({ judul: c.judul, isi: c.isi, mapel: c.mapel, jenis: c.jenis });
  };

  const simpan = () => {
    if (!form) return;
    if (!form.judul.trim() && !form.isi.trim()) {
      toast.error("Isi dulu judul atau isinya ya!");
      return;
    }
    mutate((d) => {
      if (editId) {
        const lama = d.catatan.find((x) => x.id === editId);
        if (lama) Object.assign(lama, { judul: form.judul.trim() || "Tanpa judul", isi: form.isi, mapel: form.mapel.trim(), jenis: form.jenis, diperbarui: new Date().toISOString() });
      } else {
        d.catatan.push({
          id: idBaru(),
          judul: form.judul.trim() || "Tanpa judul",
          isi: form.isi,
          mapel: form.mapel.trim(),
          jenis: form.jenis,
          dipin: false,
          diperbarui: new Date().toISOString(),
        });
      }
    });
    toast.success(editId ? "Catatan diperbarui." : "Catatan disimpan!");
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
        Catatan Belajar
      </SectionTitle>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari catatan…" className="pl-10" />
      </div>

      <Segmented options={OPSI_JENIS.map((o) => ({ ...o }))} value={filter} onChange={setFilter} />

      <div className="space-y-3">
        {daftar.length === 0 ? (
          <EmptyState
            icon={<NotebookPen className="h-6 w-6" />}
            judul={data.catatan.length === 0 ? "Belum ada catatan" : "Catatan tidak ditemukan"}
            deskripsi="Tulis ringkasan pelajaran, rumus, atau hal penting agar mudah dibaca ulang."
            aksi={
              <Button variant="soft" size="sm" onClick={() => { setEditId(null); setForm(formKosong()); }}>
                <Plus className="h-4 w-4" /> Tulis Catatan
              </Button>
            }
          />
        ) : (
          daftar.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1" onClick={() => bukaEdit(c)}>
                  <p className="truncate font-bold">{c.judul}</p>
                  {c.mapel && <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.mapel}</p>}
                </div>
                <button onClick={() => sematkan(c)} className="shrink-0 rounded-xl p-1.5 hover:bg-muted" aria-label={c.dipin ? "Lepas sematan" : "Sematkan catatan"}>
                  {c.dipin ? <PinOff className="h-4.5 w-4.5 text-primary" /> : <Pin className="h-4.5 w-4.5 text-muted-foreground" />}
                </button>
                <button onClick={() => setHapusId(c.id)} className="shrink-0 rounded-xl p-1.5 text-muted-foreground hover:bg-muted" aria-label="Hapus catatan">
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              </div>
              {c.isi && <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">{c.isi}</p>}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <Pill tone="primary">{c.jenis}</Pill>
                {c.dipin && <Pill tone="warning">Disematkan</Pill>}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal tambah/ubah */}
      <Modal open={form !== null} onClose={() => setForm(null)} title={editId ? "Ubah Catatan" : "Catatan Baru"}>
        {form && (
          <div className="space-y-4">
            <Field label="Judul (boleh dikosongkan)">
              <Input value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} placeholder="Misalnya: Rumus Luas Bangun" maxLength={60} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Jenis">
                <Select value={form.jenis} onChange={(e) => setForm({ ...form, jenis: e.target.value as JenisCatatan })}>
                  {JENIS.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Mata pelajaran">
                <Input value={form.mapel} onChange={(e) => setForm({ ...form, mapel: e.target.value })} list="mapel-catatan" placeholder="Misalnya: Matematika" maxLength={30} />
                <datalist id="mapel-catatan">
                  {daftarMapel(data).map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </Field>
            </div>
            <Field label="Isi catatan">
              <Textarea value={form.isi} onChange={(e) => setForm({ ...form, isi: e.target.value })} placeholder="Tulis catatanmu di sini…" className="min-h-36" maxLength={2000} />
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
        title="Hapus catatan ini?"
        description="Catatan yang dihapus tidak bisa dikembalikan."
        onConfirm={() => {
          if (!hapusId) return;
          mutate((d) => {
            d.catatan = d.catatan.filter((x) => x.id !== hapusId);
          });
          toast.success("Catatan dihapus.");
        }}
        onClose={() => setHapusId(null)}
      />
    </div>
  );
}
