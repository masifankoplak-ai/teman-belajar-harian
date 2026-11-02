// Tipe data aplikasi Teman Belajarku — seluruh data disimpan di LocalStorage.

export type Jenjang = "SD" | "SMP" | "SMA" | "SMK";
export type StatusPR = "belum" | "dikerjakan" | "selesai";
export type Prioritas = "rendah" | "sedang" | "tinggi";
export type JenisUjian =
  | "Ulangan Harian"
  | "UTS"
  | "UAS"
  | "Ujian Praktik"
  | "Ujian Sekolah"
  | "Lainnya";
export type JenisAktivitas = "Kegiatan Sekolah" | "Proyek" | "Target Belajar" | "Lainnya";
export type JenisCatatan = "Ringkasan" | "Rumus" | "Definisi" | "Penting" | "Bebas";

export interface Profil {
  nama: string;
  sekolah: string;
  jenjang: Jenjang;
  kelas: string;
  tahunAjaran: string;
}

export interface JadwalItem {
  id: string;
  hari: number; // 0 = Senin ... 6 = Minggu
  mapel: string;
  guru: string;
  ruang: string;
  jamMulai: string; // "HH:MM"
  jamSelesai: string; // "HH:MM"
  warna: string; // hex dari PALET_WARNA
}

export interface PR {
  id: string;
  judul: string;
  mapel: string;
  deskripsi: string;
  tanggalDiberikan: string; // ISO yyyy-mm-dd
  tenggat: string; // ISO yyyy-mm-dd
  prioritas: Prioritas;
  estimasiMenit: number;
  catatan: string;
  status: StatusPR;
  selesaiPada?: string; // ISO datetime saat ditandai selesai
}

export interface CeklisItem {
  id: string;
  teks: string;
  selesai: boolean;
}

export interface Ujian {
  id: string;
  jenis: JenisUjian;
  nama: string;
  mapel: string;
  tanggal: string;
  jam: string;
  lokasi: string;
  materi: string;
  catatan: string;
  persiapan: CeklisItem[];
}

export interface Aktivitas {
  id: string;
  tanggal: string;
  jam: string;
  judul: string;
  jenis: JenisAktivitas;
  catatan: string;
}

export interface Proyek {
  id: string;
  judul: string;
  deskripsi: string;
  kategori: string;
  mapel: string;
  tanggalMulai: string;
  tenggat: string;
  prioritas: Prioritas;
  status: StatusPR;
  tahapan: CeklisItem[];
  catatan: string;
  selesaiPada?: string;
}

export interface Catatan {
  id: string;
  judul: string;
  isi: string;
  mapel: string;
  jenis: JenisCatatan;
  dipin: boolean;
  diperbarui: string; // ISO datetime
}

export interface Kebiasaan {
  id: string;
  nama: string;
  jenis: "harian" | "mingguan";
  targetPerMinggu: number; // untuk kebiasaan mingguan
  riwayat: string[]; // daftar tanggal ISO yang ditandai selesai
  bawaan: boolean;
}

export interface Notifikasi {
  tenggatPR: boolean;
  jadwalUjian: boolean;
  kegiatanSekolah: boolean;
  jadwalBelajar: boolean;
  kebiasaanHarian: boolean;
  jamPengingat: string; // "HH:MM"
  hariSebelumPR: number[];
  hariSebelumUjian: number[];
}

export interface AppData {
  versi: number;
  profil: Profil | null;
  jadwal: JadwalItem[];
  pr: PR[];
  ujian: Ujian[];
  aktivitas: Aktivitas[];
  proyek: Proyek[];
  catatan: Catatan[];
  kebiasaan: Kebiasaan[];
  notifikasi: Notifikasi;
  diperbarui: string;
}
