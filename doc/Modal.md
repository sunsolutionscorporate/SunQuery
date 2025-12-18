# SunQuery Modal

Dokumentasi ini menjelaskan penggunaan **static method `q.modal()`** pada library **SunQuery**.

Modal pada SunQuery dirancang dengan konsep **separation of concern**, antara:

- **UI / struktur visual** (header)
- **Perilaku / interaksi** (dismiss)
- **Konfigurasi inti modal** (content, size, source)

---

## 1. Sintaks Dasar

```js
q.modal(options);
```

`q.modal()` adalah **static method**, dipanggil langsung dari objek utama `q`.

---

## 2. Contoh Penggunaan (Final API)

```js
q.modal({
  header: {
    title: "Contoh",
    close: true,
  },

  dismiss: {
    esc: true,
    backdrop: true,
  },

  source: this, // elemen pemicu (opsional)
  content: "contoh.html", // url | string | html | element
  size: "md", // sm | md | lg | xl (dinormalisasi)
});
```

---

## 3. Parameter `options`

### 3.1 `header`

Mengatur bagian **header modal** (opsional).

```js
header: {
  title: string | HTMLstring,
  close: boolean,
}
```

#### Properti

| Properti | Default | Deskripsi                             |
| -------- | ------- | ------------------------------------- |
| `title`  | `null`  | Judul modal (string atau HTML string) |
| `close`  | `true`  | Menampilkan tombol close di header    |

**Catatan:**

- Jika `header` tidak didefinisikan, header tidak dibuat
- Tombol close `true` saat title didefinisikan

---

### 3.2 `dismiss`

Mengatur **perilaku penutupan modal**.

```js
dismiss: {
  esc: boolean,
  backdrop: boolean,
}
```

| Properti   | Default | Deskripsi                          |
| ---------- | ------- | ---------------------------------- |
| `esc`      | `true`  | Menutup modal dengan tombol ESC    |
| `backdrop` | `true`  | Menutup modal dengan klik backdrop |

**Catatan:**

- Semua elemen dengan attribute `dismiss="modal"` akan menutup modal

---

### 3.3 `content`

```js
content: string | HTMLElement;
```

Menentukan isi modal.

Jenis konten yang didukung:

| Tipe        | Contoh                          | Keterangan                    |
| ----------- | ------------------------------- | ----------------------------- |
| URL         | `'login.html'`                  | Dimuat secara asynchronous    |
| Text        | `'Hello World'`                 | Ditampilkan sebagai teks      |
| HTML String | `'<b>Login</b>'`                | Dirender sebagai HTML         |
| Element     | `document.createElement('div')` | Elemen DOM langsung           |
| Array       | `[div,span]`                    | Array yang berisis Elemen DOM |

---

### 3.4 `size`

```js
size: string;
```

Menentukan ukuran modal. SunQuery akan **menormalisasi nilai size**.

Nilai yang didukung:

| Input          | Dinormalisasi ke |
| -------------- | ---------------- |
| `sm`, `small`  | `sm`             |
| `md`, `medium` | `md` (default)   |
| `lg`, `large`  | `lg`             |

---

### 3.5 `source`

```js
source: HTMLElement | null;
```

Elemen pemicu modal.

Digunakan untuk:

- Konteks pembukaan modal
- Pengembalian fokus
- Integrasi event lanjutan

Properti ini **opsional**.

---

## 4. Backdrop & Struktur DOM

Setiap modal otomatis dibungkus oleh **backdrop**.

Struktur konseptual:

```html
<div class="backdrop">
  <div class="modal md">
    <div class="modal-header">...</div>
    <div class="modal-body">...</div>
  </div>
</div>
```

- Backdrop dibuat dan dihapus otomatis
- Satu modal selalu memiliki satu backdrop

---

## 5. Cara Menutup Modal

Modal dapat ditutup melalui:

1. Tombol close di header
2. Elemen dengan attribute:

```html
dismiss="modal"
```

3. Tombol **ESC** (jika `dismiss.esc = true`)
4. Klik backdrop (jika `dismiss.backdrop = true`)

---

## 6. Default Configuration

Jika tidak ditentukan, SunQuery menggunakan default berikut:

```js
q.modal({
  header: null,
  dismiss: {
    esc: true,
    backdrop: true,
  },
  size: "md",
});
```

---

## 7. Catatan Desain

- `q.modal()` adalah **static method**
- API mengikuti prinsip **UI vs Behavior separation**
- Modal bersifat extensible untuk fitur lanjutan seperti:

  - lifecycle hooks
  - animasi
  - modal stack
  - aksesibilitas

---

## 8. Penutup

Desain API modal SunQuery difokuskan pada:

- Kejelasan
- Konsistensi
- Skalabilitas

Dokumentasi ini merupakan **versi final** dari API modal SunQuery.
