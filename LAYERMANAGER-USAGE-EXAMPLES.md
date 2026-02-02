# 📚 Panduan Lengkap - Berbagai Cara Penggunaan LayerManager

## 1️⃣ BASIC USAGE - Modal Sederhana

```javascript
// HTML
<button id="btnOpenModal">Open Modal</button>
<div id="modalContent" style="display:none;">
   <h2>Modal Title</h2>
   <p>Modal content here</p>
   <button id="btnCloseModal">Close</button>
</div>

// JavaScript
const btn = document.querySelector('#btnOpenModal');
const closeBtn = document.querySelector('#btnCloseModal');

n.layerManager.define("myModal", {
   source: btn,
   overlay: {
      backdrop: true,  // Tampilkan backdrop
      content: document.querySelector('#modalContent')
   },
   connected: function(ev) {
      if (ev.type === "init") {
         console.log("Modal opened");
      } else if (ev.type === "escape") {
         console.log("User pressed escape");
         this.release();  // Close modal
      }
   }
});

closeBtn.addEventListener('click', () => {
   n.layerManager.close("myModal");
});
```

---

## 2️⃣ DROPDOWN/SELECT DENGAN ATTACHMENT

```javascript
// HTML
<div class="form-input">
   <input type="text" id="selectInput" placeholder="Pilih...">
   <div class="dropdown-options" style="display:none;">
      <div class="option" data-value="1">Option 1</div>
      <div class="option" data-value="2">Option 2</div>
      <div class="option" data-value="3">Option 3</div>
   </div>
</div>

// JavaScript
const input = document.querySelector('#selectInput');
const dropdown = document.querySelector('.dropdown-options');
const options = document.querySelectorAll('.option');

input.addEventListener('focus', () => {
   n.layerManager.define("dropdown", {
      source: input,
      causeExit: ["onblur", "onfocus"],
      overlay: {
         backdrop: false,
         attached: true,        // ✅ Attach ke input
         matchWidth: true,      // ✅ Sesuaikan lebar dengan input
         offsetY: -35,          // ✅ Positioning offset
         content: dropdown
      },
      connected: function(ev) {
         if (ev.type === "onblur") {
            // Tutup jika user click diluar
            if (!dropdown.contains(ev.target)) {
               this.release();
            }
         }
      }
   });
});

// Handle option click
options.forEach(opt => {
   opt.addEventListener('click', (e) => {
      input.value = e.target.textContent;
      n.layerManager.close("dropdown");
   });
});
```

---

## 3️⃣ CONTEXT MENU - Click Position

```javascript
// HTML
<div id="contextMenu" style="display:none;">
  <ul>
    <li>
      <a href="#">Edit</a>
    </li>
    <li>
      <a href="#">Delete</a>
    </li>
    <li>
      <a href="#">Share</a>
    </li>
  </ul>
</div>;

// JavaScript - Klik kanan pada element
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();

  const contextMenu = document.querySelector("#contextMenu");

  n.layerManager.define("contextMenu", {
    source: e.target,
    causeExit: ["onblur"],
    overlay: {
      backdrop: false,
      attached: false, // ✅ Tidak attach ke trigger
      content: contextMenu,
    },
    connected: function (ev) {
      if (ev.type === "init") {
        // Set posisi custom
        n(this.context).css({
          top: `${e.clientY}px`,
          left: `${e.clientX}px`,
        });
      }
    },
  });
});
```

---

## 4️⃣ TOOLTIP - Hover dengan Delay

```javascript
// HTML
<button class="tooltip-trigger" data-tooltip="This is a tooltip">
  Hover me
</button>;

// JavaScript
const tooltips = document.querySelectorAll(".tooltip-trigger");

tooltips.forEach((trigger) => {
  let showTimeout;

  trigger.addEventListener("mouseenter", () => {
    showTimeout = setTimeout(() => {
      const tooltipText = trigger.getAttribute("data-tooltip");
      const tooltipEl = n.createElement("div", {
        class: "tooltip-box",
        text: tooltipText,
        style:
          "padding: 8px 12px; background: #333; color: white; border-radius: 4px;",
      });

      n.layerManager.define("tooltip", {
        source: trigger,
        overlay: {
          backdrop: false,
          attached: true,
          offsetY: 10,
          content: tooltipEl,
        },
      });
    }, 500); // Delay 500ms
  });

  trigger.addEventListener("mouseleave", () => {
    clearTimeout(showTimeout);
    n.layerManager.close("tooltip");
  });
});
```

---

## 5️⃣ POPOVER - DENGAN FORM

```javascript
// HTML
<button id="btnPopover">Show Popover</button>;

// JavaScript
const popoverContent = n.createElement("div", {
  class: "popover",
  html: `
      <div style="padding: 16px; width: 300px;">
         <h4>Popover Title</h4>
         <form>
            <input type="text" placeholder="Name" style="width: 100%; padding: 8px; margin: 8px 0;">
            <input type="email" placeholder="Email" style="width: 100%; padding: 8px; margin: 8px 0;">
            <button type="submit" style="padding: 8px 16px; margin-top: 8px;">Submit</button>
         </form>
      </div>
   `,
});

document.querySelector("#btnPopover").addEventListener("click", function () {
  n.layerManager.define("popover", {
    source: this,
    causeExit: ["escape"],
    overlay: {
      backdrop: true,
      attached: false,
      content: popoverContent,
    },
    connected: function (ev) {
      if (ev.type === "escape") {
        this.release();
      }
    },
  });
});
```

---

## 6️⃣ NESTED LAYERS - Multiple Layers Sekaligus

```javascript
// Scenario: Modal dengan dropdown di dalamnya

// Open main modal
document.querySelector("#btnMainModal").addEventListener("click", function () {
  const modalContent = document.querySelector("#mainModalContent");

  n.layerManager.define("mainModal", {
    source: this,
    overlay: {
      backdrop: true,
      content: modalContent,
    },
  });
});

// Di dalam modal, ada dropdown
document.querySelector("#selectInModal").addEventListener("focus", function () {
  const dropdown = document.querySelector("#dropdownInModal");

  n.layerManager.define("nestedDropdown", {
    source: this,
    overlay: {
      backdrop: false,
      attached: true,
      matchWidth: true,
      content: dropdown,
    },
  });
});
```

---

## 7️⃣ LOADING STATE - Dengan AJAX Content

```javascript
// HTML
<button id="btnLoadContent">Load Data</button>;

// JavaScript
document
  .querySelector("#btnLoadContent")
  .addEventListener("click", function () {
    const loadingEl = n.createElement("div", {
      text: "Loading...",
      style: "padding: 20px; text-align: center;",
    });

    n.layerManager.define("ajaxLayer", {
      source: this,
      overlay: {
        backdrop: true,
        content: loadingEl,
      },
      connected: function (ev) {
        if (ev.type === "init") {
          // Fetch data setelah modal terbuka
          n.ajax({
            url: "/api/data",
            method: "GET",
          })
            .then((response) => {
              // Update content
              const contentEl = n.createElement("div", {
                html: response,
                style: "padding: 20px;",
              });

              n(this.context).html("");
              n(this.context).append(contentEl);
            })
            .catch((err) => {
              n(this.context).html("<p>Error loading data</p>");
            });
        }
      },
    });
  });
```

---

## 8️⃣ EVENT HANDLING - Blur/Focus Callbacks

```javascript
// HTML
<input type="text" id="focusInput">
<div id="focusTip" style="display:none;">
   <small>This field is focused</small>
</div>

// JavaScript
document.querySelector('#focusInput').addEventListener('focus', function() {
   n.layerManager.define("focusTip", {
      source: this,
      causeExit: ["onblur", "onfocus"],
      overlay: {
         backdrop: false,
         attached: true,
         offsetY: 5,
         content: document.querySelector('#focusTip')
      },
      connected: function(ev) {
         if (ev.type === "onfocus") {
            console.log("Still focused");
         } else if (ev.type === "onblur") {
            console.log("Lost focus, closing tooltip");
            this.release();
         }
      }
   });
});
```

---

## 9️⃣ PREVENT DUPLICATE - Multiple Trigger

```javascript
// HTML
<div class="buttons">
  <button class="profile-btn">Profile 1</button>
  <button class="profile-btn">Profile 2</button>
  <button class="profile-btn">Profile 3</button>
</div>;

// JavaScript
const profileBtns = document.querySelectorAll(".profile-btn");

profileBtns.forEach((btn) => {
  btn.addEventListener("click", function () {
    const content = n.createElement("div", {
      text: "Profile dropdown for " + this.textContent,
    });

    n.layerManager.define("profileMenu", {
      source: this,
      multiple: false, // ✅ Cegah duplikasi
      overlay: {
        backdrop: false,
        attached: true,
        content: content,
      },
    });
  });
});
```

---

## 🔟 CLOSE PROGRAMMATICALLY - Close dari Kode

```javascript
// Open layer
const btn = document.querySelector("#btnOpen");
btn.addEventListener("click", function () {
  n.layerManager.define("myLayer", {
    source: this,
    overlay: {
      content: document.createElement("div"),
    },
  });
});

// Close dari code
setTimeout(() => {
  n.layerManager.close("myLayer"); // ✅ Close by name
}, 3000);

// Close all
document.querySelector("#btnCloseAll").addEventListener("click", () => {
  n.layerManager.close("myLayer");
  n.layerManager.close("dropdown");
  n.layerManager.close("tooltip");
});
```

---

## 1️⃣1️⃣ CUSTOM POSITIONING - Advanced

```javascript
// Manual positioning
n.layerManager.define("custom", {
  source: triggerBtn,
  overlay: {
    backdrop: false,
    attached: false, // Manual positioning
    content: contentEl,
  },
  connected: function (ev) {
    if (ev.type === "init") {
      // Custom position logic
      const triggerRect = this.source.getBoundingClientRect();

      n(this.context).css({
        position: "fixed",
        top: triggerRect.bottom + 10 + "px",
        left: triggerRect.left + "px",
        width: triggerRect.width + "px",
        zIndex: 10000,
      });
    }
  },
});
```

---

## 1️⃣2️⃣ ESCAPE KEY HANDLING

```javascript
n.layerManager.define("modal", {
  source: btn,
  overlay: {
    backdrop: true,
    content: modalContent,
  },
  connected: function (ev) {
    if (ev.type === "escape") {
      console.log("Escape key pressed");

      // Custom action sebelum close
      console.log("Cleanup...");

      // Then close
      this.release();
    } else if (ev.type === "click") {
      console.log("Clicked trigger again");
    }
  },
});
```

---

## 1️⃣3️⃣ ARRAY CONTENT - Multiple Elements

```javascript
// Pass array of elements
const elements = [
  n.createElement("div", { text: "Line 1" }),
  n.createElement("div", { text: "Line 2" }),
  n.createElement("div", { text: "Line 3" }),
];

n.layerManager.define("list", {
  source: btn,
  overlay: {
    content: elements, // ✅ Array of elements
  },
});
```

---

## 1️⃣4️⃣ OBJECT WITH get_content METHOD

```javascript
// Custom object dengan get_content
const customObject = {
  data: ["Item 1", "Item 2", "Item 3"],
  get_content() {
    const ul = n.createElement("ul");
    this.data.forEach((item) => {
      const li = n.createElement("li", { text: item });
      ul.append(li);
    });
    return ul;
  },
};

n.layerManager.define("custom", {
  source: btn,
  overlay: {
    content: customObject, // ✅ Object dengan method
  },
});
```

---

## 1️⃣5️⃣ REAL-WORLD: Notification Dropdown

```javascript
// HTML
<button class="notification-bell">
  🔔 <span class="badge">3</span>
</button>;

// JavaScript
const notificationBtn = document.querySelector(".notification-bell");

notificationBtn.addEventListener("click", function () {
  const notifList = n.createElement("div", {
    class: "notification-list",
    html: `
         <div class="notification-item">
            <strong>New message</strong>
            <small>2 minutes ago</small>
         </div>
         <div class="notification-item">
            <strong>Task completed</strong>
            <small>1 hour ago</small>
         </div>
         <div class="notification-item">
            <strong>System update</strong>
            <small>3 hours ago</small>
         </div>
         <a href="/notifications" class="notification-link">View all</a>
      `,
    style: `
         position: absolute;
         background: white;
         border: 1px solid #ddd;
         border-radius: 8px;
         min-width: 300px;
         box-shadow: 0 2px 8px rgba(0,0,0,0.1);
         padding: 0;
      `,
  });

  n.layerManager.define("notifications", {
    source: this,
    multiple: true, // Allow multiple opens
    overlay: {
      backdrop: false,
      attached: true,
      matchWidth: false,
      offsetY: 10,
      content: notifList,
    },
    connected: function (ev) {
      if (ev.type === "escape") {
        this.release();
      }
    },
  });
});
```

---

## 📋 SUMMARY - Parameter Configuration

```javascript
n.layerManager.define(actionName, {
  // REQUIRED
  source: HTMLElement, // Element yang trigger layer

  // OPTIONAL - Layer behavior
  causeExit: ["onblur", "onfocus"], // Trigger untuk close
  multiple: false, // Allow multiple instances

  // OPTIONAL - Overlay configuration
  overlay: {
    backdrop: true, // Show semi-transparent backdrop
    attached: true, // Attach ke source element
    matchWidth: true, // Sesuaikan lebar dengan source
    offsetX: 0, // Horizontal offset
    offsetY: 10, // Vertical offset
    content: HTMLElement | String | Array | Object, // Content
  },

  // OPTIONAL - Callback handler
  connected: function (ev) {
    // ev.type: "init", "escape", "click", "onfocus", "onblur"
    // this.context: overlay element
    // this.release(): close layer
  },
});
```

---

## ✅ Checklist Best Practices

- ✅ Selalu berikan `source` element
- ✅ Gunakan unique `actionName` untuk tracking
- ✅ Set `multiple: false` untuk prevent duplicate
- ✅ Handle `escape` key di `connected` callback
- ✅ Call `this.release()` untuk close properly
- ✅ Gunakan `attached: true` untuk dropdown/tooltip
- ✅ Set `matchWidth: true` jika ingin sesuaikan lebar
- ✅ Cleanup content dengan `.remove()` saat close
