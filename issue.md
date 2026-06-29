# Issue: Implementasi Fitur Login User dengan Token Sesi

## Deskripsi
Buat endpoint login user yang memvalidasi email & password, lalu menghasilkan token UUID sebagai sesi yang disimpan di tabel `sessions`. Token ini dikembalikan ke client sebagai bukti autentikasi.

---

## Konteks Proyek

### Tech Stack
- **Runtime**: Bun
- **Framework**: ElysiaJS
- **Database**: MySQL
- **ORM**: Drizzle ORM (`drizzle-orm/mysql2`)
- **Password Hashing**: `bcryptjs`

### Struktur Folder yang Sudah Ada
```
src/
├── db/
│   ├── index.ts       # Koneksi database (Drizzle + MySQL2 pool)
│   └── schema.ts      # Definisi tabel Drizzle ORM
├── routes/
│   └── users-route.ts # Routing ElysiaJS (prefix: /api/users)
├── services/
│   └── users-service.ts # Business logic (registerUser)
└── index.ts           # Entry point, mounting routes ke Elysia app
```

### Konvensi Penamaan File
| Folder     | Format               | Contoh              |
|------------|----------------------|---------------------|
| `routes/`  | `{nama}-route.ts`    | `users-route.ts`    |
| `services/`| `{nama}-service.ts`  | `users-service.ts`  |

---

## Tugas yang Harus Dikerjakan

### Langkah 1 — Tambah Tabel `sessions` di Schema Drizzle

**File**: `src/db/schema.ts`

Tambahkan definisi tabel `sessions` menggunakan Drizzle ORM. Tabel ini menyimpan token sesi yang dibuat saat user login.

**Struktur tabel:**

| Field        | Tipe SQL             | Keterangan                                 |
|--------------|----------------------|--------------------------------------------|
| `id`         | `INT` AUTO_INCREMENT | Primary Key                                |
| `token`      | `VARCHAR(255)` NOT NULL | UUID token autentikasi user             |
| `user_id`    | `INT`                | Foreign Key ke tabel `users`               |
| `created_at` | `TIMESTAMP`          | Default `NOW()`                            |

**Implementasi Drizzle ORM:**

```typescript
// Tambahkan import 'int', 'varchar', 'timestamp' sudah ada.
// Tambahkan export berikut di bawah definisi tabel 'users':

export const sessions = mysqlTable("sessions", {
  id: int("id").notNull().primaryKey().autoincrement(),
  token: varchar("token", { length: 255 }).notNull(),
  userId: int("user_id"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

> **Catatan**: Import yang dibutuhkan (`int`, `varchar`, `timestamp`, `mysqlTable`) sudah ada di baris 1 file `schema.ts`. Cukup tambahkan blok `export const sessions` saja.

**Setelah selesai**, jalankan perintah berikut untuk push schema ke database:
```bash
bun run db:push
```

---

### Langkah 2 — Buat Logic Login di `users-service.ts`

**File**: `src/services/users-service.ts`

Tambahkan fungsi `loginUser` ke file service yang sudah ada. Jangan hapus fungsi `registerUser` yang sudah ada.

**Alur Logic:**
1. Cari user berdasarkan `email` di tabel `users`
2. Jika user tidak ditemukan → lempar error `"Email atau password salah"`
3. Bandingkan `password` input dengan `password` hash di database menggunakan `bcrypt.compare()`
4. Jika password salah → lempar error `"Email atau password salah"`
5. Generate UUID sebagai token menggunakan `crypto.randomUUID()`
6. Simpan token baru ke tabel `sessions` dengan `userId` yang sesuai
7. Kembalikan `{ token }` ke caller

**Tambahkan import berikut** (di bagian atas file, setelah import yang sudah ada):
```typescript
import { sessions } from "../db/schema";
```

**Tambahkan tipe input dan fungsi berikut** (di bawah fungsi `registerUser`):

```typescript
export type LoginUserInput = {
  email: string;
  password: string;
};

export const loginUser = async (input: LoginUserInput) => {
  const { email, password } = input;

  // 1. Cari user berdasarkan email
  const result = await db.select().from(users).where(eq(users.email, email));
  if (result.length === 0) {
    throw new Error("Email atau password salah");
  }
  const user = result[0];

  // 2. Verifikasi password
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new Error("Email atau password salah");
  }

  // 3. Generate token UUID
  const token = crypto.randomUUID();

  // 4. Simpan sesi ke database
  await db.insert(sessions).values({ token, userId: user.id });

  // 5. Kembalikan token
  return { token };
};
```

> **Catatan**: `crypto.randomUUID()` adalah built-in API di Bun/Node.js (tidak perlu install library tambahan).

---

### Langkah 3 — Tambah Route Login di `users-route.ts`

**File**: `src/routes/users-route.ts`

Tambahkan endpoint `POST /login` ke route yang sudah ada. Jangan hapus endpoint `/register` yang sudah ada.

**Tambahkan import `loginUser`** di bagian atas:
```typescript
import { registerUser, loginUser } from "../services/users-service";
```

**Tambahkan endpoint baru** dengan meng-chain `.post("/login", ...)` setelah endpoint `/register`:

```typescript
.post(
  "/login",
  async ({ body, set }) => {
    try {
      const data = await loginUser(body);
      return { status: "success", data };
    } catch (error: any) {
      set.status = 401;
      return { status: "failed", error: error.message || "Login gagal" };
    }
  },
  {
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String({ minLength: 1 }),
    }),
  }
)
```

> **Catatan**: Gunakan HTTP status `401 Unauthorized` untuk kegagalan login (bukan `400 Bad Request`).

---

## Spesifikasi API

### Endpoint
```
POST /api/users/login
```

### Request Body
```json
{
  "email": "budi@mail.com",
  "password": "budii"
}
```

### Response Body (Sukses — HTTP 200)
```json
{
  "status": "success",
  "data": {
    "token": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Response Body (Gagal — HTTP 401)
```json
{
  "status": "failed",
  "error": "Email atau password salah"
}
```

---

## Urutan Pengerjaan yang Disarankan

```
1. Edit src/db/schema.ts              → Tambah tabel sessions
2. Jalankan: bun run db:push          → Sync schema ke database
3. Edit src/services/users-service.ts → Tambah fungsi loginUser
4. Edit src/routes/users-route.ts     → Tambah endpoint POST /login
5. Jalankan: bun run dev              → Jalankan server
6. Test endpoint dengan curl atau Postman (lihat contoh di bawah)
```

---

## Testing Manual

### Test Login Berhasil
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "budi@mail.com", "password": "budii"}'
```

**Expected response:**
```json
{
  "status": "success",
  "data": {
    "token": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

### Test Login Gagal (password salah)
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "budi@mail.com", "password": "salah"}'
```

**Expected response (HTTP 401):**
```json
{
  "status": "failed",
  "error": "Email atau password salah"
}
```

---

## Catatan Penting untuk Developer

- **Jangan** buat file baru. Semua perubahan cukup dilakukan di 3 file yang disebutkan di atas.
- **Jangan** hapus kode yang sudah ada. Hanya tambahkan kode baru.
- **Jangan** install library tambahan. Semua dependency yang dibutuhkan sudah tersedia:
  - `bcryptjs` → sudah ada di `package.json`
  - `drizzle-orm` → sudah ada di `package.json`
  - `crypto` → built-in Bun/Node.js, tidak perlu import
- Gunakan **pesan error yang sama** (`"Email atau password salah"`) untuk kasus email tidak ditemukan maupun password salah. Ini adalah praktik keamanan agar attacker tidak bisa menebak apakah email terdaftar atau tidak.
- Pastikan `bun run db:push` berhasil sebelum menjalankan server, karena tabel `sessions` harus sudah ada di database.
