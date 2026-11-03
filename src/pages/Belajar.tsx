// Target & Kebiasaan: kebiasaan harian/mingguan dengan strip 7 hari dan streak.

import { useState } from "react";
import { Flame, Pencil, Plus, Trash2 } from "lucide-react";
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
} from "@/components/ui/kit";
import { NAMA_HARI, hitungStreak, mingguBerisi, todayISO } from "@/lib/dates";
import { idBaru, mutate, useAppData } from "@/lib/store";
import type { Kebiasaan } from "@/lib/types";

const HURUF_HARI = ["S", "S", "R", "K", "J", "S", "M"];

type FormKebiasaan = { nama: string; jenis: "harian" | "mingguan"; targetPerMinggu: string };

const formKosong = (): FormKebiasaan => ({ nama: "", jenis: "harian", targetPerMinggu: "5" });

export function HalamanBelajar() {
  const data = useAppData();
  const hariIni = todayISO();
  const minggu = mingguBerici(hariIni);
  const [form, setForm] = useState<FormKebiasaan | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [hapusId, setHapusId] = useState<string | null>(null);

  const toggleHari = (k: Kebiasaan, tanggal: string) => {
    const sudah = k.riwayat.includes(tanggal);
    mutate((d) => {
      const item = d.kebiasaan.find((x) => x.id === k.id);
      if (!item) return;
      item.riwayat = sudah ? item.riwayat.filter((t) => t !== tanggal) : [...item.riwayat, tanggal];
    });
    if (!sudah) toast.success(`Mantap! "${k.nama}" ditandai.`);
  };

  const bukaEdit = (k: Kebiasaan) => {
    setEditId(k.id);
    setForm({ nama: k.nama, jenis: k.jenis, targetPerMinggu: String(k.targetPerMinggu) });
  };

  const simpan = () => {
    if (!form) return;
    if (!form.nama.trim()) {
      toast.error("Nama kebiasaan belum diisi.");
      return;
    }
    const nilai = {
      nama: form.nama.trim(),
      jenis: form.jenis,
      targetPerMinggu: Math.min(7, Math.max(1, Math.round(Number(form.targetPerMinggu) || 7))),
    };
    mutate((d) => {
      const lama = editId ? d.kebiasaan.find((x) => x.id === editId) : undefined;
      if (editId && lama) Object.assign(lama, nilai);
      else d.kebiasaan.push({ id: idBaru(), ...nilai, riwayat: [], bawaan: false });
    });
    toast.success(editId ? "Kebiasaan diperbarui." : "Kebiasaan baru ditambahkan!");
    setForm(null);
    setEditId(null);
  };

  const streakTerbaik = data.kebiasaan.reduce((maks, k) => Math.max(maks, hitungStreak(k.riwayat)), 0);

  return (
    <div className="space-y-4">
      <Card className="bg-sky-soft p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <p className="font-display text-lg font-bold text-primary">Streak terbaikmu: {streakTerbaik} hari</p>
            <p className="text-xs text-muted-foreground">Terus konsisten, jangan putus rantainya!</p>
          </div>
        </div>
      </Card>

      <SectionTitle aksi={<Button size="sm" variant="soft" onClick={() => { setEditId(null); setForm(formKosong()); }}><Plus className="h-4 w-4" /> Baru</Button>}>
        Kebiasaan Belajar
      </SectionTitle>

      {data.kebiasaan.length === 0 ? (
        <EmptyState
          icon={<Flame className="h-6 w-6" />}
          judul="Belum ada kebiasaan"
          deskripsi="Tambahkan kebiasaan belajar dan tandai setiap hari selesai."
        />
      ) : (
        <div className="space-y-3">
          {data.kebiasaan.map((k) => {
            const streak = hitungStreak(k.riwayat);
            const mingguIni = minggu.filter((t) => k.riwayat.includes(t)).length;
            const targetTepat = k.jenis === "mingguan" && mingguIni >= k.targetPerMinggu;
            return (
              <Card key={k.id} className="p-4">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{k.nama}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Pill tone="secondary">{k.jenis === "harian" ? "Harian" : `Mingguan · ${k.targetPerMinggu}×`}</Pill>
                      <Pill tone="warning">
                        <Flame className="h-3 w-3" /> {streak} hari
                      </Pill>
                      {targetTepat && <Pill tone="success">Target minggu ini tercapai!</Pill>}
                    </div>
                  </div>
                  <button onClick={() => bukaEdit(k)} className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted" aria-label="Ubah kebiasaan">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setHapusId(k.id)} className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted" aria-label="Hapus kebiasaan">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {k.jenis === "mingguan" && (
                  <div className="mt-3">
                    <Progress value={(mingguIni / k.targetPerMinggu) * 100} tone={targetTepat ? "success" : "primary"} />
                    <p className="mt-1 text-xs text-muted-foreground">{mingguIni} dari {k.targetPerMinggu}× minggu ini</p>
                  </div>
                )}

                <div className="mt-3 grid grid-cols-7 gap-1.5">
                  {minggu.map((t, i) => {
                    const sudah = k.riwayat.includes(t);
                    const masaDepan = t > hariIni;
                    return (
                      <button
                        key={t}
                        disabled={masaDepan}
                        onClick={() => toggleHari(k, t)}
                        className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-bold transition-all active:scale-95 disabled:opacity-40 ${
                          sudah ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
                        }`}
                        aria-label={`${NAMA_HARI[i] ?? ""} ${t}`}
                      >
                        <span>{HURUF_HARI[i] ?? ""}</span>
                        <span className={`h-1.5 w-1.5 rounded-full ${sudah ? "bg-white/80" : "bg-transparent"}`} />
                      </button>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal tambah/ubah */}
      <Modal open={form !== null} onClose={() => setForm(null)} title={editId ? "Ubah Kebiasaan" : "Kebiasaan Baru"}>
        {form && (
          <div className="space-y-4">
            <Field label="Nama kebiasaan">
              <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Misalnya: Membaca 20 menit" maxLength={40} />
            </Field>
            <Field label="Jenis">
              <Segmented
                options={[
                  { value: "harian", label: "Harian" },
                  { value: "mingguan", label: "Mingguan" },
                ]}
                value={form.jenis}
                onChange={(v) => setForm({ ...form, jenis: v })}
              />
            </Field>
            {form.jenis === "mingguan" && (
              <Field label="Target per minggu (1–7 kali)">
                <Input type="number" min={1} max={7} value={form.targetPerMinggu} onChange={(e) => setForm({ ...form, targetPerMinggu: e.target.value })} />
              </Field>
            )}
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
        title="Hapus kebiasaan ini?"
        description="Riwayat kebiasaan ini juga akan hilang."
        onConfirm={() => {
          if (!hapusId) return;
          mutate((d) => {
            d.kebiasaan = d.kebiasaan.filter((x) => x.id !== hapusId);
          });
          toast.success("Kebiasaan dihapus.");
        }}
        onClose={() => setHapusId(null)}
      />
    </div>
  );
}
