# Teman Belajarku

Aplikasi pengelola sekolah yang menyimpan data di perangkat dan dapat dijalankan sebagai aplikasi Android.

## Membuka proyek Android

1. Pastikan Android Studio dan Android SDK sudah terpasang.
2. Jalankan `bun install` lalu `bun run android:sync` dari folder proyek.
3. Buka folder `android` di Android Studio, tunggu sinkronisasi Gradle selesai, lalu pilih perangkat dan tekan **Run**.

Perintah `android:sync` membangun aplikasi web dan menyalin hasilnya ke proyek Android. Jalankan lagi setiap kali isi aplikasi berubah. Untuk membuat proyek Android pertama kali, gunakan `bun run android:add`; untuk membukanya dari terminal, gunakan `bun run android:open`.

## Menjalankan versi web

```sh
bun install
bun run dev
```

Data belajar tersimpan lokal di perangkat. Font aplikasi juga disertakan di dalam paket agar tampilan tetap lengkap tanpa koneksi internet.
