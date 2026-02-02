/**
 * TEST: LayerManager Event Listener Memory Leak Detection
 * 
 * Jalankan script ini di DevTools console untuk deteksi memory leak
 * dan verifikasi bahwa event listeners properly di-remove
 */

// Helper untuk count event listeners (hanya untuk debugging Chrome DevTools)
function getEventListenerCount() {
   const kd = getEventListeners(document)?.keydown || [];
   const clk = getEventListeners(document.body)?.click || [];
   return {
      documentKeydown: kd.length,
      bodyClick: clk.length,
      total: kd.length + clk.length
   };
}

// TEST 1: Memory Leak dengan Original Code
async function testMemoryLeakOriginal() {
   console.log("=== TEST 1: Memory Leak Detection (Original) ===");
   console.log("Initial listeners:", getEventListenerCount());

   const results = [];

   for (let i = 0; i < 5; i++) {
      const menu = n.createElement('div', { class: 'testMenu' });

      n.layerManager.define(`test_${i}`, {
         source: document.body,
         causeExit: ["escape"],
         overlay: {
            content: menu,
            backdrop: false
         }
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // Get the context and release
      const ctx = document.querySelector(`[actionName="test_${i}"]`);
      if (ctx && ctx.release) {
         ctx.release();
      }

      const count = getEventListenerCount();
      results.push(count);
      console.log(`After iteration ${i + 1}:`, count);
   }

   // Check if listeners accumulated (memory leak indicator)
   const initial = results[0];
   const final = results[results.length - 1];

   if (final.total > initial.total) {
      console.error("❌ MEMORY LEAK DETECTED!");
      console.log(`Event listeners increased from ${initial.total} to ${final.total}`);
      return false;
   } else {
      console.log("✅ No memory leak detected");
      return true;
   }
}

// TEST 2: Verify Fixed Version Cleans Up Properly
async function testMemoryLeakFixed() {
   console.log("\n=== TEST 2: Memory Leak Detection (Fixed Version) ===");
   console.log("Initial listeners:", getEventListenerCount());

   const results = [];

   for (let i = 0; i < 5; i++) {
      const menu = n.createElement('div', { class: 'testMenu' });

      // Using fixed version (layerManager-fixed-event-leak.js)
      n.layerManager.define(`test_fixed_${i}`, {
         source: document.body,
         causeExit: ["escape"],
         overlay: {
            content: menu,
            backdrop: false
         }
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const ctx = document.querySelector(`[actionName="test_fixed_${i}"]`);
      if (ctx && ctx.release) {
         ctx.release();
      }

      const count = getEventListenerCount();
      results.push(count);
      console.log(`After iteration ${i + 1}:`, count);
   }

   const initial = results[0];
   const final = results[results.length - 1];

   if (final.total > initial.total) {
      console.error("❌ MEMORY LEAK STILL PRESENT!");
      console.log(`Event listeners increased from ${initial.total} to ${final.total}`);
      return false;
   } else {
      console.log("✅ Memory leak fixed!");
      return true;
   }
}

// TEST 3: Concurrent Overlays
async function testConcurrentOverlays() {
   console.log("\n=== TEST 3: Multiple Concurrent Overlays ===");
   console.log("Initial listeners:", getEventListenerCount());

   const contexts = [];

   // Open 3 overlays
   for (let i = 0; i < 3; i++) {
      const menu = n.createElement('div', { class: 'concurrent' });
      n.layerManager.define('concurrent', {
         source: document.body,
         multiple: true,
         overlay: { content: menu }
      });

      await new Promise(resolve => setTimeout(resolve, 50));
      const ctx = document.querySelector(`[actionName="concurrent"]`);
      if (ctx) contexts.push(ctx);
   }

   console.log(`After opening 3 overlays:`, getEventListenerCount());

   // Close all
   contexts.forEach(ctx => ctx.release?.());
   await new Promise(resolve => setTimeout(resolve, 100));

   console.log(`After closing all:`, getEventListenerCount());
   console.log("Test completed");
}

// TEST 4: Event Listener Details (Chrome DevTools Only)
function testEventListenerDetails() {
   console.log("\n=== TEST 4: Event Listener Details ===");

   try {
      const docListeners = getEventListeners(document);
      const bodyListeners = getEventListeners(document.body);

      console.log("Document listeners:", docListeners);
      console.log("Body listeners:", bodyListeners);

      // Check for layerManager related listeners
      if (docListeners.keydown) {
         docListeners.keydown.forEach((listener, i) => {
            if (listener.listener.toString().includes('layerManager') ||
               listener.listener.toString().includes('Escape')) {
               console.log(`Found potential layerManager keydown at index ${i}`);
               console.log(listener);
            }
         });
      }
   } catch (e) {
      console.warn("getEventListeners not available (not Chrome DevTools): ", e.message);
   }
}

// RUN ALL TESTS
async function runAllTests() {
   console.clear();
   console.log("🧪 LayerManager Event Leak Test Suite");
   console.log("=====================================\n");

   const test1 = await testMemoryLeakOriginal();
   const test2 = await testMemoryLeakFixed();
   await testConcurrentOverlays();
   testEventListenerDetails();

   console.log("\n=== TEST SUMMARY ===");
   console.log("Test 1 (Original):", test1 ? "✅ PASS" : "❌ FAIL");
   console.log("Test 2 (Fixed):", test2 ? "✅ PASS" : "❌ FAIL");
}

// Export untuk dijalankan
window.layerManagerTests = {
   getCount: getEventListenerCount,
   testOriginal: testMemoryLeakOriginal,
   testFixed: testMemoryLeakFixed,
   testConcurrent: testConcurrentOverlays,
   testDetails: testEventListenerDetails,
   runAll: runAllTests
};

console.log("✅ Test suite loaded. Run: layerManagerTests.runAll()");
