# 📋 Review LayerManager - Analisis Mendalam

## ✅ Aspek Positif

### 1. **Arsitektur & Desain**

- ✓ Singleton pattern (IIFE) tepat untuk layer manager
- ✓ Menggunakan private fields (#) untuk enkapsulasi yang baik
- ✓ Stack-based management untuk mengelola multiple layers
- ✓ Event-driven architecture dengan callback controller

### 2. **Fungsionalitas**

- ✓ Mendukung overlay dengan backdrop
- ✓ Attachment relative positioning ke trigger element
- ✓ Responsive positioning dengan scroll listener
- ✓ Event handlers untuk escape key, blur/focus
- ✓ Content type detection (HTML, string, array, object)

---

## ⚠️ MASALAH KRITIS

### 1. **Memory Leak - Scroll Event Listener Tidak Ter-cleanup**

**Lokasi:** Line 176 di `#createOverlay()`

```javascript
container.bindEvent(cfg.overlay.scrollParent, "scroll", reposition);
```

**Masalah:**

- Scroll listener didaftarkan tapi tidak pernah di-remove saat overlay ditutup
- Setiap kali membuka overlay akan menambah listener baru
- Jika dibuka/ditutup berkali-kali → memory leak signifikan

**Dampak:** Semakin sering buka-tutup = semakin slow

**Fix:**

```javascript
// Simpan reference untuk cleanup nanti
const scrollHandler = cfg.overlay.scrollParent.bindEvent(
  cfg.overlay.scrollParent,
  "scroll",
  reposition,
  { capture: false }
);
cfg.scrollHandler = {
  parent: cfg.overlay.scrollParent,
  handler: scrollHandler,
};
```

---

### 2. **Event Listener Duplikasi - #eventController()**

**Lokasi:** Line 17-99 di `#eventController()`

```javascript
#eventController() {
   // ... bindEvent dipanggil setiap kali
```

**Masalah:**

- `#eventController()` dipanggil di setiap `define()` call
- Event handlers untuk `keydown` dan `click` di-register berulang kali
- Tidak ada pengecekan apakah sudah di-register sebelumnya

**Dampak:**

- Multiple event handlers untuk satu event
- Performa menurun drastis saat banyak layer aktif
- Logic `causeExit` bisa executed berkali-kali

**Fix:**

```javascript
#eventController() {
   const self = this;
   const elBinding = this.#cfg.overlay ? this.#cfg.context : this.#cfg.src;

   // Hanya register sekali dengan ID unik per action
   const eventId = `layerManager_${this.#cfg.actName}`;

   // Cek jika sudah ada
   if (elBinding.hasEvent?.(eventId)) return;

   elBinding.bindEvent(d, "keydown", function(ev) { ... }, { id: eventId });
}
```

---

### 3. **Memory Leak - Backdrop Element Cleanup**

**Lokasi:** Line 225 di `#releaseStackManager()`

```javascript
if (stack.overlay?.backdrop) {
  if (stack.context.parentElement.matches(".sQ__backdrop")) {
    stack.context.parentElement.remove();
  }
  if (stack.context.parentElement.matches(".backdrop")) {
    stack.context.parentElement.remove();
  }
}
```

**Masalah:**

- Pengecekan class selector kurang efisien
- Bisa ada orphaned backdrop elements
- `log('AA')` production code (debug statement)

**Fix:**

```javascript
if (stack.overlay?.backdrop) {
  const backdrop = stack.context?.parentElement;
  if (backdrop?.classList.contains("backdrop")) {
    backdrop.remove();
  }
}
```

---

### 4. **Tidak Ada Cleanup Event Handler Global**

**Lokasi:** `#eventController()` lines 17-99
**Masalah:**

- Event listeners di `document` dan `document.body` tidak pernah di-remove
- Accumulates saat banyak layer dibuka/ditutup
- Bahkan saat semua layer ditutup, handlers masih aktif

**Fix:**
Perlu tracking untuk cleanup:

```javascript
#releaseStackManager(ctx) {
   // ... existing code

   // Cleanup event listeners jika tidak ada layer aktif lagi
   if (this.#stack.name.every(name => !Array.isArray(this.#stack[name]) || this.#stack[name].length === 0)) {
      d.removeEvent("layerManager");
      d.body.removeEvent("layerManager");
   }
}
```

---

### 5. **Race Condition - Async `#createOverlay()`**

**Lokasi:** Line 101 async function

```javascript
async #createOverlay(callback) {
   // ... if (n.helper.isURL(cfg.overlay.content)) {
   content = await n.ajax({ url: cfg.overlay.content });
```

**Masalah:**

- Jika user menutup layer sebelum AJAX selesai → callback dijalankan untuk layer yang sudah dihapus
- State mungkin tidak konsisten
- Tidak ada cancellation mechanism

**Fix:**

```javascript
async #createOverlay(callback) {
   const self = this;
   const cfg = this.#cfg;
   const abortController = new AbortController();
   cfg.abortController = abortController;

   try {
      if (n.helper.isURL(cfg.overlay.content)) {
         content = await n.ajax({
            url: cfg.overlay.content,
            signal: abortController.signal
         });
      }
   } catch (error) {
      if (error.name !== 'AbortError') {
         console.error(error);
      }
      return;
   }
}

#releaseStackManager(ctx) {
   // ... dalam matches.forEach
   stack.overlay?.abortController?.abort();
}
```

---

### 6. **Performance Issue - `#createBackdrop()` Selector Query**

**Lokasi:** Line 225

```javascript
if (stack.context.parentElement.matches(".sQ__backdrop")) {
```

**Masalah:**

- `matches()` di-loop bisa di-optimize
- Tidak perlu selector matching jika sudah tahu parent-nya

**Fix:**

```javascript
const parent = stack.context?.parentElement;
if (
  parent?.hasAttribute?.("backdrop") ||
  parent?.classList?.contains("backdrop")
) {
  parent.remove();
}
```

---

### 7. **Configuration State - `#cfg` Overwriting**

**Lokasi:** Line 261

```javascript
this.#cfg = {
  actName: actionName,
  src: opts.source,
  // ... semua state disimpan di #cfg tunggal
};
```

**Masalah:**

- Hanya ada 1 `#cfg` untuk semua layer
- Jika `define()` dipanggil saat layer sebelumnya masih aktif → `#cfg` di-overwrite
- Bisa corrupt state layer lain

**Contoh masalah:**

```javascript
n.layerManager.define("modal1", { ... }); // #cfg sekarang untuk modal1
n.layerManager.define("contextMenu", { ... }); // #cfg di-overwrite! modal1 rusak
```

**Fix:**
Gunakan config per-layer, bukan global:

```javascript
define(actionName, opts = {}) {
   const cfg = { // bukan this.#cfg
      actName: actionName,
      src: opts.source,
      // ...
   };
   // gunakan cfg di tempat-tempat yang sebelumnya gunakan this.#cfg
}
```

---

## 🔧 REKOMENDASI PERBAIKAN

### Priority 1 (Kritis - Buat sekarang):

1. ✓ Cleanup scroll event listener
2. ✓ Prevent duplicate event controllers
3. ✓ Fix race condition async AJAX
4. ✓ Remove debug log `log('AA')`

### Priority 2 (Penting - Segera):

1. Gunakan local `cfg` bukan `this.#cfg` global
2. Add `hasEvent()` check before binding
3. Cleanup global event listeners saat tidak ada layer
4. Better backdrop cleanup logic

### Priority 3 (Improvement):

1. Add WeakMap untuk tracking event handlers
2. Implement AbortController untuk async operations
3. Add performance metrics/logging
4. Optimize querySelector/matches calls

---

## 📊 Perbandingan: Sebelum vs Sesudah

| Aspek                    | Sebelum       | Sesudah             |
| ------------------------ | ------------- | ------------------- |
| Memory (100x buka/tutup) | 🔴 High leak  | 🟢 Clean            |
| Event listeners          | 🔴 Accumulate | 🟢 Properly managed |
| Performance              | 🟠 Degrades   | 🟢 Stable           |
| Race conditions          | 🔴 Exists     | 🟢 Handled          |
| Code clarity             | 🟠 Okay       | 🟢 Better           |

---

## 📝 Kesimpulan

**Status:** Struktur bagus tapi ada **3 memory leak kritis** yang perlu diperbaiki.

**Estimasi dampak jika tidak diperbaiki:**

- Setelah 50-100x buka/tutup modal → website mulai lag
- Long-running session → potential crash

**Rekomendasi:** Implementasikan Priority 1 sekarang, Priority 2 sebelum production.
