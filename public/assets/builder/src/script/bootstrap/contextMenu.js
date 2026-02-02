class ContextMenu {
   static #mapData = new WeakMap();
   static #initialized = false;
   static #lastContext = null;

   constructor() {
      if (ContextMenu.#initialized) return;

      ContextMenu.#initialized = true;

      // remove ContextMenu saat terjadi scroll pada sebuah halaman
      document.addEventListener('scroll', e => {
         // console.log('scroll dari:', e.target);
         if (ContextMenu.#lastContext) {
            ContextMenu.#lastContext.release();
         };
      }, true);


      document.addEventListener('contextmenu', ev => {
         ev.preventDefault();

         const source = ev.target.closest('[data-context]') || ev.target;

         const config = ContextMenu.#mapData.get(source);

         if (!config) return;

         const menu = n.createElement('div', {
            class: 'contextMenu',
            html: `<div class="header">
                     <span></span>
                        <button class="btn-icon btn-danger" dismiss="modal">
                           <i class="ph ph-x"></i>
                        </button>
                  </div>`,
         });
         const ul = n.createElement('ul');
         let data = {
            context: menu,
            source: source
         };
         menu.append(ul);
         config.items.forEach(item => {
            const icon = item.icon ? `<i class="ph ph-${item.icon}"></i>` : '';
            const li = n.createElement('li', { html: `<a>${icon}${item.label}</a>` });
            item.context = li;
            ul.append(li);
         });

         if (ContextMenu.#lastContext) {
            ContextMenu.#lastContext.release();
         };
         if (typeof config?.attach === 'function') {
            data = config.attach.call(menu, ev, {
               context: menu,
               source: source
            });
         }
         if (!data) return;
         const pos = { x: ev.clientX, y: ev.clientY };

         n.layerManager.define("contextMenu", {
            source: data.source,
            causeExit: ["onblur", "onfocus"],
            overlay: {
               backdrop: false,
               matchWidth: false,
               attached: false,
               content: menu,
            },
            connected: async function (ev) {
               const target = ev;
               const context = target.context;

               if (ev.type === "init") {
                  ContextMenu.#lastContext = context;
                  n(context).css({ top: `${pos.y}px`, left: `${pos.x}px` });
                  const rect = menu.getBoundingClientRect();
                  if ((rect.width + rect.x) >= (window.innerWidth - 20)) {
                     n(context).css({ left: `${pos.x - rect.width}px` });
                  }
                  if (rect.y - rect.height - 20 > 0) {
                     n(context).css({ top: `${pos.y - rect.height}px` });
                  }

               } else if (ev.type === "click" || ev.type === "escape") {
                  this.release();
                  ContextMenu.#lastContext = null;
               } else if (ev.type === 'onblur') {
                  if (!source.contains(context)) {
                     this.release();
                     ContextMenu.#lastContext = null;
                  }
               } else if (ev.type == "onfocus") {
                  config.items.forEach(item => {
                     if (item.context.contains(ev.target)) {
                        item.action(ev);
                        this.release();
                     };
                  });
                  ContextMenu.#lastContext = null;
               }
            }
         });
      });
   }

   define(source, options) {
      if (!options) return;
      n(source).attr('data-context', '');
      ContextMenu.#mapData.set(source, options || { items: [] });
   }
}
