# Issue: Get Current User API

## Deskripsi

Tambahkan endpoint untuk mendapatkan data user yang sedang login berdasarkan token sesi yang aktif.
Jika token sudah kadaluarsa, sistem harus menghapus sesi tersebut secara otomatis dan mengembalikan pesan error.

---

## Endpoint

```
GET /api/users/current
```

### Header yang Diperlukan

| Key             | Value               | Keterangan       |
| --------------- | ------------------- | ---------------- |
| `Authorization` | `Bearer <token>`    | Token dari login |

---

## Response

### ✅ Success (HTTP 200)

```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "nama user",
    "email": "email user",
    "created_at": "2022-01-01T00:00:00.000Z",
    "updated_at": "2022-01-01T00:00:00.000Z"
  }
}
```

### ❌ Failed – Token tidak ditemukan / tidak dikirim (HTTP 401)

```json
{
  "status": "failed",
  "error": "Token missing"
}
```

### ❌ Failed – Token kadaluarsa (HTTP 401)

```json
{
  "status": "failed",
  "error": "Token telah kadaluarsa"
}
```

### ❌ Failed – Token tidak valid (HTTP 401)

```json
{
  "status": "failed",
  "error": "Invalid token"
}
```

---

## Struktur Folder & File

```
src/
├── routes/
│   └── users-route.ts        ← MODIFY (tambahkan route GET /current)
└── services/
    └── users-service.ts      ← MODIFY (tambahkan fungsi getCurrentUser)
```

---

## Langkah Implementasi

### Langkah 1 — Tambahkan fungsi `getCurrentUser` di `users-service.ts`

File: `src/services/users-service.ts`

Tambahkan fungsi baru di bawah fungsi `logoutUser` yang sudah ada.

**Logika:**
1. Terima parameter `token: string` dari argumen fungsi.
2. Cari sesi di tabel `sessions` berdasarkan kolom `token`.
3. Jika sesi **tidak ditemukan**, lempar error `"Invalid token"`.
4. Jika sesi **ditemukan**, cek apakah kolom `expiresAt` sudah melewati waktu sekarang (`new Date()`).
   - Jika sudah kadaluarsa:
     - Hapus sesi dari tabel `sessions` (query `DELETE`) — ini adalah proses **auto logout**.
     - Lempar error `"Token telah kadaluarsa"`.
5. Jika sesi masih valid, ambil data user dari tabel `users` menggunakan `userId` yang ada di dalam sesi.
6. Kembalikan data user dengan field: `id`, `name`, `email`, `createdAt`, `updatedAt`.

**Contoh kode:**

```typescript
export const getCurrentUser = async (input: { token: string }) => {
  const { token } = input;

  // 1. Cari sesi berdasarkan token
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token));

  // 2. Jika sesi tidak ditemukan
  if (!session) {
    throw new Error("Invalid token");
  }

  // 3. Cek apakah token sudah kadaluarsa
  if (session.expiresAt < new Date()) {
    // Auto logout: hapus sesi dari database
    await db.delete(sessions).where(eq(sessions.token, token));
    throw new Error("Token telah kadaluarsa");
  }

  // 4. Ambil data user berdasarkan userId dari sesi
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, session.userId));

  return user;
};
```

> **Catatan:** Pastikan `getCurrentUser` di-export agar bisa digunakan di `users-route.ts`.

---

### Langkah 2 — Tambahkan route `GET /current` di `users-route.ts`

File: `src/routes/users-route.ts`

**2a. Update import**

Tambahkan `getCurrentUser` ke dalam import dari `users-service`:

```typescript
// Sebelum:
import { registerUser, loginUser, logoutUser } from "../services/users-service";

// Sesudah:
import { registerUser, loginUser, logoutUser, getCurrentUser } from "../services/users-service";
```

**2b. Tambahkan route baru**

Tambahkan method `.get()` ke dalam chain `usersRoute` yang sudah ada, **setelah** route `POST /logout`:

```typescript
.get(
  "/current",
  async ({ request, set }) => {
    try {
      // 1. Ambil token dari header Authorization
      const auth = request.headers.get("authorization")?.split(" ")[1];

      // 2. Jika header tidak ada atau token kosong, kembalikan error
      if (!auth) {
        set.status = 401;
        return { status: "failed", error: "Token missing" };
      }

      // 3. Panggil service untuk mendapatkan data user
      const user = await getCurrentUser({ token: auth });

      return { status: "success", data: user };
    } catch (error: any) {
      set.status = 401;
      return { status: "failed", error: error.message || "Unauthorized" };
    }
  }
)
```

> **Catatan:** Route `.get("/current", ...)` tidak membutuhkan validasi body (`t.Object`),
> karena endpoint ini tidak menerima request body — hanya membaca header.

---

## Alur Lengkap (Flow)

```
Client
  │
  ├──► GET /api/users/current
  │    Header: Authorization: Bearer <token>
  │
  ▼
users-route.ts (GET /current)
  │  Ekstrak token dari header Authorization
  │  Jika tidak ada token → return 401 "Token missing"
  │
  ▼
users-service.ts (getCurrentUser)
  │  Query sessions WHERE token = <token>
  │  Jika tidak ditemukan → throw "Invalid token"
  │  Jika expiresAt < now → DELETE sesi + throw "Token telah kadaluarsa"
  │  Query users WHERE id = session.userId
  │
  ▼
users-route.ts
  │  Jika service throw error → return 401 + error.message
  │  Jika sukses → return 200 + data user
  │
  ▼
Client
  └──► Response JSON
```

---

## Tabel & Schema Database yang Digunakan

Tidak ada perubahan schema database. Fitur ini hanya membaca tabel yang sudah ada:

| Tabel      | Kolom yang Digunakan                                   |
| ---------- | ------------------------------------------------------ |
| `sessions` | `token`, `expires_at`, `user_id`                       |
| `users`    | `id`, `name`, `email`, `created_at`, `updated_at`      |

---

## Checklist Pengerjaan

- [ ] Tambahkan fungsi `getCurrentUser` di `src/services/users-service.ts`
- [ ] Export fungsi `getCurrentUser` dari `users-service.ts`
- [ ] Update import di `src/routes/users-route.ts` untuk menyertakan `getCurrentUser`
- [ ] Tambahkan route `GET /current` di `src/routes/users-route.ts`
- [ ] Test manual: kirim request dengan token valid → harus return data user
- [ ] Test manual: kirim request tanpa header Authorization → harus return `"Token missing"`
- [ ] Test manual: kirim request dengan token tidak valid → harus return `"Invalid token"`
- [ ] Test manual: kirim request dengan token yang sudah kadaluarsa → harus return `"Token telah kadaluarsa"` dan sesi terhapus dari database

---

## Referensi Kode yang Sudah Ada

Gunakan implementasi berikut sebagai referensi pola penulisan:

- **Route pattern** → lihat `POST /logout` di `src/routes/users-route.ts`
- **Service pattern** → lihat fungsi `logoutUser` di `src/services/users-service.ts`
