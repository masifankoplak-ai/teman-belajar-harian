// Jadwal Pelajaran: daftar per hari, tambah/ubah/hapus, dan detail per mata pelajaran.

import { useState } from "react";
import { ArrowLeft, BookOpen, ClipboardList, NotebookPen, Pencil, Plus, Trash2 } from "lucide-react";
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
} from "@/components/ui/kit";
import { NAMA_HARI, formatTanggalPendek, indeksHariISO, labelHitungMundur, labelTenggat, menitDariJam, todayISO } from "@/lib/dates";
import { navigate } from "@/lib/router";
import { PALET_WARNA, daftarMapel, idBaru, mutate, useAppData, warnaMapel } from "@/lib/store";
import type { JadwalItem } from "@/lib/types";

type FormJadwal = {
  hari: string;
  mapel: string;
  guru: string;
  ruang: string;
  jamMulai: string;
  jamSelesai: string;
  warna: string;
};

const formKosong = (): FormJadwal => ({
  hari: "0",
  mapel: "",
  guru: "",
  ruang: "",
  jamMulai: "07:00",
  jamSelesai: "08:00",
  warna: PALET_WARNA[0] ?? "#367FC4",
});

export function HalamanJadwal({ mapelId }: { mapelId?: string }) {
  const data = useAppData();
  if (mapelId) return <DetailMapel mapelId={mapelId} />;
  return <DaftarJadwal />;
}

function DaftarJadwal() {
  const data = useAppData();
  const hariIni = indeksHariISO(todayISO());
  const [form, setForm] = useState<FormJadwal | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [hapusId, setHapusId] = useState<string | null>(null);

  const bukaBaru = () => {
    setEditId(null);
    setForm({ ...formKosong(), warna: warnaMapel(data, "") });
  };

  const bukaEdit = (j: JadwalItem) => {
    setEditId(j.id);
    setForm({
      hari: String(j.hari),
      mapel: j.mapel,
      guru: j.guru,
      ruang: j.ruang,
      jamMulai: j.jamMulai,
      jamSelesai: j.jamSelesai,
      warna: j.warna,
    });
  };

  const simpan = () => {
    if (!form) return;
    if (!form.mapel.trim()) {
      toast.error("Nama mata pelajaran belum diisi.");
      return;
    }
    if (menitDariJam(form.jamSelesai) <= menitDariJam(form.jamMulai)) {
      toast.error("Jam selesai harus setelah jam mulai.");
      return;
    }
    const nilai = {
      hari: Number(form.hari),
      mapel: form.mapel.trim(),
      guru: form.guru.trim(),
      ruang: form.ruang.trim(),
      jamMulai: form.jamMulai,
      jamSelesai: form.jamSelesai,
      warna: form.warna,
    };
    mutate((d) => {
      const lama = editId ? d.jadwal.find((x) => x.id === editId) : undefined;
      if (editId && lama) Object.assign(lama, nilai);
      else d.jadwal.push({ id: idBaru(), ...nilai });
      d.jadwal.sort((a, b) => a.hari - b.hari || menitDariJam(a.jamMulai) - menitDariJam(b.jamMulai));
    });
    toast.success(editId ? "Jadwal diperbarui." : "Jadwal ditambahkan!");
    setForm(null);
    setEditId(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Ketuk jadwal untuk mengubahnya.</p>
        <Button size="sm" onClick={bukaBaru}>
          <Plus className="h-4 w-4" /> Tambah
        </Button>
      </div>

      {data.jadwal.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          judul="Jadwal masih kosong"
          deskripsi="Isi jadwal pelajaranmu supaya aplikasi bisa mengingatkan pelajaran berikutnya."
          aksi={
            <Button variant="soft" size="sm" onClick={bukaBaru}>
              <Plus className="h-4 w-4" /> Isi Jadwal
            </Button>
          }
        />
      ) : (
        NAMA_HARI.map((nama, hari) => {
          const items = data.jadwal.filter((j) => j.hari === hari);
          if (items.length === 0) return null;
          return (
            <section key={nama}>
              <SectionTitle
                aksi={
                  hari === hariIni ? (
                    <Pill tone="primary">Hari ini</Pill>
                  ) : undefined
                }
              >
                {nama}
              </SectionTitle>
              <div className="space-y-2">
                {items.map((j) => (
                  <Card key={j.id} className="flex items-center gap-3 p-3" onClick={() => bukaEdit(j)}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/mapel/${j.id}`);
                      }}
                      className="h-10 w-10 shrink-0 rounded-2xl text-xs font-bold text-white"
                      style={{ backgroundColor: j.warna }}
                      aria-label={`Detail ${j.mapel}`}
                    >
                      {j.mapel.slice(0, 2).toUpperCase()}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{j.mapel}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {j.jamMulai}–{j.jamSelesai}
                        {j.guru ? ` · ${j.guru}` : ""}
                        {j.ruang ? ` · ${j.ruang}` : ""}
                      </p>
                    </div>
                    <Pill tone="secondary" className="shrink-0">{j.jamMulai}</Pill>
                  </Card>
                ))}
              </div>
            </section>
          );
        })
      )}

      {/* Modal tambah/ubah */}
      <Modal open={form !== null} onClose={() => setForm(null)} title={editId ? "Ubah Jadwal" : "Tambah Jadwal"}>
        {form && (
          <div className="space-y-4">
            <Field label="Mata pelajaran">
              <Input value={form.mapel} onChange={(e) => setForm({ ...form, mapel: e.target.value })} list="mapel-jadwal" placeholder="Misalnya: Matematika" maxLength={30} />
              <datalist id="mapel-jadwal">
                {daftarMapel(data).map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Hari">
                <Select value={form.hari} onChange={(e) => setForm({ ...form, hari: e.target.value })}>
                  {NAMA_HARI.map((n, i) => (
                    <option key={n} value={i}>{n}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Ruang (boleh kosong)">
                <Input value={form.ruang} onChange={(e) => setForm({ ...form, ruang: e.target.value })} placeholder="Misalnya: 7B" maxLength={15} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Jam mulai">
                <Input type="time" value={form.jamMulai} onChange={(e) => setForm({ ...form, jamMulai: e.target.value })} />
              </Field>
              <Field label="Jam selesai">
                <Input type="time" value={form.jamSelesai} onChange={(e) => setForm({ ...form, jamSelesai: e.target.value })} />
              </Field>
            </div>
            <Field label="Nama guru (boleh kosong)">
              <Input value={form.guru} onChange={(e) => setForm({ ...form, guru: e.target.value })} placeholder="Misalnya: Pak Budi" maxLength={30} />
            </Field>
            <Field label="Warna">
              <div className="flex flex-wrap gap-2">
                {PALET_WARNA.map((w) => (
                  <button
                    key={w}
                    onClick={() => setForm({ ...form, warna: w })}
                    className={`h-9 w-9 rounded-2xl transition-transform ${form.warna === w ? "scale-110 ring-2 ring-foreground/50 ring-offset-2 ring-offset-card" : ""}`}
                    style={{ backgroundColor: w }}
                    aria-label={`Warna ${w}`}
                  />
                ))}
              </div>
            </Field>
            <div className="flex gap-2 pt-1">
              {editId && (
                <Button variant="danger" size="md" onClick={() => setHapusId(editId)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
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
        title="Hapus jadwal ini?"
        description="Jadwal pelajaran ini akan dihapus dari daftar."
        onConfirm={() => {
          if (!hapusId) return;
          mutate((d) => {
            d.jadwal = d.jadwal.filter((x) => x.id !== hapusId);
          });
          setForm(null);
          setEditId(null);
          toast.success("Jadwal dihapus.");
        }}
        onClose={() => setHapusId(null)}
      />
    </div>
  );
}

function DetailMapel({ mapelId }: { mapelId: string }) {
  const data = useAppData();
  const item = data.jadwal.find((j) => j.id === mapelId);
  const mapel = item?.mapel ?? "";

  const jadwalMapel = data.jadwal
    .filter((j) => j.mapel.toLowerCase() === mapel.toLowerCase())
    .sort((a, b) => a.hari - b.hari || menitDariJam(a.jamMulai) - menitDariJam(b.jamMulai));
  const prMapel = data.pr
    .filter((t) => t.mapel.toLowerCase() === mapel.toLowerCase() && t.status !== "selesai")
    .sort((a, b) => a.tenggat.localeCompare(b.tenggat));
  const ujianMapel = data.ujian
    .filter((u) => u.mapel.toLowerCase() === mapel.toLowerCase())
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  const catatanMapel = data.catatan.filter((c) => c.mapel.toLowerCase() === mapel.toLowerCase());
  const proyekMapel = data.proyek.filter((p) => p.mapel.toLowerCase() === mapel.toLowerCase() && p.status !== "selesai");

  return (
    <div className="space-y-5">
      <button onClick={() => navigate("/jadwal")} className="flex items-center gap-1.5 text-sm font-bold text-primary">
        <ArrowLeft className="h-4 w-4" /> Kembali ke jadwal
      </button>

      <Card className="p-4" >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-base font-bold text-white" style={{ backgroundColor: warnaMapel(data, mapel) }}>
            {mapel.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="truncate font-display text-xl font-bold">{mapel || "Mata Pelajaran"}</h2>
            <p className="text-sm text-muted-foreground">
              {jadwalMapel.length} sesi per minggu{item?.guru ? ` · ${item.guru}` : ""}
            </p>
          </div>
        </div>
      </Card>

      <section>
        <SectionTitle>Jam Pelajaran</SectionTitle>
        <div className="space-y-2">
          {jadwalMapel.map((j) => (
            <Card key={j.id} className="flex items-center gap-3 p-3">
              <div className="h-9 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: j.warna }} />
              <div className="min-w-0 flex-1">
                <p className="font-bold">{NAMA_HARI[j.hari] ?? "-"}</p>
                <p className="text-xs text-muted-foreground">
                  {j.jamMulai}–{j.jamSelesai}
                  {j.ruang ? ` · ${j.ruang}` : ""}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle aksi={<button onClick={() => navigate("/tugas")} className="text-sm font-bold text-primary">Semua PR</button>}>
          <span className="flex items-center gap-1.5"><ClipboardList className="h-4.5 w-4.5" /> PR {mapel}</span>
        </SectionTitle>
        {prMapel.length === 0 ? (
          <p className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">Tidak ada PR yang belum selesai.</p>
        ) : (
          <div className="space-y-2">
            {prMapel.map((t) => (
              <Card key={t.id} className="flex items-center gap-3 p-3" onClick={() => navigate("/tugas")}>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{t.judul}</p>
                  <p className="text-xs text-muted-foreground">{labelTenggat(t.tenggat)}</p>
                </div>
                <Pill tone={labelTenggat(t.tenggat).startsWith("Terlambat") ? "danger" : "secondary"}>{labelTenggat(t.tenggat)}</Pill>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle aksi={<button onClick={() => navigate("/ujian")} className="text-sm font-bold text-primary">Semua ujian</button>}>
          <span className="flex items-center gap-1.5"><NotebookPen className="h-4.5 w-4.5" /> Ulangan & Ujian</span>
        </SectionTitle>
        {ujianMapel.length === 0 ? (
          <p className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">Belum ada ulangan atau ujian untuk mapel ini.</p>
        ) : (
          <div className="space-y-2">
            {ujianMapel.map((u) => (
              <Card key={u.id} className="flex items-center gap-3 p-3" onClick={() => navigate("/ujian")}>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{u.nama}</p>
                  <p className="text-xs text-muted-foreground">{formatTanggalPendek(u.tanggal)} · {u.jam}</p>
                </div>
                <Pill tone="primary">{labelHitungMundur(u.tanggal)}</Pill>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle aksi={<button onClick={() => navigate("/catatan")} className="text-sm font-bold text-primary">Semua catatan</button>}>
          Catatan
        </SectionTitle>
        {catatanMapel.length === 0 ? (
          <p className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">Belum ada catatan untuk mapel ini.</p>
        ) : (
          <div className="space-y-2">
            {catatanMapel.map((c) => (
              <Card key={c.id} className="p-3" onClick={() => navigate("/catatan")}>
                <p className="truncate font-bold">{c.judul}</p>
                <p className="truncate text-xs text-muted-foreground">{c.isi || c.jenis}</p>
              </Card>
            ))}
          </div>
        )}
      </section>

      {proyekMapel.length > 0 && (
        <section>
          <SectionTitle aksi={<button onClick={() => navigate("/proyek")} className="text-sm font-bold text-primary">Semua proyek</button>}>
            Proyek
          </SectionTitle>
          <div className="space-y-2">
            {proyekMapel.map((p) => (
              <Card key={p.id} className="flex items-center gap-3 p-3" onClick={() => navigate("/proyek")}>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{p.judul}</p>
                  <p className="text-xs text-muted-foreground">Tenggat {formatTanggalPendek(p.tenggat)}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
