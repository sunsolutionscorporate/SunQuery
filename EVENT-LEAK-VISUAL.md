# 📊 LayerManager Event Leak - Visual Explanation

## Memory Leak Flow (ORIGINAL)

```
ITERATION 1:
┌─────────────────────────────────────────────────────────────┐
│ n.layerManager.define("contextMenu")                        │
├─────────────────────────────────────────────────────────────┤
│ #eventController() called                                   │
│ ├─ Bind keydown handler to document ──┐                    │
│ └─ Bind click handler to document.body ├──> LISTENERS #1   │
│                                        │     (stays in memory)
│ #eventRegistered.add("layerManager_contextMenu")           │
└─────────────────────────────────────────────────────────────┘
         ⬇️
┌─────────────────────────────────────────────────────────────┐
│ .release() called                                           │
├─────────────────────────────────────────────────────────────┤
│ #releaseStackManager() removes:                             │
│ ✅ DOM elements                                              │
│ ✅ AJAX controller                                           │
│ ✅ WeakMap entry                                             │
│ ❌ Event listeners TIDAK DIHAPUS! ◄── LEAK!               │
└─────────────────────────────────────────────────────────────┘
         ⬇️
ITERATION 2:
┌─────────────────────────────────────────────────────────────┐
│ n.layerManager.define("contextMenu") again                  │
├─────────────────────────────────────────────────────────────┤
│ #eventController() called                                   │
│ ├─ Check: #eventRegistered.has("layerManager_contextMenu")? │
│ │ Answer: YES! (still there from iteration 1)               │
│ └─ SKIP registration ✅ (good, avoid duplicate)             │
│                                                             │
│ BUT: LISTENERS #1 masih aktif di background!              │
└─────────────────────────────────────────────────────────────┘
         ⬇️
AFTER 10 ITERATIONS:
┌─────────────────────────────────────────────────────────────┐
│ Document Global Event Listeners:                           │
│ ├─ keydown → [handler#1, handler#2, handler#3...]         │
│ └─ click → [handler#1, handler#2, handler#3...]           │
│                                                             │
│ Result: Multiple zombie handlers still listening!          │
│ ❌ Memory Leak = CONFIRMED                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Memory Leak Fix Flow (FIXED)

```
ITERATION 1:
┌─────────────────────────────────────────────────────────────┐
│ n.layerManager.define("contextMenu")                        │
├─────────────────────────────────────────────────────────────┤
│ #eventController() called                                   │
│ ├─ Bind keydown handler to document                         │
│ ├─ Bind click handler to document.body                      │
│ │                                                            │
│ ├─ ✅ NEW: Store handler reference in #eventHandlers       │
│ │   {                                                       │
│ │     "layerManager_contextMenu_keydown": {                │
│ │       element: document,                                  │
│ │       eventName: 'keydown',                               │
│ │       handler: [Function]                                 │
│ │     }                                                      │
│ │   }                                                        │
│ └─ #eventRegistered.add("layerManager_contextMenu")        │
└─────────────────────────────────────────────────────────────┘
         ⬇️
┌─────────────────────────────────────────────────────────────┐
│ .release() called                                           │
├─────────────────────────────────────────────────────────────┤
│ #releaseStackManager() removes:                             │
│ ✅ DOM elements                                              │
│ ✅ AJAX controller                                           │
│ ✅ WeakMap entry                                             │
│ ✅ NEW: Check if last stack was removed                    │
│     └─ YES! Call #releaseEventHandlers()                   │
│        ├─ Get handler from #eventHandlers                  │
│        ├─ Call removeEventListener()                       │
│        └─ Delete from #eventHandlers                       │
│ ✅ Event listeners PROPERLY REMOVED!                        │
└─────────────────────────────────────────────────────────────┘
         ⬇️
ITERATION 2:
┌─────────────────────────────────────────────────────────────┐
│ n.layerManager.define("contextMenu") again                  │
├─────────────────────────────────────────────────────────────┤
│ #eventController() called                                   │
│ ├─ Check: #eventRegistered.has("layerManager_contextMenu")? │
│ │ Answer: NO! (was deleted in iteration 1 cleanup)         │
│ └─ Register fresh listeners                                │
│                                                              │
│ #eventHandlers now contains:                               │
│ {                                                           │
│   "layerManager_contextMenu_keydown": {...}                │
│   "layerManager_contextMenu_click": {...}                  │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
         ⬇️
AFTER 10 ITERATIONS:
┌─────────────────────────────────────────────────────────────┐
│ Document Global Event Listeners:                           │
│ ├─ keydown → [current handler only]                         │
│ └─ click → [current handler only]                           │
│                                                             │
│ #eventHandlers Map:                                        │
│ {                                                           │
│   "layerManager_contextMenu_keydown": {...}                │
│   "layerManager_contextMenu_click": {...}                  │
│ }                                                           │
│                                                             │
│ Result: Clean, no zombie handlers!                         │
│ ✅ No Memory Leak = VERIFIED                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Structure Comparison

### BEFORE (Original)

```
class LayerManager {
   #stack = { name: [] }              // Track open layers
   #eventRegistered = new Set()       // Track if events registered ONCE
   #activeOverlays = new WeakMap()    // Track config per layer

   // ❌ Missing: Handler references storage
}

Memory state during open/close cycle:
┌──────────────────────────────────────┐
│ Open Layer #1                        │
├──────────────────────────────────────┤
│ #stack.contextMenu = [stack1]        │ ✅ Tracked
│ #eventRegistered = {contextMenu}     │ ✅ Tracked
│ document listeners = [handler#1]     │ ❌ Not tracked!
└──────────────────────────────────────┘
         ⬇️ .release()
┌──────────────────────────────────────┐
│ Close Layer #1                       │
├──────────────────────────────────────┤
│ #stack.contextMenu = []              │ ✅ Removed
│ #eventRegistered = {contextMenu}     │ ⚠️ Still there
│ document listeners = [handler#1]     │ ❌ Still there!
└──────────────────────────────────────┘
```

### AFTER (Fixed)

```
class LayerManager {
   #stack = { name: [] }              // Track open layers
   #eventRegistered = new Set()       // Track if events registered
   #activeOverlays = new WeakMap()    // Track config per layer

   // ✅ NEW: Handler references storage
   #eventHandlers = new Map()         // Store handler refs for cleanup
   #globalListeners = new Map()       // Track which actions have listeners
}

Memory state during open/close cycle:
┌──────────────────────────────────────┐
│ Open Layer #1                        │
├──────────────────────────────────────┤
│ #stack.contextMenu = [stack1]        │ ✅ Tracked
│ #eventRegistered = {contextMenu}     │ ✅ Tracked
│ #eventHandlers = {                   │ ✅ NEW: Tracked!
│   "contextMenu_keydown": {...},      │
│   "contextMenu_click": {...}         │
│ }                                    │
│ document listeners = [handler#1]     │ ✅ Now tracked
└──────────────────────────────────────┘
         ⬇️ .release()
┌──────────────────────────────────────┐
│ Close Layer #1                       │
├──────────────────────────────────────┤
│ #stack.contextMenu = []              │ ✅ Removed
│ #eventRegistered = {}                │ ✅ Cleared
│ #eventHandlers = {}                  │ ✅ NEW: Cleared!
│ document listeners = []              │ ✅ Removed
│ globalListeners = {}                 │ ✅ Cleared
└──────────────────────────────────────┘
```

---

## Timeline: Event Listeners Lifecycle

### BEFORE (Memory Leak)

```
Time    Action                  Document Listeners    Memory Status
────────────────────────────────────────────────────────────────────
T=0     define("contextMenu")   [handler#1]          Start: baseline
        └─ #eventController()
        └─ bind keydown
        └─ bind click

T=100   open dropdown           [handler#1]          Same listeners
        └─ reuse handlers

T=200   .release()              [handler#1]          ❌ LEAK: handlers still there!
        └─ remove DOM
        └─ remove WeakMap

T=300   define("contextMenu")   [handler#1, handler#2]  ❌ LEAK GROWS:
        again                   (2nd registration)      handlers#1 + #2
        └─ skip (already set)

T=400   .release()              [handler#1, handler#2]  ❌ BIGGER LEAK:
        └─ remove DOM           (both still there!)     both handlers active

...     [repeat many times]     [handler#1-N]          ❌ CRITICAL LEAK:
                                (N handlers stacked)    N zombie handlers
```

### AFTER (Fixed)

```
Time    Action                  Document Listeners    #eventHandlers Map
────────────────────────────────────────────────────────────────────────
T=0     define("contextMenu")   [handler#1]          {keydown#1, click#1}
        └─ #eventController()
        └─ bind keydown
        └─ store handler refs
        └─ bind click

T=100   open dropdown           [handler#1]          {keydown#1, click#1}
        └─ reuse handlers

T=200   .release()              []                   {} ✅ CLEAN!
        └─ remove DOM           (removed!)           (cleared!)
        └─ #releaseEventHandlers()
        └─ removeEventListener()

T=300   define("contextMenu")   [handler#2]          {keydown#2, click#2}
        again                   (fresh handlers)     (new refs)
        └─ register fresh

T=400   .release()              []                   {} ✅ STILL CLEAN!
        └─ #releaseEventHandlers()

...     [repeat many times]     []                   ✅ ALWAYS CLEAN:
                                                     handlers properly removed
```

---

## Memory Graph

```
BEFORE (Original - Memory Leak):

Memory Usage
    │     ▲
    │    ╱╲  ╱╲  ╱╲
    │   ╱  ╲╱  ╲╱  ╲
    │  ╱          ╱  ╲___╱
    │_╱___________________→ Time

    Pattern: Sawtooth with increasing baseline (LEAK!)
    Each cycle adds more garbage that doesn't get collected


AFTER (Fixed - No Memory Leak):

Memory Usage
    │     ▲
    │    ╱╲  ╱╲  ╱╲
    │   ╱  ╲╱  ╲╱  ╲
    │  ╱          ╱  ╲
    │_╱___________________→ Time

    Pattern: Clean sawtooth, returns to baseline each cycle (NO LEAK!)
    All garbage properly cleaned up between cycles
```

---

## Event Handler State Diagram

```
┌─────────────────┐
│  Browser Load   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ First contextMenu open              │
├─────────────────────────────────────┤
│ Action: define("contextMenu")       │
│ Event Controller Status: NOT ACTIVE │
│           ⬇️                         │
│ Action: #eventController()          │
│ Event Controller Status: ACTIVE ✅   │
│           ⬇️                         │
│ document.addEventListener(...)      │
│ Events registered: keydown, click   │
└────────┬────────────────────────────┘
         │
    ┌────┴────┐
    │          │
    ▼          ▼
┌────────┐  ┌────────────────────┐
│.release()  │User closes menu    │
└────┬───┘  └────────────────────┘
     │
     ▼
┌──────────────────────────────┐
│ #releaseStackManager()       │
│ BEFORE:                      │
│ - document listeners: ACTIVE │
│ - WeakMap: Has refs          │
│           ⬇️                  │
│ #releaseEventHandlers() ✅   │
│ - removeEventListener()      │
│ - Clear #eventHandlers       │
│ AFTER:                       │
│ - document listeners: REMOVED│
│ - #eventHandlers: EMPTY      │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Second contextMenu open      │
│ Event Controller Status: NO  │
│           ⬇️                  │
│ #eventController() again     │
│ Event Controller Status: YES ✅
│           ⬇️                  │
│ NEW listeners registered     │
│ (fresh handlers, no leaks)   │
└──────────────────────────────┘
```

---

## Bottom Line

```
┌─────────────────────────────────────────────────────────┐
│ PROBLEM:                                                │
│ Event listeners registered globally but never removed   │
│ = Memory leak that grows with each open/close cycle     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│ SOLUTION:                                               │
│ 1. Track handler references in #eventHandlers Map       │
│ 2. Call #releaseEventHandlers() during cleanup          │
│ 3. Properly removeEventListener() before deleting       │
│ = Clean memory, no leak, stable baseline                │
└─────────────────────────────────────────────────────────┘
```
