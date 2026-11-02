// Onboarding: mengisi profil pelajar saat pertama kali membuka aplikasi.

import { useState } from "react";
import { GraduationCap, Sparkles } from "lucide-react";
import { toast } from "sonner";

import ilustrasi from "@/assets/ilustrasi-belajar.png";
import { Button, Field, Input, Select } from "@/components/ui/kit";
import { simpanProfil } from "@/lib/store";
import type { Jenjang } from "@/lib/types";

const JENJANG: Jenjang[] = ["SD", "SMP", "SMA", "SMK"];

export function Onboarding() {
  const [nama, setNama] = useState("");
  const [sekolah, setSekolah] = useState("");
  const [jenjang, setJenjang] = useState<Jenjang>("SMP");
  const [kelas, setKelas] = useState("7");
  const [tahunAjaran, setTahunAjaran] = useState(() => {
    const y = new Date().getFullYear();
    const m = new Date().getMonth();
    const awal = m >= 6 ? y : y - 1;
    return `${awal}/${awal + 1}`;
  });

  const simpan = () => {
    if (!nama.trim()) {
      toast.error("Isi dulu namamu ya!");
      return;
    }
    simpanProfil({
      nama: nama.trim(),
      sekolah: sekolah.trim(),
      jenjang,
      kelas: kelas.trim(),
      tahunAjaran: tahunAjaran.trim(),
    });
    toast.success(`Halo, ${nama.trim()}! Selamat belajar 👋`);
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col bg-background">
      <div className="flex items-center gap-3 px-5 pt-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
          <GraduationCap className="h-7 w-7" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">Teman Belajarku</h1>
          <p className="text-sm text-muted-foreground">Teman setia mengatur sekolahmu</p>
        </div>
      </div>

      <img
        src={ilustrasi}
        alt="Ilustrasi pelajar sedang belajar"
        width={1024}
        height={1024}
        className="mx-auto mt-4 w-64 rounded-3xl"
      />

      <div className="mt-2 flex-1 px-5 pb-10">
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-sky-soft px-4 py-3 text-sm font-bold text-primary dark:bg-secondary">
          <Sparkles className="h-4.5 w-4.5 shrink-0" />
          Kenalan dulu yuk! Isi profilmu supaya aplikasi bisa menyapamu setiap hari.
        </div>

        <div className="space-y-4">
          <Field label="Nama kamu">
            <Input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Misalnya: Rani" maxLength={30} />
          </Field>
          <Field label="Nama sekolah (boleh dikosongkan)">
            <Input value={sekolah} onChange={(e) => setSekolah(e.target.value)} placeholder="Misalnya: SMPN 1 Bandung" maxLength={40} />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Jenjang">
              <Select
                value={jenjang}
                onChange={(e) => {
                  const j = e.target.value as Jenjang;
                  setJenjang(j);
                  setKelas(j === "SD" ? "1" : j === "SMP" ? "7" : "10");
                }}
              >
                {JENJANG.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Kelas">
              <Input value={kelas} onChange={(e) => setKelas(e.target.value)} inputMode="numeric" maxLength={4} />
            </Field>
            <Field label="Tahun ajaran">
              <Input value={tahunAjaran} onChange={(e) => setTahunAjaran(e.target.value)} placeholder="2026/2027" maxLength={12} />
            </Field>
          </div>

          <Button size="lg" className="w-full text-base" onClick={simpan}>
            Mulai Belajar!
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Semua data disimpan di HP-mu, tanpa internet. 6 kebiasaan belajar bawaan sudah kami siapkan.
          </p>
        </div>
      </div>
    </div>
  );
}
