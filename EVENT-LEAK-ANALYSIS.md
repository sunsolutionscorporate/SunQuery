# ⚠️ Event Listener Memory Leak Analysis

## Problem Statement

Event listeners pada `document` dan `document.body` yang di-register oleh LayerManager TIDAK benar-benar terhapus saat `.release()` dipanggil.

## Root Cause

### Bagian 1: Event Listeners di-Register tapi Tidak di-Remove

**File:** `layerManager-improved.js` (lines 54-57)

```javascript
// ✅ IMPROVEMENT 2: Proper event binding dengan ID untuk tracking
elBinding.bindEvent(d, "keydown", keydownHandler, { id: eventId });
elBinding.bindEvent(d.body, "click", clickHandler, { id: eventId });

this.#eventRegistered.add(eventId);
```

**Problem:**

- Event listeners di-bind ke **`document` (d)** dan **`document.body` (d.body)**
- `#eventRegistered` hanya track apakah event sudah di-register SEKALI
- Ketika `.release()` dipanggil, TIDAK ada kode untuk remove listeners dari document/body
- Listeners tetap aktif dan "mendengarkan" click/keydown global

### Bagian 2: Release Stack Manager TIDAK Remove Global Events

**File:** `layerManager-improved.js` (lines 225-280)

```javascript
#releaseStackManager(ctx) {
   // ... cleanup code ...
   matches.forEach(({ name, index, stack }) => {
      // ✅ IMPROVEMENT 6: Clear scroll handler reference
      if (stack.scrollReposition) {
         stack.scrollReposition = null;
         stack.scrollParentElement = null;
      }

      // ✅ IMPROVEMENT 7: Abort pending AJAX requests
      if (stack.abortController) {
         stack.abortController.abort();
         stack.abortController = null;
      }

      this.#stack[name].splice(index, 1);

      // ✅ IMPROVEMENT 8: Better backdrop cleanup logic
      if (stack.overlay?.backdrop) {
         const parent = stack.context?.parentElement;
         if (parent && parent.classList.contains("backdrop")) {
            parent.remove();
         }
      }

      // ✅ IMPROVEMENT 9: Proper content cleanup
      if (stack.overlay?.backdrop || stack.overlay?.content) {
         Array.from(stack.context.childNodes).forEach(el => {
            if (el.nodeType === Node.ELEMENT_NODE || el.nodeType === Node.TEXT_NODE) {
               el.remove();
            }
         });
         stack.context?.remove?.();
      }

      // ✅ IMPROVEMENT 10: Cleanup WeakMap reference
      this.#activeOverlays.delete(stack.context);
   });
}
```

**Problem:**

- TIDAK ada code untuk remove listeners dari `d` (document) dan `d.body`
- Hanya cleanup DOM, AJAX controllers, dan WeakMap
- Global event listeners terus menumpuk dengan setiap `.define()` call

### Bagian 3: SunQuery's `bindEvent` Method

**Asumsi:** SunQuery `bindEvent()` method memiliki signature:

```javascript
bindEvent(element, eventName, handler, options);
// options.id untuk tracking
```

**Masalah:**

- Tidak ada built-in `.removeEvent()` method (sudah diketahui)
- Jika ada `.unbindEvent()` atau `.removeEventListener()`, tidak digunakan

## Impact

### Memory Leak Scenario

```
1st `.define("contextMenu")` call:
   - Event listener "keydown" registered on document (stays forever)
   - Event listener "click" registered on document.body (stays forever)

2nd `.define("contextMenu")` call:
   - Check: #eventRegistered.has("layerManager_contextMenu") = true
   - SKIPPED registration (good)
   - But old listeners STILL ACTIVE

3rd `.release()` call:
   - Remove DOM elements ✅
   - Abort AJAX ✅
   - Delete WeakMap ✅
   - Remove global listeners ❌ ← MISSING

Result: Multiple event listeners stacked on document, all firing on keydown/click
```

### Performance Impact

- **Browser memory usage increases** with each contextMenu open/close cycle
- **Event handler executions slow down** as multiple handlers check conditions
- **CPU usage increases** during interactions (document-wide events)
- **Memory leak persists** until browser refresh

## Solution Options

### Option A: Store Handler References (Best)

Track handler function references so they can be properly removed:

```javascript
const layerManager = new (class LayerManager {
  #stack = { name: [] };
  #eventRegistered = new Set();
  #activeOverlays = new WeakMap();

  // ✅ NEW: Store handler references by event ID
  #eventHandlers = new Map();

  #eventController(actionName) {
    const eventId = `layerManager_${actionName}`;
    if (this.#eventRegistered.has(eventId)) return;

    const self = this;
    // ... existing code ...

    const keydownHandler = function (ev) {
      // existing handler code
    };

    const clickHandler = function (ev) {
      // existing handler code
    };

    // ✅ NEW: Store handler references
    this.#eventHandlers.set(`${eventId}_keydown`, {
      element: d,
      eventName: "keydown",
      handler: keydownHandler,
    });

    this.#eventHandlers.set(`${eventId}_click`, {
      element: d.body,
      eventName: "click",
      handler: clickHandler,
    });

    elBinding.bindEvent(d, "keydown", keydownHandler, { id: eventId });
    elBinding.bindEvent(d.body, "click", clickHandler, { id: eventId });

    this.#eventRegistered.add(eventId);
  }

  #releaseEventHandlers(actionName) {
    const eventId = `layerManager_${actionName}`;

    // Remove keydown listener
    const keydownEntry = this.#eventHandlers.get(`${eventId}_keydown`);
    if (keydownEntry) {
      // Cari method untuk remove di SunQuery:
      // Option 1: n(element).off(eventName, handler)
      // Option 2: n(element).unbindEvent(id)
      // Option 3: element.removeEventListener(eventName, handler)

      keydownEntry.element.removeEventListener?.(
        keydownEntry.eventName,
        keydownEntry.handler
      );
      this.#eventHandlers.delete(`${eventId}_keydown`);
    }

    // Remove click listener
    const clickEntry = this.#eventHandlers.get(`${eventId}_click`);
    if (clickEntry) {
      clickEntry.element.removeEventListener?.(
        clickEntry.eventName,
        clickEntry.handler
      );
      this.#eventHandlers.delete(`${eventId}_click`);
    }

    this.#eventRegistered.delete(eventId);
  }

  #releaseStackManager(ctx) {
    // ... existing cleanup ...

    // ✅ NEW: Call removeEventHandlers when last stack of action is removed
    matches.forEach(({ name, index, stack }) => {
      // ... existing cleanup ...

      // Check if this is the last stack for this action
      if (this.#stack[name].length === 1) {
        this.#releaseEventHandlers(name);
      }
    });
  }
})();
```

### Option B: Single Global Event Controller

Register ONLY ONE keydown and click listener globally that handles ALL layers:

```javascript
#initGlobalEventListeners() {
   const self = this;

   const keydownHandler = function (ev) {
      if (ev.key === "Escape") {
         const level = n.face.compareAll(
            ...n("sunquery-panel[fullscreen]").get(),
            "sunquery-overlay"
         );
         const topLevel = level && level.details.length ? level.details[0] : null;
         if (topLevel) {
            for (const name of self.#stack.name) {
               const size = self.#stack[name]?.length;
               const stack = self.#stack[name][size - 1];
               if (stack?.context === topLevel.el) {
                  self.#callbackController("escape", stack);
               }
            }
         }
      }
   };

   const clickHandler = function (ev) {
      for (const name of self.#stack.name) {
         const matches = self.#stack[name]?.filter((ar) => ar.src !== ev.target);
         if (!matches) continue;
         for (const item of matches) {
            if (!item.ext.includes("onblur")) break;
            const eventType = item.context.contains(ev.target) ? "onfocus" : "onblur";
            self.#callbackController(eventType, {
               ...item,
               target: ev.target,
            });
         }
      }
   };

   // Only register ONCE, globally
   if (!this.#globalListenersInitialized) {
      d.addEventListener('keydown', keydownHandler);
      d.body.addEventListener('click', clickHandler);
      this.#globalListenersInitialized = true;

      // Store reference for cleanup if needed
      this.#globalKeydownHandler = keydownHandler;
      this.#globalClickHandler = clickHandler;
   }
}
```

## Recommendation

**Option A** (Store Handler References) is BETTER karena:

1. ✅ Allows per-layer event cleanup
2. ✅ Compatible dengan existing `#eventController` pattern
3. ✅ More granular control
4. ✅ Preserves original architecture

**Option B** (Single Global) is SIMPLER tetapi:

1. ❌ Listeners stay even when no layers active
2. ❌ Less granular control
3. ❌ Requires architecture change

## Testing Method

Buka DevTools → Performance/Memory tab:

```javascript
// Test 1: Memory leak confirmation
for (let i = 0; i < 10; i++) {
  const menu = n.createElement("div", { class: "testMenu" });
  n.layerManager.define("test_" + i, {
    source: document.body,
    overlay: { content: menu },
  });
  setTimeout(() => {
    document.querySelector('[actionName="test_' + i + '"]')?.release?.();
  }, 100);
}
// Check DevTools for lingering event listeners on document

// Test 2: After fix
// Same code should show listeners properly removed
```

## Files Affected

- `layerManager-improved.js` - Main implementation to fix
- `public/assets/builder/src/sunquery/extensions/statics.js` - Original implementation reference
