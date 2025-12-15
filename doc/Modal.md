# SunQuery Modal

Dokumentasi ini menjelaskan cara penggunaan **static method `q.modal()`** pada library **SunQuery**.

Method ini digunakan untuk membuat dan menampilkan modal dialog secara dinamis, mirip dengan konsep modal pada jQuery-based UI library, namun dengan pendekatan modern dan fleksibel.

---

## 1. Sintaks Dasar

```js
q.modal(options);
```

`q.modal()` merupakan **static method**, sehingga dipanggil langsung dari objek utama `q`, bukan dari instance hasil seleksi elemen.

---

## 2. Contoh Penggunaan

```js
q.modal({
  source: this, // elemen pemicu
  content: "form-login.html", // url | string | html | stringHtml
  size: "md", // ukuran modal
});
```

Contoh di atas akan:

- Membuka sebuah modal
- Mengambil konten dari file `form-login.html`
- Menampilkan modal dengan ukuran sedang (`md`)
- Mengaitkan modal dengan elemen pemicu (`source`)

---

## 3. Parameter `options`

Parameter `options` berupa **object konfigurasi** yang bersifat opsional namun sangat disarankan untuk dikustomisasi.

### 3.1 `source`

```js
source: Element | null;
```

**Deskripsi:**
Elemen DOM yang menjadi pemicu modal (misalnya tombol atau link).

**Fungsi:**

- Menentukan konteks modal
- Dapat digunakan untuk positioning
- Dapat dimanfaatkan untuk callback atau auto-close

**Contoh:**

```js
source: document.querySelector("#btnLogin");
```

---

### 3.2 `content`

```js
content: string;
```

**Deskripsi:**
Isi modal yang akan ditampilkan.

**Jenis konten yang didukung:**

| Tipe         | Contoh                          | Keterangan                      |
| ------------ | ------------------------------- | ------------------------------- |
| URL          | `"form-login.html"`             | Konten di-load via AJAX / fetch |
| Plain Text   | `"Hello World"`                 | Ditampilkan sebagai teks        |
| HTML String  | `"<b>Login</b>"`                | Dirender sebagai HTML           |
| HTML Element | `document.createElement('div')` | Elemen DOM langsung             |

**Catatan:**
Jika berupa URL, SunQuery akan memuat konten secara asynchronous.

---

### 3.3 `size`

```js
size: "sm" | "md" | "lg" | "xl";
```

**Deskripsi:**
Menentukan ukuran modal.

**Pilihan ukuran:**

| Value | Keterangan             |
| ----- | ---------------------- |
| `sm`  | Modal kecil            |
| `md`  | Modal sedang (default) |
| `lg`  | Modal besar            |
| `xl`  | Modal ekstra besar     |

**Contoh:**

```js
size: "lg";
```

---

## 4. Default Configuration

Jika parameter tidak diisi, SunQuery akan menggunakan nilai default berikut:

```js
q.modal({
  source: null,
  content: "",
  size: "md",
});
```

---

## 5. Perilaku Modal

Secara default, modal yang dibuat dengan `q.modal()` memiliki perilaku sebagai berikut:

- Modal **dibungkus oleh sebuah elemen backdrop** yang dibuat otomatis
- Backdrop berfungsi sebagai:

  - Overlay latar belakang
  - Wrapper utama modal
  - Penangkap interaksi (klik / keyboard)

Struktur DOM secara konseptual:

```html
<div class="backdrop">
  <div class="modal md">
    <!-- konten modal -->
  </div>
</div>
```

- Backdrop dan modal **ditambahkan ke DOM secara dinamis**
- Satu modal selalu memiliki satu backdrop

---

## 6. Menutup / Keluar dari Modal

SunQuery menyediakan beberapa cara bawaan (default) untuk menutup modal.

### 6.1 Menutup Modal dengan Keyboard (ESC)

- Menekan tombol **`ESC`** akan otomatis menutup modal yang sedang aktif
- Event ini hanya aktif selama modal terbuka

Perilaku ini cocok untuk meningkatkan **aksesibilitas (UX)**.

---

### 6.2 Menutup Modal dengan Tombol `[dismiss="modal"]`

Elemen apa pun di dalam modal yang memiliki attribute berikut:

```html
dismiss="modal"
```

akan otomatis berfungsi sebagai **tombol penutup modal**.

**Contoh:**

```html
<button dismiss="modal">Tutup</button>
```

atau

```html
<a href="#" dismiss="modal">Close</a>
```

Ketika elemen tersebut diklik:

- Modal akan ditutup
- Backdrop akan dihapus dari DOM

---

### 6.3 Menutup Modal dengan Klik Backdrop

- Klik pada area backdrop (di luar modal) akan menutup modal
- Klik di dalam area modal **tidak** menutup modal

---

## 6. Contoh Kasus Nyata

### 6.1 Modal Login

```js
document.querySelector("#loginBtn").addEventListener("click", function () {
  q.modal({
    source: this,
    content: "form-login.html",
    size: "sm",
  });
});
```

### 6.2 Modal Informasi Sederhana

```js
q.modal({
  content: "<h3>Info</h3><p>Operasi berhasil</p>",
  size: "md",
});
```

---

## 7. Catatan Penting

- `q.modal()` adalah **static method**, bukan instance method
- Konten URL dimuat secara asynchronous
- Modal dapat dikembangkan dengan fitur lanjutan seperti:

  - Callback lifecycle (`onOpen`, `onClose`)
  - Animasi
  - Integrasi dengan event SunQuery

---

## 8. Penutup

Method `q.modal()` dirancang agar:

- Mudah digunakan
- Fleksibel
- Konsisten dengan filosofi SunQuery

Dokumentasi ini dapat dikembangkan seiring bertambahnya fitur modal di SunQuery.
