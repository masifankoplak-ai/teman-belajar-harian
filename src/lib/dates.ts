// Util tanggal & waktu berbasis zona waktu lokal perangkat.
// Konvensi: indeks hari 0 = Senin ... 6 = Minggu.

export const NAMA_HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
export const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
export const NAMA_BULAN_PENDEK = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

/** Tanggal hari ini dalam zona waktu lokal, format yyyy-mm-dd. */
export function todayISO(): string {
  return toISO(new Date());
}

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse "yyyy-mm-dd" menjadi Date lokal (jam 12 siang agar aman dari pergeseran zona). */
export function parseISO(iso: string): Date {
  const [y = 1970, m = 1, d = 1] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

/** Indeks hari (0 = Senin) dari objek Date. */
export function indeksHari(d: Date): number {
  return (d.getDay() + 6) % 7;
}

export function indeksHariISO(iso: string): number {
  return indeksHari(parseISO(iso));
}

export function tambahHari(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function selisihHari(dariISO: string, keISO: string): number {
  const a = parseISO(dariISO).getTime();
  const b = parseISO(keISO).getTime();
  return Math.round((b - a) / 86400000);
}

/** "Senin, 2 November 2026" atau tanpa nama hari. */
export function formatTanggal(iso: string, denganHari = true): string {
  if (!iso) return "-";
  const d = parseISO(iso);
  const teks = `${d.getDate()} ${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}`;
  return denganHari ? `${NAMA_HARI[indeksHari(d)]}, ${teks}` : teks;
}

export function formatTanggalPendek(iso: string): string {
  if (!iso) return "-";
  const d = parseISO(iso);
  return `${d.getDate()} ${NAMA_BULAN_PENDEK[d.getMonth()]}`;
}

/** Sapaan berdasarkan jam perangkat. */
export function sapaanWaktu(): string {
  const h = new Date().getHours();
  if (h >= 4 && h < 11) return "Selamat pagi";
  if (h >= 11 && h < 15) return "Selamat siang";
  if (h >= 15 && h < 18) return "Selamat sore";
  return "Selamat malam";
}

/** Label tenggat yang ramah: "Terlambat 2 hari", "Hari ini", "Besok", "3 hari lagi". */
export function labelTenggat(tenggatISO: string, hariIniISO = todayISO()): string {
  const sel = selisihHari(hariIniISO, tenggatISO);
  if (sel < 0) return `Terlambat ${Math.abs(sel)} hari`;
  if (sel === 0) return "Hari ini";
  if (sel === 1) return "Besok";
  return `${sel} hari lagi`;
}

export function labelHitungMundur(tanggalISO: string, hariIniISO = todayISO()): string {
  const sel = selisihHari(hariIniISO, tanggalISO);
  if (sel < 0) return `Sudah lewat ${Math.abs(sel)} hari`;
  if (sel === 0) return "Hari ini";
  if (sel === 1) return "Besok";
  return `H-${sel}`;
}

/** Menit sejak tengah malam, mis. 450 = 07:30. */
export function menitSekarang(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export function menitDariJam(jam: string): number {
  const [h, m] = jam.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Daftar 7 ISO tanggal berawal Senin pada minggu yang memuat tanggal ini. */
export function mingguBerisi(iso: string): string[] {
  const d = parseISO(iso);
  d.setDate(d.getDate() - indeksHari(d));
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    return toISO(x);
  });
}

/** Streak hari berturut-turut sampai hari ini (atau kemarin) dari daftar tanggal. */
export function hitungStreak(riwayat: string[], hariIniISO = todayISO()): number {
  const set = new Set(riwayat);
  let streak = 0;
  let kursor = hariIniISO;
  if (!set.has(kursor)) kursor = tambahHari(kursor, -1);
  while (set.has(kursor)) {
    streak += 1;
    kursor = tambahHari(kursor, -1);
  }
  return streak;
}
