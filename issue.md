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

---

# Planning: Fitur Registrasi User

Dokumen ini berisi instruksi detail untuk mengimplementasikan fitur registrasi user baru. Instruksi ini ditujukan untuk diimplementasikan oleh junior developer atau AI assistant.

## Tech Stack yang Digunakan

- **Runtime & Package Manager**: Bun
- **Web Framework**: ElysiaJS
- **ORM**: Drizzle ORM
- **Database**: MySQL
- **Password Hashing**: `bcryptjs`

---

## Bagian 1: Pembaruan Skema Database

### Tabel `users`

Tabel `users` sudah ada di `src/db/schema.ts`, namun perlu diperbarui untuk menambahkan field `password` dan `updated_at`.

**Struktur tabel yang diinginkan:**

| Field        | Tipe             | Constraint                          |
| ------------ | ---------------- | ----------------------------------- |
| `id`         | `INT`            | `AUTO_INCREMENT`, `PRIMARY KEY`     |
| `name`       | `VARCHAR(255)`   | `NOT NULL`                          |
| `email`      | `VARCHAR(255)`   | `NOT NULL`, `UNIQUE`                |
| `password`   | `VARCHAR(255)`   | `NOT NULL`                          |
| `created_at` | `TIMESTAMP`      | `DEFAULT NOW()`                     |
| `updated_at` | `TIMESTAMP`      | `DEFAULT NOW()`, `ON UPDATE NOW()`  |

### Langkah 1.1 — Perbarui `src/db/schema.ts`

Buka file `src/db/schema.ts` dan ubah isinya menjadi seperti berikut:

```typescript
import { mysqlTable, serial, varchar, timestamp } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
```

**Poin penting:**
- Field `password` ditambahkan dengan tipe `varchar(255)` dan constraint `notNull()`.
- Field `updatedAt` ditambahkan dengan `.onUpdateNow()` agar otomatis ter-update setiap kali baris diubah.

### Langkah 1.2 — Jalankan Migrasi Database

Setelah schema diperbarui, generate dan jalankan migrasi agar perubahan diterapkan ke database.

```bash
# Generate file migrasi
bun run db:generate

# Terapkan migrasi ke database
bun run db:migrate
```

---

## Bagian 2: Instalasi Dependency Tambahan

Fitur ini membutuhkan library untuk melakukan hashing password menggunakan bcrypt.

### Langkah 2.1 — Install `bcryptjs`

Jalankan perintah berikut untuk menginstall library dan type definition-nya:

```bash
bun add bcryptjs
bun add -d @types/bcryptjs
```

**Penjelasan:**
- `bcryptjs` adalah library murni JavaScript untuk bcrypt hashing, kompatibel dengan Bun.
- `@types/bcryptjs` adalah type definition untuk TypeScript.

---

## Bagian 3: Struktur Folder

Buat struktur folder baru di dalam `src/` seperti berikut:

```
src/
├── db/
│   └── schema.ts         # (sudah ada, diperbarui)
├── routes/
│   └── users-route.ts    # [BARU] Routing untuk endpoint user
├── services/
│   └── users-service.ts  # [BARU] Logic bisnis untuk user
└── index.ts              # (sudah ada, perlu diperbarui)
```

**Aturan penamaan file:**
- Folder `routes/` → format nama: `[nama-resource]-route.ts`
- Folder `services/` → format nama: `[nama-resource]-service.ts`

---

## Bagian 4: Implementasi File

### Langkah 4.1 — Buat `src/services/users-service.ts`

File ini berisi **seluruh logic bisnis** untuk fitur user, termasuk validasi dan interaksi dengan database.

```typescript
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Tipe data untuk input registrasi
export type RegisterUserInput = {
  name: string;
  email: string;
  password: string;
};

export const registerUser = async (input: RegisterUserInput) => {
  const { name, email, password } = input;

  // 1. Cek apakah email sudah terdaftar
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (existingUser.length > 0) {
    throw new Error("Email sudah terdaftar");
  }

  // 2. Hash password menggunakan bcrypt (salt rounds = 10)
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3. Simpan user baru ke database
  await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
  });

  // 4. Ambil data user yang baru dibuat (tanpa password)
  const newUser = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.email, email));

  return newUser[0];
};
```

**Poin penting:**
- Password **tidak boleh** dikembalikan ke response. Gunakan `select` dengan field spesifik.
- Selalu cek duplikasi email sebelum insert.
- Gunakan `bcrypt.hash(password, 10)` — angka `10` adalah salt rounds (semakin besar semakin aman tapi semakin lambat).

---

### Langkah 4.2 — Buat `src/routes/users-route.ts`

File ini berisi **definisi route** ElysiaJS untuk resource `users`.

```typescript
import { Elysia, t } from "elysia";
import { registerUser } from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .post(
    "/register",
    async ({ body, set }) => {
      try {
        const user = await registerUser(body);
        return {
          status: "success",
          data: user,
        };
      } catch (error: any) {
        set.status = 400;
        return {
          status: "failed",
          error: error.message || "Registrasi gagal",
        };
      }
    },
    {
      // Validasi body request menggunakan Elysia type system
      body: t.Object({
        name: t.String({ minLength: 1 }),
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 6 }),
      }),
    }
  );
```

**Poin penting:**
- Gunakan `{ prefix: "/api/users" }` agar semua route di file ini berada di bawah path `/api/users`.
- Gunakan validasi body bawaan Elysia (`t.Object`) untuk memastikan input valid sebelum masuk ke service.
- Gunakan `set.status = 400` untuk mengembalikan HTTP status code yang sesuai saat error.

---

### Langkah 4.3 — Perbarui `src/index.ts`

Daftarkan `usersRoute` ke dalam instance Elysia utama menggunakan method `.use()`.

```typescript
import { Elysia } from "elysia";
import { db } from "./db";
import { users } from "./db/schema";
import { usersRoute } from "./routes/users-route"; // [TAMBAHKAN]

const app = new Elysia()
  .get("/", () => ({
    status: "OK",
    message: "Server is running",
  }))
  .get("/users", async () => {
    try {
      const allUsers = await db.select().from(users);
      return { success: true, data: allUsers };
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to fetch users" };
    }
  })
  .use(usersRoute) // [TAMBAHKAN]
  .listen(Number(process.env.PORT) || 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
```

---

## Bagian 5: Spesifikasi API

### `POST /api/users/register`

**Deskripsi:** Mendaftarkan user baru ke dalam sistem.

**Request Body (JSON):**

```json
{
  "name": "Budi",
  "email": "budi@mail.com",
  "password": "budii"
}
```

| Field      | Tipe     | Wajib | Validasi             |
| ---------- | -------- | ----- | -------------------- |
| `name`     | `string` | Ya    | Tidak boleh kosong   |
| `email`    | `string` | Ya    | Format email valid   |
| `password` | `string` | Ya    | Minimal 6 karakter   |

**Response Body (Sukses — HTTP 200):**

```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "Budi",
    "email": "budi@mail.com",
    "createdAt": "2026-06-25T10:00:00.000Z",
    "updatedAt": "2026-06-25T10:00:00.000Z"
  }
}
```

**Response Body (Gagal — HTTP 400):**

```json
{
  "status": "failed",
  "error": "Email sudah terdaftar"
}
```

---

## Bagian 6: Urutan Pengerjaan (Checklist)

Kerjakan langkah-langkah berikut secara berurutan:

- [ ] **1.** Perbarui `src/db/schema.ts` — tambahkan field `password` dan `updatedAt`
- [ ] **2.** Jalankan `bun run db:generate` untuk generate file migrasi
- [ ] **3.** Jalankan `bun run db:migrate` untuk menerapkan migrasi ke database
- [ ] **4.** Install dependency `bcryptjs` dan `@types/bcryptjs`
- [ ] **5.** Buat folder `src/routes/` dan `src/services/`
- [ ] **6.** Buat file `src/services/users-service.ts` sesuai kode di atas
- [ ] **7.** Buat file `src/routes/users-route.ts` sesuai kode di atas
- [ ] **8.** Perbarui `src/index.ts` — import dan daftarkan `usersRoute` menggunakan `.use()`
- [ ] **9.** Jalankan server dengan `bun run dev` dan pastikan tidak ada error
- [ ] **10.** Test endpoint `POST /api/users/register` menggunakan tool seperti Postman atau `curl`

---

## Kriteria Selesai (Definition of Done)

- Endpoint `POST /api/users/register` dapat menerima request dan menyimpan user baru ke database.
- Password tersimpan di database dalam bentuk **bcrypt hash**, bukan plaintext.
- Response **tidak mengandung field `password`**.
- Jika email sudah terdaftar, API mengembalikan error dengan status HTTP 400.
- Jika request body tidak valid (misal email salah format), API mengembalikan error validasi.
- Server tetap berjalan tanpa crash setelah implementasi selesai.
