# SunQuery Instance Method: `load`

`load` adalah **instance method** pada SunQuery untuk memuat konten dari URL secara asynchronous dan menampilkan hasilnya langsung ke elemen target. Method ini mendukung **selector filter**, **POST data**, dan **callback untuk memodifikasi hasil** sebelum render.

---

## 1. Sintaks Dasar

```js
// Load URL sederhana
q("selector").load(url);

// Load URL dengan filter selector
q("selector").load(url + " #filter");

// Load URL dengan opsi tambahan
q("selector").load(url, options);
```

---

## 2. Contoh Penggunaan (Final API)

### 2.1 Load URL sederhana

```js
q("main").load("https://example.com");
```

### 2.2 Load URL dengan selector filter

```js
q("main").load("https://example.com #info");
```

### 2.3 Load URL dengan opsi tambahan

```js
q("main").load("https://example.com", {
  data: { userId: 123 },
  status: (st) => {
    console.log("Status:", st);
  },
  onResults: (res) => {
    return res.replace(/Example/g, "SunQuery");
  },
});
```

---

## 3. Parameter `options`

| Properti    | Tipe     | Default | Deskripsi                                        |
| ----------- | -------- | ------- | ------------------------------------------------ |
| `data`      | object   | `{}`    | Data yang dikirim ke server (POST request)       |
| `status`    | function | `null`  | Callback menerima status `success` / `error`     |
| `onResults` | function | `null`  | Callback untuk memodifikasi hasil sebelum render |

**Catatan:** Jika `data` diberikan, request akan menggunakan **POST**. Jika tidak, menggunakan **GET**.

---

## 4. Selector Filter

Kamu bisa memfilter bagian tertentu dari response HTML menggunakan CSS selector.

```js
q("main").load("/page.html #content");
```

Hanya elemen yang cocok dengan `#content` yang akan dirender ke elemen target.

---

## 5. Fitur Utama

- Memuat konten dari URL secara **asynchronous**
- Mendukung **CSS selector filter** untuk memuat bagian tertentu
- Mendukung **POST request** melalui `data`
- Callback **status** untuk memonitor success/error
- Callback **onResults** untuk memodifikasi response sebelum render
- Mendukung **chaining** dengan method SunQuery lainnya

### Contoh Chaining

```js
q("#content").load("/page.html").fadeIn();
```

---

## 6. Default Behavior

Jika `options` tidak diberikan:

```js
q("selector").load(url);
```

- Request menggunakan **GET**
- Semua konten di-render ke elemen target
- Tidak ada callback `status` atau `onResults`

Jika `url` menggunakan selector filter, SunQuery tetap memuat konten secara asynchronous dan mengekstrak elemen yang sesuai.

---

## 7. Contoh Kasus Nyata

### 7.1 Memuat artikel terbaru

```js
q("#article").load("/articles/latest");
```

### 7.2 Memuat bagian sidebar tertentu

```js
q("#sidebar").load("/pages/info #contact");
```

### 7.3 Memodifikasi hasil sebelum render

```js
q("#main").load("/posts", {
  onResults: (res) => res.toUpperCase(),
});
```

### 7.4 POST request dengan data dan status callback

```js
q("#result").load("/submit", {
  data: { name: "Widodo", age: 30 },
  status: (st) => console.log("Request status:", st),
});
```

---

## 8. Catatan Penting

- `load` adalah **instance method**, berbeda dengan `q.modal()` yang static
- Selector filter (`url #selector`) memerlukan HTML valid dari server
- Mendukung chaining dengan method SunQuery lainnya
- Callback `onResults` dapat mengembalikan string HTML atau elemen DOM
- Semua request otomatis **asynchronous**, sehingga UI tetap responsif

---

## 9. Penutup

`load` SunQuery adalah alat yang fleksibel untuk SPA atau aplikasi dinamis, memungkinkan:

- Load konten sederhana
- Filter selector spesifik
- POST request dengan data
- Modifikasi hasil sebelum render
- Integrasi chaining method SunQuery

Dokumentasi ini merupakan **versi final** dari instance method `load` SunQuery.
