# 🔍 Analisis Penggunaan LayerManager di `contextMenu`

## ❓ Pertanyaan

Apakah cara menggunakan layerManager pada method `this.contextMenu` sudah benar?

---

## 📋 ANALISIS KODE SAAT INI

### Code Analysis:

```javascript
this.contextMenu = function (source, actions, options) {
  const menu = n.createElement("div", { class: "contextMenu" });
  const ul = n.createElement("ul");

  menu.append(ul);
  actions.forEach((action) => {
    const li = n.createElement("li", {
      html: `<a>${action.icon}${action.label}</a>`,
    });
    ul.append(li);
  });

  if (instance.contextMenu._lastContext) {
    // instance.contextMenu._lastContext.release();  // ❌ COMMENTED OUT!
  }

  n.layerManager.define("contextMenu", {
    source: source,
    causeExit: ["onblur", "onfocus"], // ⚠️ Ini untuk input focus
    overlay: {
      backdrop: false,
      matchWidth: false,
      attached: false,
      content: menu,
    },
    connected: async function (ev) {
      // ... logic
    },
  });
};
```

---

## ⚠️ MASALAH YANG DITEMUKAN

### 1️⃣ **Context Menu Lama Tidak Di-cleanup** ❌

```javascript
if (instance.contextMenu._lastContext) {
  // instance.contextMenu._lastContext.release();  // ❌ Commented!
}
```

**Problem:**

- Setiap buka context menu baru, context menu lama tidak ditutup
- Multiple context menus bisa aktif sekaligus
- Memory leak: Old context menus masih di DOM

**Impact:**

- DOM tree grows
- Memory accumulates
- Multiple overlays visible

---

### 2️⃣ **`causeExit` Tidak Tepat** ⚠️

```javascript
causeExit: ["onblur", "onfocus"],  // ⚠️ Untuk input/form!
```

**Problem:**

- `onblur` dan `onfocus` adalah untuk form elements (input, textarea, select)
- Context menu tidak ada "focus" concept
- Seharusnya tutup saat click diluar atau escape

**Better approach:**

```javascript
causeExit: ["escape"]; // ✅ Cukup escape key
```

---

### 3️⃣ **Logika `connected` Callback Kompleks** ⚠️

```javascript
if (ev.type === "init") {
  document.querySelectorAll(".contextMenu").forEach((c) => {
    if (!c.parentElement.contains(context)) {
      c.parentElement.release(); // ❌ Might fail!
      instance.contextMenu._lastContext = null;
    } else {
      instance.contextMenu._lastContext = context;
      n(context).css({ top: `${options.y}px`, left: `${options.x}px` });
    }
  });
}
```

**Problem:**

- Query semua `.contextMenu` setiap kali ada layer baru
- `c.parentElement.release()` - parent element mungkin tidak memiliki method ini
- Logika unclear

---

### 4️⃣ **Tidak Ada Positioning Default** ⚠️

```javascript
n(context).css({ top: `${options.y}px`, left: `${options.x}px` });
```

**Problem:**

- Bergantung pada `options` passed
- Jika `options` tidak ada → positioning error
- Harus robust

---

### 5️⃣ **Multiple Definition Tidak Handled** ❌

```javascript
n.layerManager.define("contextMenu", {
  // ... always named "contextMenu"
});
```

**Problem:**

- Setiap call define dengan nama "contextMenu" yang sama
- Tidak ada check duplicate
- Bisa error jika define ulang saat satu sedang active

---

## ✅ SOLUSI - IMPROVED VERSION

```javascript
this.contextMenu = function (source, actions, options) {
  // ✅ IMPROVEMENT 1: Close previous context menu
  if (instance.contextMenu._lastContext) {
    instance.contextMenu._lastContext.release?.(); // Safe call
  }

  // ✅ IMPROVEMENT 2: Create menu content
  const menu = n.createElement("div", {
    class: "contextMenu",
    style:
      "background: white; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 10000;",
  });
  const ul = n.createElement("ul", {
    style: "list-style: none; margin: 0; padding: 0;",
  });

  menu.append(ul);
  actions.forEach((action) => {
    const li = n.createElement("li", {
      html: `<a>${action.icon} ${action.label}</a>`,
      style:
        "padding: 8px 16px; cursor: pointer; display: flex; align-items: center; gap: 8px;",
    });

    // ✅ Add click handler untuk action
    li.addEventListener("click", () => {
      if (action.onClick) {
        action.onClick(source);
      }
      n.layerManager.close("contextMenu");
    });

    // ✅ Hover effect
    li.addEventListener(
      "mouseenter",
      () => (li.style.backgroundColor = "#f5f5f5")
    );
    li.addEventListener(
      "mouseleave",
      () => (li.style.backgroundColor = "transparent")
    );

    ul.append(li);
  });

  // ✅ IMPROVEMENT 3: Validate options
  const x = options?.x ?? 0;
  const y = options?.y ?? 0;

  // ✅ IMPROVEMENT 4: Define dengan proper configuration
  n.layerManager.define("contextMenu", {
    source: source,
    causeExit: ["escape"], // ✅ Hanya escape
    overlay: {
      backdrop: false, // ✅ Tidak perlu backdrop
      attached: false, // ✅ Free positioning
      matchWidth: false, // ✅ Natural width
      content: menu,
    },
    connected: function (ev) {
      if (ev.type === "init") {
        // ✅ IMPROVEMENT 5: Set position langsung di init
        n(this.context).css({
          position: "fixed",
          top: `${y}px`,
          left: `${x}px`,
          zIndex: 10000,
        });

        // ✅ Track context menu
        instance.contextMenu._lastContext = this.context;
      } else if (ev.type === "escape") {
        // ✅ Close on escape
        this.release();
        instance.contextMenu._lastContext = null;
      } else if (ev.type === "click") {
        // ✅ User clicked trigger again - close it
        this.release();
        instance.contextMenu._lastContext = null;
      }
    },
  });
};
instance.contextMenu._lastContext = null;
```

---

## 📊 PERBANDINGAN BEFORE vs AFTER

| Aspek              | Before ❌               | After ✅        |
| ------------------ | ----------------------- | --------------- |
| Previous cleanup   | Commented out           | Active          |
| causeExit          | `["onblur", "onfocus"]` | `["escape"]`    |
| Positioning        | In callback             | Direct in init  |
| Action handling    | None                    | Included        |
| Error handling     | Unsafe                  | Safe checks     |
| Multiple instances | Error prone             | Single instance |
| Code clarity       | Complex                 | Simple & clear  |

---

## 🎯 KEY IMPROVEMENTS

### 1. **Close Previous First**

```javascript
if (instance.contextMenu._lastContext) {
  instance.contextMenu._lastContext.release?.(); // Safe cleanup
}
```

### 2. **Correct causeExit**

```javascript
causeExit: ["escape"]; // ✅ Semantic untuk context menu
```

### 3. **Direct Positioning**

```javascript
if (ev.type === "init") {
  n(this.context).css({
    position: "fixed",
    top: `${y}px`,
    left: `${x}px`,
  });
}
```

### 4. **Add Action Handlers**

```javascript
li.addEventListener("click", () => {
  if (action.onClick) {
    action.onClick(source);
  }
  n.layerManager.close("contextMenu");
});
```

### 5. **Simple State Tracking**

```javascript
instance.contextMenu._lastContext = this.context; // Track for cleanup
```

---

## 🧪 TEST CASE

```javascript
// Usage
kernel.contextMenu(
  element,
  [
    {
      icon: "✏️",
      label: "Edit",
      onClick: (el) => console.log("Edit:", el),
    },
    {
      icon: "🗑️",
      label: "Delete",
      onClick: (el) => console.log("Delete:", el),
    },
  ],
  { x: 100, y: 200 }
);

// Expected:
// 1. Context menu appears at x:100, y:200 ✅
// 2. Previous context menu closed ✅
// 3. Click item triggers action ✅
// 4. Press ESC closes menu ✅
// 5. No memory leak ✅
```

---

## ⚠️ CURRENT ISSUES SUMMARY

| Issue                   | Status | Risk                             |
| ----------------------- | ------ | -------------------------------- |
| No previous cleanup     | ❌     | 🔴 High - Memory leak            |
| Wrong causeExit         | ⚠️     | 🟡 Medium - Unwanted behavior    |
| Complex callback        | ⚠️     | 🟡 Medium - Hard to maintain     |
| No action handlers      | ⚠️     | 🟡 Medium - Context menu useless |
| Unsafe `release()` call | ⚠️     | 🟡 Medium - Potential error      |

---

## ✅ RECOMMENDATION

**Current implementation:** ⚠️ Needs improvement

**Issues to fix:**

1. ✅ Uncomment & fix previous cleanup
2. ✅ Change causeExit to `["escape"]`
3. ✅ Simplify positioning logic
4. ✅ Add action handlers
5. ✅ Add safe error handling

**After fixes:** ✅ Production Ready

---

## 💡 NEXT STEPS

1. Replace current `this.contextMenu` dengan improved version
2. Update `actions` array format untuk include `onClick`
3. Test dengan different `options.x` dan `options.y`
4. Verify escape key closes menu
5. Check previous menu cleanup works

---

## 📌 SUMMARY

**Current usage:** ⚠️ Partially correct

- ✅ Basic structure okay
- ❌ Memory management issue (commented cleanup)
- ❌ Wrong event triggers
- ⚠️ No action handling

**Recommended fixes:** 5 improvements for production ready
