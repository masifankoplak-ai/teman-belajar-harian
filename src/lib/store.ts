// Pengelola data terpusat Teman Belajarku.
// Seluruh data aplikasi disimpan dalam satu objek AppData di LocalStorage,
// dengan nomor versi, normalisasi, dan langganan agar semua halaman sinkron.

import { useSyncExternalStore } from "react";
import type {
  AppData,
  Catatan,
  CeklisItem,
  JadwalItem,
  Kebiasaan,
  PR,
  Prioritas,
  Profil,
  Proyek,
  StatusPR,
  Ujian,
} from "./types";
import { todayISO } from "./dates";

export const VERSI_DATA = 1;
const KUNCI = "teman-belajarku:data";
const KUNCI_TEMA = "teman-belajarku:tema";

/** Palet warna mata pelajaran. */
export const PALET_WARNA = [
  "#367FC4",
  "#70B8E8",
  "#8BCFAE",
  "#FFD66B",
  "#F2907B",
  "#A78BDB",
  "#EF9BC2",
  "#6FC7C0",
  "#F2B950",
  "#9BB1E8",
];

export const KEBIASAAN_BAWAAN: { nama: string; jenis: "harian" | "mingguan"; targetPerMinggu: number }[] = [
  { nama: "Membaca buku 20 menit", jenis: "harian", targetPerMinggu: 7 },
  { nama: "Mengulang pelajaran hari ini", jenis: "harian", targetPerMinggu: 7 },
  { nama: "Menyelesaikan pekerjaan rumah", jenis: "harian", targetPerMinggu: 7 },
  { nama: "Belajar kosakata bahasa Inggris", jenis: "harian", targetPerMinggu: 5 },
  { nama: "Mempersiapkan perlengkapan sekolah", jenis: "harian", targetPerMinggu: 7 },
  { nama: "Belajar sesuai target harian", jenis: "harian", targetPerMinggu: 6 },
];

function dataKosong(): AppData {
  return {
    versi: VERSI_DATA,
    profil: null,
    jadwal: [],
    pr: [],
    ujian: [],
    aktivitas: [],
    proyek: [],
    catatan: [],
    kebiasaan: [],
    notifikasi: {
      tenggatPR: true,
      jadwalUjian: true,
      kegiatanSekolah: true,
      jadwalBelajar: false,
      kebiasaanHarian: true,
      jamPengingat: "17:00",
      hariSebelumPR: [1],
      hariSebelumUjian: [3, 1],
    },
    diperbarui: new Date().toISOString(),
  };
}

const KOSONG: AppData = dataKosong();

/** Normalisasi & validasi data dari sumber luar (LocalStorage / file impor). */
export function normalisasi(input: unknown): AppData {
  const dasar = dataKosong();
  if (!input || typeof input !== "object") return dasar;
  const o = input as Partial<AppData>;
  const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
  const num = (v: unknown, fallback = 0): number => (typeof v === "number" && !Number.isNaN(v) ? v : fallback);
  const bool = (v: unknown, fallback = false): boolean => (typeof v === "boolean" ? v : fallback);

  const hasil: AppData = {
    versi: num(o.versi, VERSI_DATA),
    profil: o.profil && typeof o.profil === "object"
      ? {
          nama: str((o.profil as Profil).nama),
          sekolah: str((o.profil as Profil).sekolah),
          jenjang: (["SD", "SMP", "SMA", "SMK"].includes((o.profil as Profil).jenjang)
            ? (o.profil as Profil).jenjang
            : "SMP") as Profil["jenjang"],
          kelas: str((o.profil as Profil).kelas),
          tahunAjaran: str((o.profil as Profil).tahunAjaran),
        }
      : null,
    jadwal: arr<JadwalItem>(o.jadwal)
      .filter((j) => j && typeof j === "object" && str(j.mapel).trim() !== "")
      .map((j) => ({
        id: str(j.id) || idBaru(),
        hari: Math.min(6, Math.max(0, Math.round(num(j.hari, 0)))),
        mapel: str(j.mapel).trim(),
        guru: str(j.guru),
        ruang: str(j.ruang),
        jamMulai: str(j.jamMulai, "07:00"),
        jamSelesai: str(j.jamSelesai, "08:00"),
        warna: PALET_WARNA.includes(j.warna) ? j.warna : PALET_WARNA[0],
      })),
    pr: arr<PR>(o.pr)
      .filter((t) => t && typeof t === "object" && str(t.judul).trim() !== "")
      .map((t) => ({
        id: str(t.id) || idBaru(),
        judul: str(t.judul).trim(),
        mapel: str(t.mapel),
        deskripsi: str(t.deskripsi),
        tanggalDiberikan: str(t.tanggalDiberikan, todayISO()),
        tenggat: str(t.tenggat, todayISO()),
        prioritas: (["rendah", "sedang", "tinggi"].includes(t.prioritas) ? t.prioritas : "sedang") as Prioritas,
        estimasiMenit: Math.max(0, Math.round(num(t.estimasiMenit, 30))),
        catatan: str(t.catatan),
        status: (["belum", "dikerjakan", "selesai"].includes(t.status) ? t.status : "belum") as StatusPR,
        selesaiPada: str(t.selesaiPada) || undefined,
      })),
    ujian: arr<Ujian>(o.ujian)
      .filter((u) => u && typeof u === "object" && str(u.nama).trim() !== "")
      .map((u) => ({
        id: str(u.id) || idBaru(),
        jenis: str(u.jenis, "Ulangan Harian") as Ujian["jenis"],
        nama: str(u.nama).trim(),
        mapel: str(u.mapel),
        tanggal: str(u.tanggal, todayISO()),
        jam: str(u.jam, "07:00"),
        lokasi: str(u.lokasi),
        materi: str(u.materi),
        catatan: str(u.catatan),
        persiapan: arr<CeklisItem>(u.persiapan)
          .filter((c) => c && str(c.teks).trim() !== "")
          .map((c) => ({ id: str(c.id) || idBaru(), teks: str(c.teks).trim(), selesai: bool(c.selesai) })),
      })),
    aktivitas: arr(o.aktivitas)
      .filter((a) => a && typeof a === "object" && str(a.judul).trim() !== "")
      .map((a) => ({
        id: str(a.id) || idBaru(),
        tanggal: str(a.tanggal, todayISO()),
        jam: str(a.jam),
        judul: str(a.judul).trim(),
        jenis: str(a.jenis, "Lainnya") as AppData["aktivitas"][number]["jenis"],
        catatan: str(a.catatan),
      })),
    proyek: arr<Proyek>(o.proyek)
      .filter((p) => p && typeof p === "object" && str(p.judul).trim() !== "")
      .map((p) => ({
        id: str(p.id) || idBaru(),
        judul: str(p.judul).trim(),
        deskripsi: str(p.deskripsi),
        kategori: str(p.kategori, "Tugas Kelompok"),
        mapel: str(p.mapel),
        tanggalMulai: str(p.tanggalMulai, todayISO()),
        tenggat: str(p.tenggat, todayISO()),
        prioritas: (["rendah", "sedang", "tinggi"].includes(p.prioritas) ? p.prioritas : "sedang") as Prioritas,
        status: (["belum", "dikerjakan", "selesai"].includes(p.status) ? p.status : "belum") as StatusPR,
        tahapan: arr<CeklisItem>(p.tahapan)
          .filter((c) => c && str(c.teks).trim() !== "")
          .map((c) => ({ id: str(c.id) || idBaru(), teks: str(c.teks).trim(), selesai: bool(c.selesai) })),
        catatan: str(p.catatan),
        selesaiPada: str(p.selesaiPada) || undefined,
      })),
    catatan: arr<Catatan>(o.catatan)
      .filter((c) => c && typeof c === "object" && str(c.judul).trim() !== "" || str(c.isi).trim() !== "")
      .map((c) => ({
        id: str(c.id) || idBaru(),
        judul: str(c.judul, "Tanpa judul").trim() || "Tanpa judul",
        isi: str(c.isi),
        mapel: str(c.mapel),
        jenis: str(c.jenis, "Bebas") as Catatan["jenis"],
        dipin: bool(c.dipin),
        diperbarui: str(c.diperbarui, new Date().toISOString()),
      })),
    kebiasaan: arr<Kebiasaan>(o.kebiasaan)
      .filter((k) => k && typeof k === "object" && str(k.nama).trim() !== "")
      .map((k) => ({
        id: str(k.id) || idBaru(),
        nama: str(k.nama).trim(),
        jenis: k.jenis === "mingguan" ? "mingguan" : "harian",
        targetPerMinggu: Math.min(7, Math.max(1, Math.round(num(k.targetPerMinggu, 7)))),
        riwayat: arr<string>(k.riwayat).filter((t) => /^\d{4}-\d{2}-\d{2}$/.test(t)),
        bawaan: bool(k.bawaan),
      })),
    notifikasi: {
      tenggatPR: bool(o.notifikasi?.tenggatPR, true),
      jadwalUjian: bool(o.notifikasi?.jadwalUjian, true),
      kegiatanSekolah: bool(o.notifikasi?.kegiatanSekolah, true),
      jadwalBelajar: bool(o.notifikasi?.jadwalBelajar, false),
      kebiasaanHarian: bool(o.notifikasi?.kebiasaanHarian, true),
      jamPengingat: /^\d{2}:\d{2}$/.test(str(o.notifikasi?.jamPengingat)) ? str(o.notifikasi?.jamPengingat) : "17:00",
      hariSebelumPR: arr<number>(o.notifikasi?.hariSebelumPR).filter((n) => n >= 0 && n <= 30),
      hariSebelumUjian: arr<number>(o.notifikasi?.hariSebelumUjian).filter((n) => n >= 0 && n <= 30),
    },
    diperbarui: str(o.diperbarui, new Date().toISOString()),
  };
  return hasil;
}

// ---- Penyimpanan & langganan ----

let cache: AppData | null = null;
const langganan = new Set<() => void>();

export function getData(): AppData {
  if (typeof window === "undefined") return KOSONG;
  if (cache) return cache;
  try {
    const mentah = localStorage.getItem(KUNCI);
    cache = mentah ? normalisasi(JSON.parse(mentah)) : dataKosong();
  } catch {
    cache = dataKosong();
  }
  return cache;
}

function simpan(data: AppData): void {
  try {
    localStorage.setItem(KUNCI, JSON.stringify(data));
  } catch (e) {
    console.error("Gagal menyimpan data", e);
  }
}

/** Ubah data lewat fungsi murni; otomatis disimpan & disiarkan ke semua halaman. */
export function mutate(fn: (d: AppData) => void): void {
  const salinan: AppData = JSON.parse(JSON.stringify(getData()));
  fn(salinan);
  salinan.versi = VERSI_DATA;
  salinan.diperbarui = new Date().toISOString();
  cache = salinan;
  simpan(salinan);
  langganan.forEach((f) => f());
}

/** Hook untuk membaca data; halaman otomatis diperbarui saat data berubah. */
export function useAppData(): AppData {
  return useSyncExternalStore(
    (cb) => {
      langganan.add(cb);
      return () => langganan.delete(cb);
    },
    () => getData(),
    () => KOSONG,
  );
}

export function idBaru(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---- Tindakan umum ----

export function simpanProfil(p: Profil): void {
  const pertama = !getData().profil;
  mutate((d) => {
    d.profil = p;
    if (pertama && d.kebiasaan.length === 0) {
      d.kebiasaan = KEBIASAAN_BAWAAN.map((k) => ({
        id: idBaru(),
        nama: k.nama,
        jenis: k.jenis,
        targetPerMinggu: k.targetPerMinggu,
        riwayat: [],
        bawaan: true,
      }));
    }
  });
}

export function warnaMapel(data: AppData, mapel: string): string {
  const item = data.jadwal.find((j) => j.mapel.toLowerCase() === mapel.toLowerCase());
  if (item) return item.warna;
  const semua = daftarMapel(data);
  const i = semua.findIndex((m) => m.toLowerCase() === mapel.toLowerCase());
  return PALET_WARNA[(i >= 0 ? i : semua.length) % PALET_WARNA.length];
}

/** Daftar nama mata pelajaran unik dari jadwal + PR + ujian (terurut abjad). */
export function daftarMapel(data: AppData): string[] {
  const set = new Set<string>();
  data.jadwal.forEach((j) => set.add(j.mapel));
  data.pr.forEach((t) => t.mapel && set.add(t.mapel));
  data.ujian.forEach((u) => u.mapel && set.add(u.mapel));
  data.proyek.forEach((p) => p.mapel && set.add(p.mapel));
  data.catatan.forEach((c) => c.mapel && set.add(c.mapel));
  return Array.from(set).sort((a, b) => a.localeCompare(b, "id"));
}

// ---- Ekspor / impor / reset ----

export function eksporJSON(): string {
  return JSON.stringify({ aplikasi: "Teman Belajarku", ...getData() }, null, 2);
}

export function unduhCadangan(): void {
  const blob = new Blob([eksporJSON()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cadangan-teman-belajarku-${todayISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Impor file cadangan. Melempar Error berbahasa Indonesia jika tidak valid. */
export function imporJSON(mentah: string): AppData {
  let obj: unknown;
  try {
    obj = JSON.parse(mentah);
  } catch {
    throw new Error("File bukan cadangan yang valid (format JSON salah).");
  }
  const o = obj as Record<string, unknown>;
  if (!o || typeof o !== "object" || (!o.versi && !o.profil && !o.jadwal)) {
    throw new Error("File ini bukan cadangan Teman Belajarku.");
  }
  const hasil = normalisasi(o);
  cache = hasil;
  simpan(hasil);
  langganan.forEach((f) => f());
  return hasil;
}

export function resetData(): void {
  const kosong = dataKosong();
  cache = kosong;
  simpan(kosong);
  langganan.forEach((f) => f());
}

// ---- Tema ----

export type Tema = "terang" | "gelap" | "sistem";

export function getTema(): Tema {
  if (typeof window === "undefined") return "terang";
  const v = localStorage.getItem(KUNCI_TEMA);
  return v === "gelap" || v === "sistem" ? v : "terang";
}

function mediaGelap(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function terapkanTema(t: Tema): void {
  const gelap = t === "gelap" || (t === "sistem" && mediaGelap());
  document.documentElement.classList.toggle("dark", gelap);
  document.documentElement.style.colorScheme = gelap ? "dark" : "light";
}

export function setTema(t: Tema): void {
  try {
    localStorage.setItem(KUNCI_TEMA, t);
  } catch {
    /* abaikan */
  }
  terapkanTema(t);
}

export function initTema(): () => void {
  terapkanTema(getTema());
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const on = () => {
    if (getTema() === "sistem") terapkanTema("sistem");
  };
  mq.addEventListener("change", on);
  return () => mq.removeEventListener("change", on);
}
