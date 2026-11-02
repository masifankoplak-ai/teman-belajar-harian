// Router sederhana berbasis hash — mendukung tombol kembali Android/browser.
// Format: #/beranda, #/jadwal, #/tugas?baru=1, #/mapel/<id>

import { useSyncExternalStore } from "react";

const langganan = new Set<() => void>();
let jalurSaatIni = "/beranda";

function bacaHash(): string {
  if (typeof window === "undefined") return "/beranda";
  const h = window.location.hash.replace(/^#/, "");
  return h.startsWith("/") ? h : `/beranda`;
}

function onUpdate() {
  const baru = bacaHash();
  if (baru !== jalurSaatIni) {
    jalurSaatIni = baru;
    window.scrollTo({ top: 0 });
  }
  langganan.forEach((f) => f());
}

if (typeof window !== "undefined") {
  jalurSaatIni = bacaHash();
  window.addEventListener("hashchange", onUpdate);
}

export function useRoute(): string {
  return useSyncExternalStore(
    (cb) => {
      langganan.add(cb);
      return () => langganan.delete(cb);
    },
    () => jalurSaatIni,
    () => "/beranda",
  );
}

export function navigate(tujuan: string): void {
  if (typeof window === "undefined") return;
  const hash = `#${tujuan.startsWith("/") ? tujuan : `/${tujuan}`}`;
  if (window.location.hash === hash) {
    langganan.forEach((f) => f());
  } else {
    window.location.hash = hash;
  }
}

/** Pecah jalur jadi path & query, mis. "/tugas?baru=1" -> {path:"/tugas", query:URLSearchParams}. */
export function pecahJalur(jalur: string): { path: string; query: URLSearchParams } {
  const [path, q = ""] = jalur.split("?");
  return { path, query: new URLSearchParams(q) };
}
