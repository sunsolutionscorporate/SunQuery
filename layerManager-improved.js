// LAYERMANAGER - IMPROVED VERSION
// Perbaikan untuk production-ready code

const layerManager = new class LayerManager {
   #stack = { name: [] };
   #eventRegistered = new Set(); // Track registered event listeners
   #activeOverlays = new WeakMap(); // Track overlay config per context

   #callbackController(eventType, ctx) {
      ctx.connected?.call(ctx.context, {
         ...ctx,
         target: ctx.target || ctx.src,
         type: eventType,
      });
   };

   #eventController(actionName) {
      // ✅ IMPROVEMENT 1: Prevent duplicate event registration
      const eventId = `layerManager_${actionName}`;
      if (this.#eventRegistered.has(eventId)) return;

      const self = this;
      const stacks = this.#stack[actionName] || [];
      if (!stacks.length) return;

      const cfg = this.#activeOverlays.get(stacks[stacks.length - 1].context);
      if (!cfg) return;

      const elBinding = cfg.overlay ? cfg.context : cfg.src;

      // Keydown handler
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

      // Click handler
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

      // ✅ IMPROVEMENT 2: Proper event binding dengan ID untuk tracking
      elBinding.bindEvent(d, "keydown", keydownHandler, { id: eventId });
      elBinding.bindEvent(d.body, "click", clickHandler, { id: eventId });

      this.#eventRegistered.add(eventId);
   };

   #createBackdrop(className = "") {
      const node = n.createElement("div", {
         class: "backdrop " + className,
         style: `display:grid;position:fixed;inset:0;z-index:${n.face.index()};overflow:hidden;`,
      });
      n(document.body).append(node).attr("backdrop", true);
      n(node).animate(
         { opacity: [0.1, 1] },
         { ease: "ease-in", duration: 200 }
      );
      n(node).click(function (ev) {
         if (ev.target === this) {
            n(this)
               .find("sunquery-overlay")
               .animate(
                  [
                     { transform: "scale(1)" },
                     { transform: "scale(0.98)" },
                     { transform: "scale(1)" },
                  ],
                  {
                     duration: 500,
                     easing: "ease-in-out",
                     fill: "forwards",
                  }
               );
         }
      });
      return node;
   };

   async #createOverlay(cfg, callback) {
      const self = this;

      // ✅ IMPROVEMENT 3: Fetch content dengan proper error handling
      const contentx = n.helper.type(cfg.overlay.content) === "html"
         ? "html"
         : n.helper.type(cfg.overlay.content) === "string" &&
            n.helper.isURL(cfg.overlay.content)
            ? "ajax"
            : false;

      let content = cfg.overlay.content;

      // ✅ IMPROVEMENT 4: Add AbortController untuk race condition handling
      if (n.helper.isURL(cfg.overlay.content)) {
         const controller = new AbortController();
         cfg.abortController = controller;

         try {
            content = await n.ajax({ url: cfg.overlay.content, signal: controller.signal });
            if (n.helper.type(content, 'stringHtml')) {
               content = n.helper.toHTML(content);
            }
         } catch (error) {
            // Jangan log AbortError, itu normal jika layer ditutup sebelum AJAX selesai
            if (error.name !== 'AbortError') {
               console.error(error);
            }
            return;
         }
      }

      if (!content) {
         console.error(`[🖥️Layer Manager] penggunaan 'overlay' wajib menggunakan 'content'!`);
         return;
      }

      const wrap = cfg.overlay.backdrop ? this.#createBackdrop() : d.body;
      const container = n.createElement("sunquery-overlay", {
         style: `position:${cfg.overlay.backdrop ? "relative" : "fixed"};overflow:hidden;`,
         id: n.helper.generateUniqueId(),
      });

      n(container).appendTo(wrap).css("z-index", n.face.index());

      const content_type = n.helper.type(content);

      if (content_type === 'object') {
         if (typeof content?.get_content === 'function') {
            content = content.get_content();
         } else {
            console.error(`[🖥️Layer Manager] tidak ditemukan method 'get_content' pada target 'content'!`);
            return;
         }
      }

      if (content_type === 'array') {
         content.forEach(el => {
            container.append(el);
         });
      } else if (content_type === 'html') {
         container.append(content);
      } else if (content_type === 'string') {
         container.textContent = content;
      } else {
         console.error(`[🖥️Layer Manager] 'content' bertype '${content_type}' tidak didukung!`);
      }

      cfg.overlay.scrollParent = n.helper.findScrollParent(cfg.src);

      // Position relative ke trigger jika attached
      if (cfg.overlay.attached) {
         const reposition = () => {
            const rect = cfg.src.getBoundingClientRect();
            const ctxRect = container.getBoundingClientRect();
            const mainRect = cfg.overlay.scrollParent.getBoundingClientRect();

            let left = rect.left;
            if (rect.left + ctxRect.width >= mainRect.right) {
               left = rect.right - ctxRect.width;
            }
            let top = rect.bottom;
            if (rect.bottom + ctxRect.height >= mainRect.bottom) {
               top = rect.top - ctxRect.height;
            }
            n(container).css({
               top: `${top + cfg.overlay.offsetY + window.scrollY}px`,
               left: `${left + cfg.overlay.offsetX + window.scrollX}px`,
            });
         };
         reposition();

         // ✅ IMPROVEMENT 5: Store scroll handler reference untuk cleanup
         cfg.scrollReposition = reposition;
         cfg.scrollParentElement = cfg.overlay.scrollParent;
         cfg.overlay.scrollParent.bindEvent(
            cfg.overlay.scrollParent,
            "scroll",
            reposition,
            { id: `scroll_${container.id}` }
         );
      }

      // Lebar menyesuaikan source
      if (cfg.overlay.matchWidth) {
         const rect = cfg.src.getBoundingClientRect();
         n(container).css({
            width: `${rect.width}px`,
         });
      }

      cfg.context = container;
      container.actionName = cfg.actName;
      container.release = () => this.#releaseStackManager(container);

      // ✅ Store config dengan WeakMap untuk tracking
      this.#activeOverlays.set(container, cfg);

      callback(cfg);
      return container;
   };

   #releaseStackManager(ctx) {
      const findStackByContext = (context) => {
         const result = [];
         for (const name of this.#stack.name) {
            const list = this.#stack[name];
            if (!Array.isArray(list)) continue;
            for (let i = list.length - 1; i >= 0; i--) {
               if (list[i].context === context) {
                  result.push({ name, index: i, stack: list[i] });
               }
            }
         }
         return result;
      };

      const matches = findStackByContext(ctx);

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
            // Clone agar tidak modify during iteration
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

      // ✅ IMPROVEMENT 11: Clear event registration tracking
      const hasActiveLayer = this.#stack.name.some(
         name => Array.isArray(this.#stack[name]) && this.#stack[name].length > 0
      );

      if (!hasActiveLayer) {
         this.#eventRegistered.clear();
      }
   };

   define(actionName, opts = {}) {
      if (typeof actionName !== "string")
         return warn("[🧩LayerManager] 'name' wajib string");
      if (!opts.source) return warn("[🧩LayerManager] 'source' wajib ada");
      if (opts.causeExit && !Array.isArray(opts.causeExit))
         return warn("[🧩LayerManager] 'causeExit' wajib array");

      const stacks = this.#stack[actionName] || [];
      if (!this.#stack.name.includes(actionName))
         this.#stack.name.push(actionName);

      const allowDuplicate = opts.multiple === true;

      if (!allowDuplicate) {
         for (const item of stacks) {
            if (item.src === opts.source) {
               this.#callbackController("click", item);
               return false;
            }
         }
      }

      // ✅ IMPROVEMENT 12: Local config per layer, bukan global #cfg
      const cfg = {
         actName: actionName,
         src: opts.source,
         ext: opts.causeExit || [],
         overlay: opts.overlay
            ? {
               backdrop: opts.overlay.backdrop !== false,
               attached:
                  opts.overlay.backdrop === true
                     ? false
                     : opts.overlay.attached !== false,
               matchWidth: opts.overlay.matchWidth !== false,
               content: opts.overlay.content,
               offsetX: opts.overlay.offsetX || 0,
               offsetY: opts.overlay.offsetY || 0,
            }
            : null,
         connected:
            typeof opts.connected === "function" ? opts.connected : () => { },
      };

      const done = () => {
         if (!Array.isArray(this.#stack[actionName]))
            this.#stack[actionName] = [];

         this.#stack[actionName].push(cfg);
         this.#callbackController("init", cfg);
         this.#eventController(actionName);
      };

      // Buat overlay jika ada
      if (cfg.overlay) {
         this.#createOverlay(cfg, done);
      } else {
         cfg.context = opts.context || opts.source;
         opts.source.release = () =>
            this.#releaseStackManager(opts.context || opts.source);
         done();
      }

      return true;
   };

   close(actionName, source = null) {
      const stacks = this.#stack[actionName];
      if (!Array.isArray(stacks)) return false;

      for (let i = stacks.length - 1; i >= 0; i--) {
         const item = stacks[i];
         if (!source || item.src === source) {
            item.context?.release?.();
            stacks.splice(i, 1);
         }
      }
      return true;
   };
};