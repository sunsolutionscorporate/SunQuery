// ✅ IMPROVED contextMenu - Production Ready

this.contextMenu = function (source, actions, options) {
   // ✅ IMPROVEMENT 1: Close previous context menu first
   if (instance.contextMenu._lastContext) {
      instance.contextMenu._lastContext.release?.();
      instance.contextMenu._lastContext = null;
   }

   // ✅ IMPROVEMENT 2: Create menu wrapper with proper styling
   const menu = n.createElement('div', {
      class: 'contextMenu',
      style: `
         background: white;
         border: 1px solid #e0e0e0;
         border-radius: 4px;
         box-shadow: 0 2px 8px rgba(0,0,0,0.15);
         min-width: 150px;
         overflow: hidden;
      `
   });

   const ul = n.createElement('ul', {
      style: 'list-style: none; margin: 0; padding: 0;'
   });

   menu.append(ul);

   // ✅ IMPROVEMENT 3: Create menu items with proper handlers
   actions.forEach((action, idx) => {
      const li = n.createElement('li', {
         html: `<a style="display: flex; align-items: center; gap: 8px; font-size: 14px;">${action.icon || ''} ${action.label}</a>`,
         style: `
            padding: 10px 16px;
            cursor: pointer;
            border-bottom: ${idx < actions.length - 1 ? '1px solid #f0f0f0' : 'none'};
            transition: background-color 0.2s;
         `,
         title: action.label
      });

      // Hover effect
      li.addEventListener('mouseenter', () => {
         li.style.backgroundColor = '#f5f5f5';
      });

      li.addEventListener('mouseleave', () => {
         li.style.backgroundColor = 'transparent';
      });

      // Click handler
      li.addEventListener('click', (e) => {
         e.stopPropagation();

         // Execute action callback if exists
         if (typeof action.onClick === 'function') {
            action.onClick(source);
         }

         // Close context menu
         n.layerManager.close("contextMenu");
      });

      ul.append(li);
   });

   // ✅ IMPROVEMENT 4: Validate positioning options
   const x = options?.x ?? 0;
   const y = options?.y ?? 0;

   // ✅ IMPROVEMENT 5: Define layerManager with correct config
   n.layerManager.define("contextMenu", {
      source: source,
      causeExit: ["escape"],  // ✅ Only escape key
      overlay: {
         backdrop: false,     // ✅ No backdrop needed
         attached: false,     // ✅ Free positioning
         matchWidth: false,   // ✅ Natural width
         content: menu,
      },
      connected: function (ev) {
         // this.context = overlay element
         // this.source = trigger element

         if (ev.type === "init") {
            // ✅ Set position immediately in init
            n(this.context).css({
               position: 'fixed',
               top: `${y}px`,
               left: `${x}px`,
               zIndex: 10000
            });

            // ✅ Track this context menu for cleanup
            instance.contextMenu._lastContext = this.context;

         } else if (ev.type === "escape") {
            // ✅ User pressed ESC - close menu
            this.release();
            instance.contextMenu._lastContext = null;

         } else if (ev.type === "click") {
            // ✅ User clicked trigger again - toggle close
            this.release();
            instance.contextMenu._lastContext = null;
         }
      }
   });

   // ✅ IMPROVEMENT 6: Add click outside handler for safe close
   const handleClickOutside = (e) => {
      const contextMenuEl = document.querySelector('.contextMenu');
      const isClickInside = contextMenuEl?.contains(e.target);
      const isClickOnSource = source?.contains(e.target);

      if (!isClickInside && !isClickOnSource && contextMenuEl) {
         n.layerManager.close("contextMenu");
         document.removeEventListener('click', handleClickOutside);
      }
   };

   // Wait for init before adding listener
   setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
   }, 50);
};

// Initialize
instance.contextMenu._lastContext = null;
