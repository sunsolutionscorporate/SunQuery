// @method-static




const layerManager = new class LayerManager {
   #cfg = {};
   #stack = { name: [] };
   #callbackController(eventType, ctx) {
      ctx.connected?.call(ctx.context, {
         ...ctx,
         target: ctx.target || ctx.src,
         type: eventType,
      });
   };
   #eventController() {
      const self = this;
      const elBinding = this.#cfg.overlay
         ? this.#cfg.context
         : this.#cfg.src;
      elBinding.bindEvent(
         d,
         "keydown",
         function (ev) {
            if (ev.key === "Escape") {
               const level = n.face.compareAll(
                  ...n("sunquery-panel[fullscreen]").get(),
                  "sunquery-overlay"
               );
               const topLevel =
                  level && level.details.length ? level.details[0] : null;
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
         },
         { id: "layerManager" }
      );
      elBinding.bindEvent(
         d.body,
         "click",
         function (ev) {
            // return
            for (const name of self.#stack.name) {
               const matches =
                  self.#stack[name] &&
                  self.#stack[name].filter((ar) => ar.src !== ev.target);
               if (!matches) continue;
               for (const item of matches) {
                  if (!item.ext.includes("onblur")) break;
                  const eventType = item.context.contains(ev.target)
                     ? "onfocus"
                     : "onblur";
                  self.#callbackController(eventType, {
                     ...item,
                     target: ev.target,
                  });
               }
            }
         },
         { id: "layerManager" }
      );
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
   async #createOverlay(callback) {
      const self = this;
      const cfg = this.#cfg;
      const contentx =
         n.helper.type(cfg.overlay.content) === "html"
            ? "html"
            : n.helper.type(cfg.overlay.content) === "string" &&
               n.helper.isURL(cfg.overlay.content)
               ? "ajax"
               : false;

      let content = cfg.overlay.content;
      if (n.helper.isURL(cfg.overlay.content)) {
         try {
            content = await n.ajax({ url: cfg.overlay.content });
            if (n.helper.type(content, 'stringHtml')) {
               content = n.helper.toHTML(content);
            }
         } catch (error) { return console.error(error) }
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
            console.error(`[🖥️Layer Manager] tidak ditemukan method 'get_content' pada target 'content'!`)
            return;
         }
      }

      if (content_type === 'array') {
         content.forEach(el => {
            container.append(el);
         })
      } else if (content_type === 'html') {
         container.append(content);
      } else if (content_type === 'string') {
         container.textContent = content;
      } else {
         console.error(`[🖥️Layer Manager] 'content' bertype '${content_type}' tidak didukung!`)
      };

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
         container.bindEvent(cfg.overlay.scrollParent, "scroll", reposition);
      }

      // lebar menyesuaikan source
      if (cfg.overlay.matchWidth) {
         const rect = cfg.src.getBoundingClientRect();
         n(container).css({
            width: `${rect.width}px`,
         });
      }

      cfg.context = container;
      container.actionName = cfg.actName;
      container.release = () => this.#releaseStackManager(container);

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
         this.#stack[name].splice(index, 1);
         if (!stack.overlay) {
            stack.src.removeEvent("layerManager");
         }
         // taambahan
         if (stack.overlay?.backdrop) {
            if (stack.context.parentElement.matches(".sQ__backdrop")) {
               stack.context.parentElement.remove();
            }
         }
         if (stack.overlay?.backdrop || stack.overlay?.content) {
            stack.context.childNodes.forEach(el => el.remove())
            stack.context?.remove?.();
         }
      });
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

      // Simpan konfigurasi awal
      this.#cfg = {
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
         this.#stack[actionName].push(this.#cfg);
         this.#callbackController("init", this.#cfg);
         this.#eventController();
      };

      // Buat overlay jika ada
      if (this.#cfg.overlay) {
         this.#createOverlay(done);
      } else {
         this.#cfg.context = opts.context || opts.source;
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


const face = new function () {
   const DEFAULT_STACK_PROPS = {
      opacity: "1",
      transform: "none",
      filter: "none",
      perspective: "none",
      mixBlendMode: "normal",
      willChange: "auto",
      isolation: "auto",
      position: "static",
      clipPath: "none",
      mask: "none",
      contain: "none",
      backdropFilter: "none",
   };

   // 🔍 Apakah elemen merupakan stacking context?
   function isStackingContext(el, style, config) {
      return config.some((prop) => {
         const actual = style[prop];
         const expected = DEFAULT_STACK_PROPS[prop];
         if (typeof actual === "undefined") return false;
         if (prop === "opacity") return parseFloat(actual) < 1;
         return actual !== expected;
      });
   }

   // 🏷️ Helper label
   function getLabel(el) {
      if (!el) return "unknown";
      if (typeof el === "string") return el;
      if (el.id) return `#${el.id}`;
      if (el.className) return `.${el.className}`;
      return el.tagName?.toLowerCase() || "unknown";
   }

   // 🧪 Cek kecocokan elemen
   function isMatch(el, target) {
      if (!el) return false;
      if (typeof target === "string") {
         try {
            return el.matches(target);
         } catch {
            return false;
         }
      }
      return el === target;
   }

   // 📊 Ambil daftar elemen dengan z-index
   function getStacking(filter) {
      const config = Array.isArray(filter)
         ? filter
         : [
            "opacity",
            "transform",
            "filter",
            "perspective",
            "mixBlendMode",
            "willChange",
         ];

      const elements = Array.from(document.body.querySelectorAll("*"));
      const result = [];

      elements.forEach((el) => {
         const style = getComputedStyle(el);
         const pos = style.position;

         if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            parseFloat(style.opacity) === 0 ||
            !["relative", "absolute", "fixed", "sticky"].includes(pos) ||
            (pos !== "fixed" && el.offsetParent === null)
         )
            return;

         let z = parseInt(style.zIndex, 10);
         if (isNaN(z)) z = 0;

         const isContext = isStackingContext(el, style, config);
         result.push({ element: el, zIndex: z, isContext });
      });

      result.sort((a, b) => {
         if (a.zIndex === b.zIndex) {
            return (b.isContext === true) - (a.isContext === true);
         }
         return b.zIndex - a.zIndex;
      });

      return result;
   }

   // 🎯 API utama: ElementIndex
   class ElementIndex {
      index(filter) {
         const result = getStacking(filter);
         return result.length ? result[0].zIndex + 1 : 1;
      }

      list(max) {
         const result = getStacking();
         if (typeof max === "undefined") return result;
         return result.slice(0, parseInt(max));
      }

      compare(a, b) {
         const list = getStacking();
         const indexA = list.findIndex((item) => isMatch(item.element, a));
         const indexB = list.findIndex((item) => isMatch(item.element, b));
         const zIndexA = indexA !== -1 ? list[indexA].zIndex : 0;
         const zIndexB = indexB !== -1 ? list[indexB].zIndex : 0;

         if (indexA === -1 && indexB === -1) {
            return {
               higher: null,
               lower: null,
               found: [],
               missing: [a, b],
               message: `❌ Kedua elemen (${getLabel(a)} dan ${getLabel(
                  b
               )}) tidak ditemukan dalam daftar visual`,
            };
         }

         if (indexA === -1) {
            return {
               higher: b,
               lower: null,
               found: [b],
               missing: [a],
               message: `⚠️ ${getLabel(a)} tidak ditemukan, ${getLabel(
                  b
               )} (z-index: ${zIndexB}) dianggap tertinggi`,
            };
         }

         if (indexB === -1) {
            return {
               higher: a,
               lower: null,
               found: [a],
               missing: [b],
               message: `⚠️ ${getLabel(b)} tidak ditemukan, ${getLabel(
                  a
               )} (z-index: ${zIndexA}) dianggap tertinggi`,
            };
         }
         const higher = indexA < indexB ? a : b;
         const lower = indexA < indexB ? b : a;
         return {
            higher,
            lower,
            found: [a, b],
            missing: [],
            zIndexA,
            zIndexB,
            message: `✅ ${getLabel(higher)} (z-index: ${Math.max(
               zIndexA,
               zIndexB
            )}) lebih tinggi dari ${getLabel(lower)} (z-index: ${Math.min(
               zIndexA,
               zIndexB
            )})`,
         };
      }

      compareAll(...items) {
         const list = getStacking();
         function getElementInfo(target) {
            const index = list.findIndex((item) =>
               isMatch(item.element, target)
            );
            if (index !== -1) {
               const item = list[index];
               return {
                  el: item.element,
                  label: getLabel(target),
                  index,
                  zIndex: item.zIndex,
                  isContext: item.isContext,
                  visible: true,
               };
            }
            const el =
               typeof target === "string"
                  ? document.querySelector(target)
                  : target instanceof HTMLElement
                     ? target
                     : null;
            const style = el ? getComputedStyle(el) : {};
            const visible =
               el &&
               style.display !== "none" &&
               style.visibility !== "hidden" &&
               parseFloat(style.opacity) > 0;
            return {
               el: el || null,
               label: getLabel(target),
               index: Infinity,
               zIndex: -Infinity,
               isContext: false,
               visible: !!visible,
            };
         }

         const results = items.map(getElementInfo);
         const visibleItems = results.filter((r) => r.visible);
         visibleItems.sort((a, b) => a.index - b.index);

         return {
            order: visibleItems.map((r) => r.label),
            details: visibleItems,
            message:
               visibleItems.length === 0
                  ? "❌ Tidak ada elemen yang visible dalam daftar perbandingan."
                  : `🔎 Urutan visual (visible saja) dari tertinggi ke terbawah:\n- ` +
                  visibleItems
                     .map(
                        (r) =>
                           `${r.label} (z: ${r.zIndex}, ${r.isContext ? "stacking context" : "no context"
                           })`
                     )
                     .join("\n- "),
         };
      }
   }

   return new ElementIndex();
};



function debounce(fn, delay) {
   let timer = null;
   return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
   };
};