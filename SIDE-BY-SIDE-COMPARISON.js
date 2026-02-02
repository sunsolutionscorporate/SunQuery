// SIDE-BY-SIDE COMPARISON: Original vs Fixed Event Leak
// Fokus pada perbedaan kunci yang menyebabkan memory leak

/**
 * ============================================================================
 * ORIGINAL CODE (Memory Leak Issue)
 * ============================================================================
 */

class LayerManager_ORIGINAL {
   #stack = { name: [] };
   #eventRegistered = new Set();

   // ❌ MISSING: Tidak ada tracking untuk handler references

   #eventController() {
      const self = this;
      const eventId = `layerManager`;

      // ❌ PROBLEM 1: Event di-bind ke document tapi tidak disimpan referensi-nya
      elBinding.bindEvent(d, "keydown", function (ev) {
         if (ev.key === "Escape") {
            // ... handler logic
         }
      }, { id: eventId });

      elBinding.bindEvent(d.body, "click", function (ev) {
         // ... handler logic
      }, { id: eventId });

      // ❌ PROBLEM 2: Hanya track bahwa event sudah register, bukan reference-nya
      this.#eventRegistered.add(eventId);
   };

   #releaseStackManager(ctx) {
      const matches = findStackByContext(ctx);

      matches.forEach(({ name, index, stack }) => {
         this.#stack[name].splice(index, 1);

         // ✅ Remove DOM
         if (stack.overlay?.backdrop) {
            stack.context.parentElement.remove();
         }

         // ✅ Remove AJAX
         if (stack.abortController) {
            stack.abortController.abort();
         }

         // ✅ Remove WeakMap
         this.#activeOverlays.delete(stack.context);

         // ❌ MISSING: No code to remove event listeners!
         // Listeners masih aktif di document global!
      });
   };
}

/**
 * ============================================================================
 * FIXED CODE (No Memory Leak)
 * ============================================================================
 */

class LayerManager_FIXED {
   #stack = { name: [] };
   #eventRegistered = new Set();

   // ✅ SOLUTION 1: Add tracking untuk handler references
   #eventHandlers = new Map();
   #globalListeners = new Map();

   #eventController(actionName) {
      const self = this;
      const eventId = `layerManager_${actionName}`;

      if (this.#eventRegistered.has(eventId)) return;

      // ✅ SOLUTION 2: Store handler functions dalam variables
      const keydownHandler = function (ev) {
         if (ev.key === "Escape") {
            // ... handler logic
         }
      };

      const clickHandler = function (ev) {
         // ... handler logic
      };

      // ✅ SOLUTION 3: Simpan handler reference untuk nanti bisa di-remove
      this.#eventHandlers.set(`${eventId}_keydown`, {
         element: d,
         eventName: 'keydown',
         handler: keydownHandler
      });

      this.#eventHandlers.set(`${eventId}_click`, {
         element: d.body,
         eventName: 'click',
         handler: clickHandler
      });

      // Bind ke document
      elBinding.bindEvent(d, "keydown", keydownHandler, { id: eventId });
      elBinding.bindEvent(d.body, "click", clickHandler, { id: eventId });

      this.#eventRegistered.add(eventId);
      this.#globalListeners.set(eventId, true);
   };

   // ✅ SOLUTION 4: Tambah method baru untuk remove event listeners
   #releaseEventHandlers(actionName) {
      const eventId = `layerManager_${actionName}`;

      // Remove keydown listener
      const keydownEntry = this.#eventHandlers.get(`${eventId}_keydown`);
      if (keydownEntry) {
         keydownEntry.element.removeEventListener(
            keydownEntry.eventName,
            keydownEntry.handler
         );
         this.#eventHandlers.delete(`${eventId}_keydown`);
      }

      // Remove click listener
      const clickEntry = this.#eventHandlers.get(`${eventId}_click`);
      if (clickEntry) {
         clickEntry.element.removeEventListener(
            clickEntry.eventName,
            clickEntry.handler
         );
         this.#eventHandlers.delete(`${eventId}_click`);
      }

      this.#eventRegistered.delete(eventId);
      this.#globalListeners.delete(eventId);
   };

   #releaseStackManager(ctx) {
      const matches = findStackByContext(ctx);

      matches.forEach(({ name, index, stack }) => {
         this.#stack[name].splice(index, 1);

         // ✅ Remove DOM
         if (stack.overlay?.backdrop) {
            stack.context.parentElement.remove();
         }

         // ✅ Remove AJAX
         if (stack.abortController) {
            stack.abortController.abort();
         }

         // ✅ Remove WeakMap
         this.#activeOverlays.delete(stack.context);

         // ✅ SOLUTION 5: NEW - Remove event listeners saat last layer di-close
         if (this.#stack[name].length === 0) {
            this.#releaseEventHandlers(name);
         }
      });
   };
}

/**
 * ============================================================================
 * EXECUTION FLOW COMPARISON
 * ============================================================================
 */

/*
ORIGINAL FLOW:

1. define("contextMenu")
   └─ #eventController()
      ├─ keydownHandler function created
      ├─ clickHandler function created
      ├─ elBinding.bindEvent(d, keydown) ← Function anonymous, no reference stored
      ├─ elBinding.bindEvent(d.body, click) ← Function anonymous, no reference stored
      └─ #eventRegistered.add() ← Only mark as "registered"
      
      State: 
      - #eventRegistered = {contextMenu}
      - document listeners = [keydownHandler, clickHandler]
      - ❌ No way to remove them! Functions are lost after scope

2. .release()
   └─ #releaseStackManager()
      ├─ Remove DOM ✅
      ├─ Abort AJAX ✅
      ├─ Delete WeakMap ✅
      └─ ❌ No code to remove event listeners!
      
      State:
      - #eventRegistered = {contextMenu} ← Still there!
      - document listeners = [keydownHandler, clickHandler] ← Still there!
      - ❌ Memory leak!

3. define("contextMenu") lagi
   └─ #eventController()
      ├─ Check: #eventRegistered.has("contextMenu")? = YES
      └─ RETURN early (avoid duplicate)
      
      State:
      - #eventRegistered = {contextMenu} ← Same
      - document listeners = [old#1, new#2] ← DOUBLED!
      - ❌ Bigger memory leak!


FIXED FLOW:

1. define("contextMenu")
   └─ #eventController()
      ├─ keydownHandler = function(...) ← Stored in variable
      ├─ clickHandler = function(...) ← Stored in variable
      ├─ #eventHandlers.set(`${eventId}_keydown`, {
      │    element: d,
      │    handler: keydownHandler ← Reference stored!
      │  })
      ├─ #eventHandlers.set(`${eventId}_click`, {...}) ← Reference stored!
      ├─ elBinding.bindEvent(d, keydown, keydownHandler) ← Use stored reference
      ├─ elBinding.bindEvent(d.body, click, clickHandler) ← Use stored reference
      └─ #eventRegistered.add()
      
      State:
      - #eventRegistered = {contextMenu}
      - #eventHandlers = {keydown: {...}, click: {...}} ← References saved!
      - document listeners = [keydownHandler, clickHandler]

2. .release()
   └─ #releaseStackManager()
      ├─ Remove DOM ✅
      ├─ Abort AJAX ✅
      ├─ Delete WeakMap ✅
      ├─ Check: last stack removed? = YES
      └─ #releaseEventHandlers()
         ├─ Get handler from #eventHandlers ✅
         ├─ removeEventListener(handler) ✅ Remove from document!
         ├─ Delete from #eventHandlers ✅
         └─ Delete from #eventRegistered ✅
      
      State:
      - #eventRegistered = {} ← Cleared
      - #eventHandlers = {} ← Cleared
      - document listeners = [] ← REMOVED!
      - ✅ No memory leak!

3. define("contextMenu") lagi
   └─ #eventController()
      ├─ Check: #eventRegistered.has("contextMenu")? = NO
      └─ Register FRESH listeners
      
      State:
      - #eventRegistered = {contextMenu} ← New entry
      - #eventHandlers = {keydown: {...}, click: {...}} ← New entry
      - document listeners = [fresh#1] ← FRESH, not doubled!
      - ✅ No memory leak!
*/

/**
 * ============================================================================
 * DATA STRUCTURES COMPARISON
 * ============================================================================
 */

// ORIGINAL - Missing tracking
#stack = {
   name: ["contextMenu"],
   contextMenu: [
      {
         context: <div>menu</div>,
         src: <button>...</button>,
         ext: ["escape"],
         // ❌ No handler reference stored
      }
   ]
}

#eventRegistered = new Set([
   "layerManager_contextMenu" // ✅ Tells us event was registered
   // ❌ But can't tell us WHICH handler or HOW to remove it
])

// FIXED - Full tracking
#stack = {
   name: ["contextMenu"],
   contextMenu: [
      {
         context: <div>menu</div>,
         src: <button>...</button>,
         ext: ["escape"],
      }
   ]
}

#eventRegistered = new Set([
   "layerManager_contextMenu"
])

#eventHandlers = new Map([
   ["layerManager_contextMenu_keydown", {
      element: document,
      eventName: "keydown",
      handler: function (ev) { ... } // ✅ Function reference stored!
   }],
   ["layerManager_contextMenu_click", {
      element: document.body,
      eventName: "click",
      handler: function (ev) { ... } // ✅ Function reference stored!
   }]
])

// ✅ Now we can:
// 1. Identify which handlers to remove (via #eventHandlers)
// 2. Remove them properly (via removeEventListener)
// 3. Clean up after ourselves (delete from #eventHandlers)

/**
 * ============================================================================
 * MEMORY LEAK PROGRESSION VISUALIZATION
 * ============================================================================
 */

/*
ORIGINAL - Leak Gets Worse Each Cycle:

After 1st cycle:  1 handler (ghost) × 2 = 2 listeners
After 2nd cycle:  2 handlers (ghosts) × 2 = 4 listeners
After 3rd cycle:  3 handlers (ghosts) × 2 = 6 listeners
...
After 10th cycle: 10 handlers (ghosts) × 2 = 20 listeners ❌
After 100 cycles: 100 handlers (ghosts) × 2 = 200 listeners ❌❌❌


FIXED - Listeners Always Clean:

After 1st cycle:  0 handlers (cleaned up) × 2 = 0 listeners ✅
After 2nd cycle:  0 handlers (cleaned up) × 2 = 0 listeners ✅
After 3rd cycle:  0 handlers (cleaned up) × 2 = 0 listeners ✅
...
After 10th cycle: 0 handlers (cleaned up) × 2 = 0 listeners ✅
After 100 cycles: 0 handlers (cleaned up) × 2 = 0 listeners ✅
*/

/**
 * ============================================================================
 * THE FIX IN 5 LINES
 * ============================================================================
 */

// ADD THIS:
#eventHandlers = new Map(); // Store handler references

// MODIFY THIS:
#eventController() {
   // ... existing code ...
   this.#eventHandlers.set(`${eventId}_keydown`, { element, eventName, handler }); // NEW
   this.#eventHandlers.set(`${eventId}_click`, { element, eventName, handler });   // NEW
}

// ADD THIS NEW METHOD:
#releaseEventHandlers(actionName) {
   const entry = this.#eventHandlers.get(`${actionName}_keydown`);
   if (entry) entry.element.removeEventListener(entry.eventName, entry.handler);
   // ... same for click
}

// MODIFY THIS:
#releaseStackManager() {
   // ... existing cleanup ...
   if (this.#stack[name].length === 0) this.#releaseEventHandlers(name); // NEW
}

// ✅ DONE! Memory leak fixed.
