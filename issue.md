# Planning Setup Project Backend

Dokumen ini berisi instruksi tingkat tinggi (high-level) untuk menginisialisasi dan mengatur proyek backend baru. Instruksi ini ditujukan untuk diimplementasikan oleh programmer atau AI assistant.

## Tech Stack
- **Runtime & Package Manager**: Bun
- **Web Framework**: ElysiaJS
- **ORM**: Drizzle
- **Database**: MySQL

## Langkah Implementasi

### 1. Inisialisasi Proyek
- Lakukan inisialisasi project Bun di dalam folder ini.
- Pastikan file konfigurasi dasar seperti `package.json` dan `tsconfig.json` sudah terbentuk.

### 2. Instalasi Dependency
- Install framework **ElysiaJS**.
- Install **Drizzle ORM** untuk query database.
- Install **Drizzle Kit** (sebagai dev dependency) untuk keperluan migrasi.
- Install driver/klien **MySQL** yang kompatibel dengan Bun dan Drizzle (contoh: `mysql2`).

### 3. Konfigurasi Database & ORM
- Siapkan file `.env` untuk menyimpan konfigurasi koneksi MySQL (seperti `DATABASE_URL`).
- Buat modul/file untuk mengatur koneksi database menggunakan Drizzle.
- Definisikan setidaknya satu skema tabel sederhana (misalnya tabel `users`) sebagai inisialisasi awal.
- Buat file konfigurasi Drizzle Kit (`drizzle.config.ts`) agar tool migrasi dapat membaca skema dan database.

### 4. Setup Server Aplikasi
- Buat file entry point aplikasi (misalnya `src/index.ts`).
- Inisialisasi instance server ElysiaJS.
- Daftarkan route dasar (misalnya `GET /`) yang me-return status "OK" untuk memastikan server menyala.

### 5. Konfigurasi Script
- Tambahkan command scripts yang diperlukan di dalam `package.json`, antara lain:
  - Script untuk menjalankan server development (misal menggunakan `bun --watch`).
  - Script untuk men-generate migrasi database Drizzle.
  - Script untuk mengeksekusi migrasi ke database.

## Kriteria Selesai (Definition of Done)
- Server ElysiaJS dapat dijalankan tanpa error menggunakan perintah dari `package.json`.
- Aplikasi dapat merespons request HTTP sederhana.
- Setup Drizzle sudah dikonfigurasi dengan benar sehingga dapat melakukan koneksi ke database MySQL.
- Workflow migrasi database sudah disiapkan dan siap digunakan.
