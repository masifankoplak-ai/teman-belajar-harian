// Pengingat lokal tanpa internet, via Capacitor Local Notifications.
// Di browser (preview web) semua fungsi ini aman dijalankan: hanya no-op.

import { Capacitor } from "@capacitor/core";
import type { AppData } from "./types";
import { formatTanggalPendek, parseISO, todayISO, tambahHari } from "./dates";

const KANAL_ID = "teman-belajarku-pengingat";
const PENANDA = "teman-belajarku";

export function perangkatNative(): boolean {
  return typeof Capacitor !== "undefined" && Capacitor.isNativePlatform();
}

type Plugin = typeof import("@capacitor/local-notifications");

async function muatPlugin(): Promise<Plugin | null> {
  if (!perangkatNative()) return null;
  try {
    return await import("@capacitor/local-notifications");
  } catch {
    return null;
  }
}

/** Minta izin notifikasi Android; kembalikan true bila diizinkan. */
export async function izinkanNotifikasi(): Promise<boolean> {
  const p = await muatPlugin();
  if (!p) return false;
  try {
    let status = (await p.LocalNotifications.checkPermissions()).display;
    if (status !== "granted") {
      status = (await p.LocalNotifications.requestPermissions()).display;
    }
    if (status === "granted") {
      try {
        await p.LocalNotifications.createChannel({
          id: KANAL_ID,
          name: "Pengingat Belajar",
          description: "Pengingat tugas, ujian, dan kebiasaan belajar",
          importance: 4,
          visibility: 1,
        } as never);
      } catch {
        /* kanal mungkin sudah ada */
      }
    }
    return status === "granted";
  } catch {
    return false;
  }
}

function tanggalDari(iso: string, jam: string): Date {
  const d = parseISO(iso);
  const [h, m] = (jam || "17:00").split(":").map(Number);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

/**
 * Susun ulang seluruh pengingat lokal berdasarkan data terkini.
 * Aman dipanggil setiap kali data berubah (no-op di web).
 */
export async function aturUlangPengingat(data: AppData): Promise<void> {
  const p = await muatPlugin();
  if (!p) return;
  try {
    const pending = await p.LocalNotifications.getPending();
    const milikKita = pending.notifications.filter((n) => (n.extra as Record<string, unknown>)?.aplikasi === PENANDA);
    if (milikKita.length) {
      await p.LocalNotifications.cancel(milikKita.map((n) => ({ id: n.id })));
    }
  } catch {
    /* lanjut tanpa membatalkan */
  }

  const hariIni = todayISO();
  const daftar: import("@capacitor/local-notifications").ScheduleOptions[] = [];
  let nomor = 1;
  const tambah = (tanggalISO: string, judul: string, isi: string) => {
    const at = tanggalDari(tanggalISO, data.notifikasi.jamPengingat);
    if (at.getTime() <= Date.now()) return;
    daftar.push({
      id: nomor++,
      title: judul,
      body: isi,
      schedule: { at, allowWhileIdle: true },
      channelId: KANAL_ID,
      extra: { aplikasi: PENANDA },
    } as never);
  };

  if (data.notifikasi.tenggatPR) {
    for (const t of data.pr) {
      if (t.status === "selesai" || !t.tenggat || t.tenggat < hariIni) continue;
      for (const h of data.notifikasi.hariSebelumPR) {
        const tgl = tambahHari(t.tenggat, -h);
        tambah(tgl, "Pengingat PR", `${t.judul} — tenggat ${formatTanggalPendek(t.tenggat)}`);
      }
    }
  }

  if (data.notifikasi.jadwalUjian) {
    for (const u of data.ujian) {
      if (!u.tanggal || u.tanggal < hariIni) continue;
      for (const h of data.notifikasi.hariSebelumUjian) {
        const tgl = tambahHari(u.tanggal, -h);
        tambah(tgl, `Pengingat ${u.jenis}`, `${u.nama} — ${formatTanggalPendek(u.tanggal)}`);
      }
    }
  }

  if (data.notifikasi.kegiatanSekolah) {
    for (const a of data.aktivitas) {
      if (!a.tanggal || a.tanggal < hariIni) continue;
      tambah(a.tanggal, "Kegiatan Sekolah", `${a.judul} — ${formatTanggalPendek(a.tanggal)}`);
    }
  }

  try {
    if (daftar.length) {
      await p.LocalNotifications.schedule({ notifications: daftar });
    }
    if (data.notifikasi.kebiasaanHarian) {
      await p.LocalNotifications.schedule({
        notifications: [
          {
            id: 90001,
            title: "Waktunya belajar!",
            body: "Jangan lupa tandai kebiasaan belajarmu hari ini.",
            schedule: {
              at: tanggalDari(tambahHari(hariIni, 1), data.notifikasi.jamPengingat),
              every: "day",
              allowWhileIdle: true,
            },
            channelId: KANAL_ID,
            extra: { aplikasi: PENANDA },
          } as never,
        ],
      });
    }
  } catch (e) {
    console.error("Gagal menjadwalkan pengingat", e);
  }
}
