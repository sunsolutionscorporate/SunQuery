// LAYERMANAGER - FIXED EVENT LEAK VERSION
// Solusi untuk event listeners yang tidak terhapus

const layerManager = new class LayerManager {
   #stack = { name: [] };
   #eventRegistered = new Set(); // Track registered event listeners
   #activeOverlays = new WeakMap(); // Track overlay config per context

   // ✅ NEW: Store handler references so we can remove them
   #eventHandlers = new Map();
   #globalListeners = new Map(); // Track which actions have registered listeners

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

      // ✅ IMPROVEMENT: Store handler references for proper cleanup
      this.#eventHandlers.set(`${eventId}_keydown`, {
         element: d,
         eventName: 'keydown',
         handler: keydownHandler,
         boundElement: elBinding // Store binding source
      });

      this.#eventHandlers.set(`${eventId}_click`, {
         element: d.body,
         eventName: 'click',
         handler: clickHandler,
         boundElement: elBinding // Store binding source
      });

      // ✅ Track which action has global listeners
      this.#globalListeners.set(eventId, true);

      // Proper event binding dengan ID untuk tracking
      elBinding.bindEvent(d, "keydown", keydownHandler, { id: eventId });
      elBinding.bindEvent(d.body, "click", clickHandler, { id: eventId });

      this.#eventRegistered.add(eventId);
   };

   // ✅ NEW: Method to properly remove event listeners
   #releaseEventHandlers(actionName) {
      const eventId = `layerManager_${actionName}`;

      const keydownKey = `${eventId}_keydown`;
      const clickKey = `${eventId}_click`;

      // Remove keydown listener
      const keydownEntry = this.#eventHandlers.get(keydownKey);
      if (keydownEntry) {
         try {
            if (typeof keydownEntry.element.removeEventListener === 'function') {
               keydownEntry.element.removeEventListener(keydownEntry.eventName, keydownEntry.handler);
            }
         } catch (e) {
            console.warn(`[LayerManager] Failed to remove keydown listener: ${e.message}`);
         }
         this.#eventHandlers.delete(keydownKey);
      }

      // Remove click listener
      const clickEntry = this.#eventHandlers.get(clickKey);
      if (clickEntry) {
         try {
            if (typeof clickEntry.element.removeEventListener === 'function') {
               clickEntry.element.removeEventListener(clickEntry.eventName, clickEntry.handler);
            }
         } catch (e) {
            console.warn(`[LayerManager] Failed to remove click listener: ${e.message}`);
         }
         this.#eventHandlers.delete(clickKey);
      }

      this.#eventRegistered.delete(eventId);
      this.#globalListeners.delete(eventId);
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
      const actName = cfg.actName;
      let isAborted = false;
      let html = "";

      if (!cfg.overlay.content) {
         const abortController = new AbortController();
         cfg.abortController = abortController;

         try {
            const response = await fetch(cfg.src, {
               signal: abortController.signal,
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            html = await response.text();
         } catch (error) {
            if (error.name !== "AbortError") {
               return warn(`[🧩LayerManager] Fetch error: ${error.message}`);
            }
            isAborted = true;
         }
         if (isAborted) return;
      }

      const backdrop = cfg.overlay.backdrop ? this.#createBackdrop("layer-" + actName) : null;

      const container = n.createElement("sunquery-overlay", {
         class: `layer-${actName}`,
         style: `position:${cfg.overlay.attached ? "absolute" : "fixed"};z-index:${n.face.index()}`,
      });

      if (backdrop) {
         backdrop.append(container);
      } else {
         n(document.body).append(container);
      }

      const content_type = typeof cfg.overlay.content;
      if (content_type === "object" && cfg.overlay.content) {
         container.append(cfg.overlay.content);
      } else if (content_type === "string") {
         container.textContent = cfg.overlay.content || html;
      } else {
         console.error(`[🖥️Layer Manager] 'content' bertype '${content_type}' tidak didukung!`);
      }

      cfg.overlay.scrollParent = n.helper.findScrollParent(cfg.src);

      // Posisi relatif ke pemicu jika attached
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
         // Clear scroll handler reference
         if (stack.scrollReposition) {
            stack.scrollReposition = null;
            stack.scrollParentElement = null;
         }

         // Abort pending AJAX requests
         if (stack.abortController) {
            stack.abortController.abort();
            stack.abortController = null;
         }

         this.#stack[name].splice(index, 1);

         // ✅ NEW: Remove global event listeners if this is the last stack for this action
         if (this.#stack[name].length === 0) {
            this.#releaseEventHandlers(name);
         }

         // Better backdrop cleanup logic
         if (stack.overlay?.backdrop) {
            const parent = stack.context?.parentElement;
            if (parent && parent.classList.contains("backdrop")) {
               parent.remove();
            }
         }

         // Proper content cleanup
         if (stack.overlay?.backdrop || stack.overlay?.content) {
            // Clone agar tidak modify during iteration
            Array.from(stack.context.childNodes).forEach(el => {
               if (el.nodeType === Node.ELEMENT_NODE || el.nodeType === Node.TEXT_NODE) {
                  el.remove();
               }
            });
            stack.context?.remove?.();
         }

         // Cleanup WeakMap reference
         this.#activeOverlays.delete(stack.context);
      });
   };

   define(actionName, opts = {}) {
      if (typeof actionName !== "string")
         return warn("[🧩LayerManager] 'name' wajib string");
      if (!opts.source) return warn("[🧩LayerManager] 'source' wajib ada");
      if (opts.causeExit && !Array.isArray(opts.causeExit))
         return warn("[🧩LayerManager] 'causeExit' wajib array");

      // ✅ FIX: Initialize stack array if not exists
      if (!this.#stack[actionName]) {
         this.#stack[actionName] = [];
      }

      const stacks = this.#stack[actionName];
      if (!this.#stack.name.includes(actionName))
         this.#stack.name.push(actionName);

      const allowDuplicate = opts.multiple === true;

      if (!allowDuplicate) {
         for (const item of stacks) {
            if (item.src === opts.source) {
               return this.#callbackController("init", item);
            }
         }
      }

      const cfg = {
         actName: actionName,
         src: opts.source,
         ext: opts.causeExit || [],
         overlay: opts.overlay || {},
         connected: opts.connected || (() => { }),
      };

      this.#createOverlay(cfg, (config) => {
         const stack = {
            ...config,
            src: opts.source,
            context: config.context,
            ext: opts.causeExit || [],
         };

         this.#stack[actionName].push(stack);
         this.#eventController(actionName);
         this.#callbackController("init", stack);
      });
   };
};
