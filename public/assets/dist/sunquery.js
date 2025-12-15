(function (root, factory) {
   "use strict";
   // CommonJS (Node.js)
   if (typeof module === "object" && typeof module.exports === "object") {
      module.exports = factory(globalThis);
   }
   // AMD / RequireJS
   else if (typeof define === "function" && define.amd) {
      define([], () => factory(globalThis));
   }
   // ESM (modern build tools)
   else if (typeof exports === "object") {
      exports.default = factory(globalThis);
   }
   // Browser global fallback
   else {
      root.sunQuery = factory(root);
   };
   new function eventHandler() {
      const log = console.log;
      const eventTypes = {
         mouse: [
            "click",
            "dblclick",
            "mousedown",
            "mouseup",
            "mouseenter",
            "mouseleave",
            "mouseover",
            "mouseout",
            "mousemove",
            "contextmenu",
            "auxclick",
         ],
         keyboard: [
            "keydown",
            "keyup",
            "keypress" /*`keypress` deprecated, tapi masih banyak dipakai*/,
         ],
         form: [
            "input",
            "change",
            "submit",
            "reset",
            "focus",
            "blur",
            "focusin",
            "focusout",
            "invalid",
         ],
         touch: ["touchstart", "touchend", "touchmove", "touchcancel"],
         pointer: [
            "pointerover",
            "pointerenter",
            "pointerdown",
            "pointermove",
            "pointerup",
            "pointercancel",
            "pointerout",
            "pointerleave",
            "gotpointercapture",
            "lostpointercapture",
         ],
         drag: [
            "drag",
            "dragstart",
            "dragend",
            "dragenter",
            "dragleave",
            "dragover",
            "drop",
         ],
         media: [
            "play",
            "pause",
            "playing",
            "waiting",
            "ended",
            "durationchange",
            "timeupdate",
            "volumechange",
            "ratechange",
            "seeking",
            "seeked",
            "loadeddata",
            "loadedmetadata",
            "canplay",
            "canplaythrough",
            "stalled",
            "suspend",
            "emptied",
            "abort",
         ],
         animation: [
            "animationstart",
            "animationend",
            "animationiteration",
            "animationcancel",
         ],
         transition: [
            "transitionstart",
            "transitionend",
            "transitionrun",
            "transitioncancel",
         ],
         clipboard: [
            "copy",
            "cut",
            "paste",
            "beforecopy",
            "beforecut",
            "beforepaste",
         ],
         window: [
            "load",
            "beforeunload",
            "unload",
            "resize",
            "scroll",
            "hashchange",
            "popstate",
            "storage",
            "DOMContentLoaded",
            "visibilitychange",
            "fullscreenchange",
         ],
         network: [
            "online",
            "offline",
            "error",
            "abort",
            "loadstart",
            "progress",
            "loadend",
            "timeout",
         ],
         device: [
            "deviceorientation",
            "devicemotion",
            "orientationchange",
            "resize",
         ],
         websocket: ["open", "message", "close", "error"],
         other: [
            "wheel",
            "scrollend",
            "mouseenter",
            "mouseleave",
            "toggle",
            "show",
            "close",
            "slotchange",
            "ratechange",
            "rejectionhandled",
            "unhandledrejection",
         ],
      };
      const getContextSignal = function (el, config) {
         let eventStack = n.helper.expando.get(el, "eventCtr");
         if (!eventStack) {
            class _event {
               ctrl = new AbortController();
               event = {};
               constructor(opts) {
                  this.event[opts.type] = [
                     { handler: opts.fn, id: opts.id, bind: opts.bind },
                  ];
               }
            }
            const setup = new _event(config);
            n.helper.expando.set(el, "eventCtr", setup);
            return setup.ctrl.signal;
         } else {
            !eventStack.event[config.type] &&
               (eventStack.event[config.type] = []);
            eventStack.event[config.type].push({
               handler: config.fn,
               id: config.id,
               bind: config.bind,
            });
            return eventStack.ctrl.signal;
         }
      };

      //override addEventListener method
      const native_addEventListener = {
         element: Element.prototype.addEventListener,
         window: Window.prototype.addEventListener,
         document: Document.prototype.addEventListener,
      };
      function custom_addEventListener(type, fn, options) {
         const opts = { ...options };
         const owner = opts._contextOwner ?? this;
         if (opts.useContextSignal !== false) {
            if (opts.bind) {
               opts.signal = getContextSignal(
                  opts.bind.target,
                  {
                     type,
                     fn,
                     id: options?.id,
                     bind: { id: opts.bind.id, target: owner },
                  }
               );
            }
            opts.signal = getContextSignal(owner, {
               type,
               fn,
               id: options?.id,
               bind: opts.bind,
            });
         }
         if (this instanceof Element)
            return native_addEventListener.element.call(this, type, fn, opts);
         if (this instanceof Window)
            return native_addEventListener.window.call(this, type, fn, opts);
         if (this instanceof Document)
            return native_addEventListener.document.call(this, type, fn, opts);
         console.warn(
            "[⚠️ Warning] 'addEventListener' dipanggil dari objek tidak dikenal:",
            this
         );
      }
      Element.prototype.custom_addEventListener = custom_addEventListener;
      Window.prototype.custom_addEventListener = custom_addEventListener;
      Document.prototype.custom_addEventListener = custom_addEventListener;

      // add proto bindEvent
      let eventBindCounter = 0;
      Element.prototype.bindEvent = function (target, event, ...rest) {
         const owner = this;
         let selector = null,
            handler,
            options = {};
         // Parsing argumen: bind(target, event, [selector], handler, [options])
         if (typeof rest[0] === "string") {
            selector = rest[0];
            handler = rest[1];
            options = rest[2] || {};
         } else {
            handler = rest[0];
            options = rest[1] || {};
         }
         const opts = { ...options, _contextOwner: owner };
         // Bungkus handler jika delegasi digunakan
         const finalHandler = selector
            ? function (e) {
               const match = e.target.closest(selector);
               if (match && this.contains(match)) {
                  e.delegateTarget = match; // opsional, seperti jQuery
                  handler.call(match, e);
               }
            }
            : handler;
         // Handle multiple target
         if (opts.useContextSignal !== false) {
            // opts.signal = EventHandlerManager.#getContextSignal(owner, { type: event, fn: finalHandler, id: options?.id });
         }
         if (typeof target === "string") {
            target = document.querySelectorAll(target);
            if (target.length === 0) {
               console.warn(
                  `[bindEvent] Selector "${target}" tidak menghasilkan elemen.`
               );
               return this;
            }
         }

         if (target instanceof NodeList || Array.isArray(target)) {
            target.forEach((t) => {
               // Tambahkan signal jika diizinkan
               eventBindCounter++;
               t.addEventListener(event, finalHandler, {
                  ...opts,
                  bind: { id: eventBindCounter, target },
               });
            });
         } else if (target?.addEventListener) {
            eventBindCounter++;
            target.addEventListener(event, finalHandler, {
               ...opts,
               bind: { id: eventBindCounter, target },
            });
         } else {
            console.warn("[bind] Target tidak valid untuk bind:", target);
         }
         return this;
      };
   };

   new function protoElement() {
      const native = Element.prototype.remove;
      const remElement = function () {
         const event = new CustomEvent("beforeRemove", { cancelable: true });
         this.dispatchEvent(event);
         if (event.defaultPrevented) {
            return console.warn("[❌ Batal] Penghapusan dibatalkan oleh beforeRemove.");
         }
         // console.log("[🗑️ remove] Menghapus elemen:", this);
         native.call(this);
         this.dispatchEvent(new CustomEvent("afterRemove"));
         // Abort semua event listener yang menggunakan signal dari elemen ini
         const signal = q.helper.expando.get(this, "eventCtr");
         if (signal?.ctrl) {
            signal.ctrl.abort();
            // Engine.helper.expando.remove(this, 'eventCtr');
         }
         q.helper.expando.remove(this);
      };
      Element.prototype.remove = function () {
         remElement.call(this);
      };
   };

})(typeof globalThis !== "undefined" ? globalThis : (typeof window !== "undefined" ? window : this),
   function (global) {
      "use strict";
      // Pastikan environment punya document
      if (!global.document) throw new Error("sunQuery requires a window with a document");
      class CustomError extends Error {
         constructor(message, level = 'error') {
            if (message.length > 1 && typeof message[0] === 'string') {
               super(message[0]);
               this.head = message[0];
               message.shift();
            } else {
               super('');
               this.head = '';
            }

            this.message = message;
            this.level = level;
            this.name = 'CustomError';

         }
         logger() {
            // if (this.level === 'error') {
            //    return
            // };
            // if (this.level === 'warn') {
            //    console.warn(this.head, ...this.message)
            //    return
            // };
            if (this.head) {
               const style = this.level === "warn" ? "color:orange" : this.level === "info" ? "color:green" : "color:red";
               console.log(`%c${this.head}`, style, '\n', ...this.message)
            } else {
               console.log(...this.message)
            }
         }
      };
      function log(...args) {
         if (!(this instanceof log)) return new log(...args);
         this.data = 1;
         log.info(...args);
      };
      log.info = function (...args) {
         try {
            throw new CustomError(args, 'info');
         } catch (err) {
            err.logger();
         }
      };
      log.warn = function (...args) {
         try {
            throw new CustomError(args, 'warn');
         } catch (err) {
            err.logger();
         }
      };
      log.error = function (...args) {
         try {
            throw new CustomError(args, 'error');
         } catch (err) {
            err.logger();
         }
      };


      class EventBase extends EventTarget {
         constructor() { super() };
         static result = function SUNCustomEvent(options) {
            if (n.helper.type(options.detail)) for (const key in options.detail) this[key] = options.detail[key];
            this.target = options.target;
            this.timeStamp = options.timeStamp;
            this.type = options.type;
         };

         addEventListener(type, listener, options) {
            // Bungkus listener asli
            const wrapped = (e) => listener.call(this, new EventBase.result(e));
            // Simpan reference agar bisa removeEventListener jika dibutuhkan
            if (!this._wrappedListeners) this._wrappedListeners = new WeakMap();
            this._wrappedListeners.set(listener, wrapped);
            // Daftarkan ke EventTarget asli
            super.addEventListener(type, wrapped, options);
         };

         removeEventListener(type, listener, options) {
            if (this._wrappedListeners && this._wrappedListeners.has(listener)) {
               super.removeEventListener(type, this._wrappedListeners.get(listener), options);
               this._wrappedListeners.delete(listener);
            }
         };

         static trigger(element, type, data) {
            if (typeof type !== "string") return;
            if (data) {
               const evt = new CustomEvent(type, { bubbles: true, detail: data });
               element.dispatchEvent(evt);
            } else {
               const evt = new Event(type, { bubbles: true });
               element.dispatchEvent(evt);
            }
         }
      };
      // ==================================================
      // Core engine
      // ==================================================
      const
         d = document,
         notUse = 'no-use',
         inter = {
            config: {
               observer: false,
               instanceMethod: false,
               formCostum: false,
               router: false,
               platform: false,
               // max entri yang disimpan per instance sebelum drop oldest (default kecil supaya aman)
               maxDeferredPerInstance: 20,
               // jika true, panggilan beruntun ke method yang sama akan digantikan oleh panggilan terakhir
               coalesceDeferredCalls: true,
               // batas total panggilan yang dieksekusi per tick saat replay
               maxDeferredCallsPerTick: 200,
               // static queue config
               maxDeferredStaticCalls: 200,
               coalesceDeferredStaticCalls: true,
               flag: false,
               _deferred: {
                  deferredInstancesList: null,
                  deferredStaticQueue: null
               }
            },
            resolve: null,
            promise: null,
            promiseResolved: null,
            typeNameMap: {},
         },
         n = function () {
            inter.promise = new Promise((res => inter.resolve = res));

            const n = function (selector) {
               const instance = new n.fn.init(selector);
               // prepare deferred queue for instance (on the real target)
               instance._deferredQueue = instance._deferredQueue || [];
               // flag untuk menandai apakah instance sudah didaftarkan ke daftar replay
               instance._deferredEnqueued = instance._deferredEnqueued || false;
               const proxyHandler = {
                  get(target, prop, receiver) {
                     const value = Reflect.get(target, prop, receiver);
                     if (prop === "length") return value;
                     // jika properti tidak ada -> kembalikan fungsi proxy yang mengantri panggilan
                     if (!value) {
                        return function (...args) {
                           // jika promise belum resolved -> enqueue supaya dieksekusi nanti
                           if (!inter.promiseResolved) {
                              target._deferredQueue = target._deferredQueue || [];
                              // daftarkan proxy ke list hanya pada enqueue pertama
                              if (!target._deferredEnqueued) {
                                 n._deferredInstances = n._deferredInstances || new WeakSet();
                                 n._deferredInstances.add(receiver);
                                 inter.config._deferred.deferredInstancesList = inter.config._deferred.deferredInstancesList || [];
                                 inter.config._deferred.deferredInstancesList.push(receiver);
                                 target._deferredEnqueued = true;
                              }
                              const max = inter.config?.maxDeferredPerInstance || 100;
                              // entry yang akan disimpan
                              const entry = { prop, args, receiver };
                              if (inter.config?.coalesceDeferredCalls && target._deferredQueue.length) {
                                 const last = target._deferredQueue[target._deferredQueue.length - 1];
                                 if (last.prop === prop) {
                                    // khusus: jika css dan argumen object -> merge object (hemat entri)
                                    if (prop === 'css' && args.length === 1 && typeof args[0] === 'object' && last.args?.[0] && typeof last.args[0] === 'object') {
                                       last.args[0] = { ...last.args[0], ...args[0] };
                                    } else {
                                       // ganti panggilan terakhir dengan yang terbaru
                                       target._deferredQueue[target._deferredQueue.length - 1] = entry;
                                    }
                                 } else {
                                    target._deferredQueue.push(entry);
                                 }
                              } else {
                                 target._deferredQueue.push(entry);
                              }
                              if (target._deferredQueue.length > max) target._deferredQueue.shift();
                              // kembalikan receiver untuk chaining
                              return receiver;
                           }
                           // Jika properti ada pada prototipe DOM/Window/Document, jangan keluarkan warning
                           try {
                              if (typeof prop === 'string') {
                                 const protoList = [Element.prototype, HTMLElement.prototype, Node.prototype, Document.prototype, Window.prototype];
                                 for (const P of protoList) {
                                    if (P && prop in P) {
                                       return receiver;
                                    }
                                 }
                              }
                           } catch (e) { /* safe fallback */ }
                           // sudah resolved: beri peringatan (method benar-benar tidak ada pada sunQuery instance)
                           log.warn('[⚙️sunQuery] instance', `tidak memiliki property '${prop}'`);
                           return receiver;
                        };
                     };
                     // jika method dinonaktifkan oleh konfigurasi
                     if (value === notUse) {
                        log.warn(`[⚙️sunQuery] instanceMethods '${prop}'`, `tidak diaktifkan pada Konfigurasi\nhttps://github.com/SUN-solutions2025/sunQuery-Framework`);
                        return function proxy() { return this };
                     }
                     // jika properti adalah function, kembalikan wrapper yang menunda eksekusi
                     if (typeof value === "function") {
                        return function (...args) {
                           // jika instance methods belum diaktifkan / promise belum resolved -> enqueue
                           const shouldDefer = !inter.config.instanceMethod || (inter.promise && typeof inter.promise.then === 'function' && n._promisePending !== false && !inter.config.instanceMethod);
                           // Better: defer while inter.promise belum resolved
                           if (!inter.promiseResolved) {
                              target._deferredQueue = target._deferredQueue || [];
                              // daftarkan proxy ke list hanya pada enqueue pertama
                              if (!target._deferredEnqueued) {
                                 n._deferredInstances = n._deferredInstances || new WeakSet();
                                 n._deferredInstances.add(receiver);
                                 inter.config._deferred.deferredInstancesList = inter.config._deferred.deferredInstancesList || [];
                                 inter.config._deferred.deferredInstancesList.push(receiver);
                                 target._deferredEnqueued = true;
                              }
                              const max = inter.config?.maxDeferredPerInstance || 100;
                              const entry = { prop, args, receiver };
                              if (inter.config?.coalesceDeferredCalls && target._deferredQueue.length) {
                                 const last = target._deferredQueue[target._deferredQueue.length - 1];
                                 if (last.prop === prop) {
                                    // merge khusus untuk css
                                    if (prop === 'css' && args.length === 1 && typeof args[0] === 'object' && last.args?.[0] && typeof last.args[0] === 'object') {
                                       last.args[0] = { ...last.args[0], ...args[0] };
                                    } else {
                                       target._deferredQueue[target._deferredQueue.length - 1] = entry;
                                    }
                                 } else {
                                    target._deferredQueue.push(entry);
                                 }
                              } else {
                                 target._deferredQueue.push(entry);
                              }
                              if (target._deferredQueue.length > max) target._deferredQueue.shift();
                              // kembalikan receiver untuk chaining
                              return receiver;
                           }
                           // langsung eksekusi kalau siap
                           return value.apply(receiver, args);
                        };
                     }
                     return value;
                  },
               };
               const proxy = new Proxy(instance, proxyHandler);
               // NOTE: jangan langsung push semua proxy ke list — hanya push saat enqueue pertama
               return proxy;
            }, exclude_config = ['maxDeferredPerInstance', 'coalesceDeferredCalls', 'maxDeferredCallsPerTick', 'maxDeferredStaticCalls', 'coalesceDeferredStaticCalls', 'flag', '_deferred'];
            n.fn = n.prototype = {
               constructor: n,
               pushStack(a) {
                  a = (a || []).filter(Boolean);
                  // Simpan referensi ke instance sebelumnya untuk .end()
                  const prev = Object.create(this);
                  for (let i = 0; i < this.length; i++) prev[i] = this[i];
                  prev.length = this.length;
                  prev.selector = this.selector;
                  // prev.prevSelector = this.prevSelector;

                  // Merge elemen baru
                  let b = n.helper.merge(new this.constructor(), a);
                  for (let i = 0; i < this.length; i++) delete this[i];
                  Object.assign(this, b);
                  this.length = b.length;
                  // this.prevSelector = prev; // chain ke instance sebelumnya

                  return this;
               },
               forEach(callback) {
                  if (typeof callback === "function") {
                     for (let i = 0; i < this.length; i++) {
                        callback.call(this[i], this[i], i);
                     }
                  }
                  return this;
               },
               [Symbol.iterator]: function () {
                  let index = 0,
                     self = this;
                  return {
                     next() {
                        return index < self.length
                           ? { value: self[index++], done: false }
                           : { done: true };
                     },
                  };
               },
            };
            n.fn.init = function sunQuery(selector) {
               if (!selector) return;
               let elements = [];
               if (typeof selector === "string") {
                  elements = d.querySelectorAll(selector);
                  Array.prototype.push.apply(this, elements);
                  this.selector = selector;
                  this.length = elements.length;
               } else if (n.helper.type(selector, "array")) {
                  const mp = [];
                  for (let i = 0; i < selector.length; i++) {
                     mp.push(n.helper.findElementSelector.list(selector[i]));
                     this[i] = selector[i];
                  }
                  this.selector = mp;
                  this.length = selector.length;
               } else if (n.helper.type(selector, "sunQuery")) {
                  this.selector = selector.selector;
                  for (let i = 0; i < selector.length; i++) this[i] = selector[i];
                  this.length = selector.length;
               } else {
                  this[0] = selector;
                  this.selector = n.helper.findElementSelector.list(selector);
                  this.length = 1;
               }
            };
            n.fn.init.prototype = n.fn;
            "Boolean Number String Function Array Date RegExp Object Error".split(" ").forEach((t) => (inter.typeNameMap["[object " + t + "]"] = t.toLowerCase()));
            n.log = log;
            n.config = async function (options) {
               if (inter.config.flag) return;
               inter.config.flag = true;
               for (const key in options) {
                  if (exclude_config.includes(key)) {
                     delete options[key];
                     continue;
                  }
               }
               if (options?.__std__) {
                  delete options.__std__;
               } else {
                  await new Promise((res) => setTimeout(() => res(), 0));
               }
               options.instanceMethod = options?.instanceMethod != false;
               options.observer = options?.observer == true;
               options.formCostum = options?.formCostum == true;
               inter.config = { ...inter.config, ...options };
               inter.resolve();
            };
            n.getConfig = async function () {
               await inter.promise;
               return structuredClone(Object.fromEntries(Object.entries(inter.config).filter(([key]) => !exclude_config.includes(key))));
            }
            n.helper = {
               isJson(str) {
                  if (typeof str !== "string") return false;
                  const trimmed = str.trim();
                  if (!(trimmed.startsWith("{") || trimmed.startsWith("[")))
                     return false;
                  try {
                     const parsed = JSON.parse(str);
                     return parsed && typeof parsed === "object";
                  } catch {
                     return false;
                  }
               },
               isSymbol(val) {
                  return Object.prototype.toString.call(val) === '[object Symbol]';
               },
               type(selector, value = null) {
                  const _type = (function () {
                     if (selector === null) return "null";
                     if (typeof selector === "object" || typeof selector === "function") {
                        if (
                           typeof selector === "function" &&
                           /^class\s/.test(Function.prototype.toString.call(selector))
                        )
                           return "class";
                        if (selector instanceof n) return "sunQuery";
                        if (selector?.nodeType) return "html";
                        return (
                           inter.typeNameMap[inter.typeNameMap.toString.call(selector)] ||
                           "object"
                        );
                     }
                     if (n.helper.isJson(selector)) return "stringJson";
                     if (n.helper.isSymbol(selector)) return "symbol";
                     // 
                     var match = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/.exec(selector);
                     if (match && match[1]) {
                        return "stringHtml";
                     }
                     return typeof selector;
                  })();
                  return typeof value === "string" ? _type === value : _type;
               },
               normalizeSize(name) {
                  const map = {
                     small: 'sm',
                     medium: 'md',
                     large: 'lg',
                     sm: 'sm',
                     md: 'md',
                     lg: 'lg'
                  };
                  return map[name?.toLowerCase()] || 'lg';
               },
            };
            n.ready = async function (callback) {
               await inter.promise;
               if (document.readyState === "loading") {
                  await new Promise((resolve) => d.addEventListener("DOMContentLoaded", resolve, { once: true }));
               };
               typeof callback === 'function' && callback();
               return n.getConfig;
            }
            n.EventCustom = function (type, data) {
               let config = { bubbles: false, cancelable: true };
               const event = () => new CustomEvent(type, { ...config, detail: data });
               return new (class EventBuildAPI {
                  target(instance) {
                     instance.dispatchEvent(event());
                  }
                  config(options) {
                     return (config = { ...config, ...options }), this;
                  }
               })();
            };
            n.linePattern = ['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'];
            n.linePattern.forEach(p => n[p.toUpperCase()] = Symbol(p));
            n.positionStyle = ['absolute', 'fixed', 'relative', 'static', 'sticky'];

            n.positionStyle.forEach((p, i) => {
               // jika index < 3, buat singkatan 3 huruf pertama
               const key = (i < 3 ? p.slice(0, 3) : p).toUpperCase();
               n[key] = Symbol(p);
            });


            async function nEvent() {
               const ev = new EventBase();
               n.addEventListener = (...args) => ev.addEventListener(...args);
               n.removeEventListener = (...args) => ev.removeEventListener(...args);
               n.dispatchEvent = (...args) => ev.dispatchEvent(...args);
               if (document.readyState === "loading") {
                  await new Promise((resolve) => d.addEventListener("DOMContentLoaded", resolve, { once: true }));
               };
               await inter.promise;
               n.EventCustom('afterinit', structuredClone(Object.fromEntries(Object.entries(inter.config).filter(([key]) => !exclude_config.includes(key))))).target(n);
               inter.promiseResolved = true;
            };
            nEvent();

            !async function () {
               const cfg = await n.getConfig()
               async function router() {
                  const path_url = { controller_name: null, path: '/', params: {}, segments: [] };
                  function wrt() {
                     const hash = location.hash.replace(/^#\/?/, '') || '/';
                     const [pathPart, queryPart] = hash.split('?');
                     path_url.path = pathPart;
                     path_url.segments = pathPart.split('/').filter(Boolean);
                     path_url.params = {};
                     if (queryPart) {
                        for (const [k, v] of new URLSearchParams(queryPart)) path_url.params[k] = v;
                     };
                     path_url.controller_name = path_url.segments[0] || '';
                     // n.EventCustom('routes', { ...path_url }).target(n);
                  };
                  function setHash(hash) {
                     wrt();
                     n.EventCustom('routes', { ...path_url }).target(n);
                  }
                  window.addEventListener("hashchange", setHash);
                  // await new Promise((resolve) => setTimeout(resolve, 50));
                  // log('ROUTER')
                  // n.addEventListener('afterinit', async function () {
                  //    wrt();
                  // });
                  n.router = new function () {
                     this.path = () => path_url.path;
                     this.segments = () => path_url.segments;
                     this.params = () => path_url.params;
                     this.controller = () => path_url.controller_name;
                  }
                  n.ready(setHash);
               };
               class PlatformAPI {
                  #breakpoints = null;
                  #globalWatchers = [];
                  #mediaQueries = [];
                  #data = {
                     orientation: null,
                     device: null,
                     os: 'unknown',
                     browser: {
                        type: 'unknown',
                        version: 'unknown'
                     },
                     touch: null,
                     language: null,
                  };
                  #orientationQuery = null;
                  #asu(fn, delay) {
                     let timer = null;
                     return function (...args) {
                        clearTimeout(timer);
                        timer = setTimeout(() => fn.apply(this, args), delay);
                     };
                  }

                  #debounce = this.#asu(() => {
                     for (const cb of this.#globalWatchers) cb(this.#data);
                  }, 300);

                  constructor(breakpoints) {
                     this.#breakpoints = breakpoints;

                     this.#data.orientation = this.#getOrientation();
                     for (const [name, query] of Object.entries(breakpoints)) {
                        const mq = window.matchMedia(query);
                        const handler = e => this.#handleMediaChange(name, e.matches);

                        mq.addEventListener('change', handler);
                        this.#mediaQueries.push({ mq, handler, name });

                        if (mq.matches) this.#data.device = name;
                     };
                     this.#init();
                  };

                  #init() {
                     this.#setupOrientationListener();
                     const ua = navigator.userAgent;
                     // OS detection
                     if (/windows/i.test(ua)) this.#data.os = "Windows";
                     else if (/android/i.test(ua)) this.#data.os = "Android";
                     else if (/linux/i.test(ua)) this.#data.os = "Linux";
                     else if (/iphone|ipad|ipod/i.test(ua)) this.#data.os = "iOS";
                     else if (/macintosh|mac os x/i.test(ua)) this.#data.os = "MacOS";

                     if (/firefox/i.test(ua)) {
                        this.#data.browser.type = "Firefox";
                        this.#data.browser.version = ua.match(/firefox\/([\d.]+)/i)?.[1] || "";
                     } else if (/edg/i.test(ua)) {
                        this.#data.browser.type = "Edge";
                        this.#data.browser.version = ua.match(/edg\/([\d.]+)/i)?.[1] || "";
                     } else if (/chrome|crios/i.test(ua)) {
                        this.#data.browser.type = "Chrome";
                        this.#data.browser.version = ua.match(/(?:chrome|crios)\/([\d.]+)/i)?.[1] || "";
                     } else if (/safari/i.test(ua)) {
                        this.#data.browser.type = "Safari";
                        this.#data.browser.version = ua.match(/version\/([\d.]+)/i)?.[1] || "";
                     } else if (/opera|opr/i.test(ua)) {
                        this.#data.browser.type = "Opera";
                        this.#data.browser.version = ua.match(/(?:opera|opr)\/([\d.]+)/i)?.[1] || "";
                     } else if (/msie|trident/i.test(ua)) {
                        this.#data.browser.type = "IE";
                        this.#data.browser.version = ua.match(/(?:msie |rv:)([\d.]+)/i)?.[1] || "";
                     }

                     this.#data.touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
                     this.#data.language = navigator.language || navigator.userLanguage;
                  };

                  #getOrientation() {
                     return window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape';
                  };

                  #handleMediaChange(name, matched) {
                     if (matched && this.#data.device !== name) {
                        this.#data.device = name;
                        this.#debounce();
                     }
                  };

                  #setupOrientationListener() {
                     const orientationQuery = window.matchMedia('(orientation: portrait)');
                     const handler = e => {
                        const newOrientation = e.matches ? 'portrait' : 'landscape';
                        if (newOrientation !== this.#data.orientation) {
                           this.#data.orientation = newOrientation;
                           this.#debounce();
                        }
                     };
                     orientationQuery.addEventListener('change', handler);
                     this.#orientationQuery = { mq: orientationQuery, handler };
                  };

                  watcher(mediaOrCb) {
                     if (typeof mediaOrCb === 'function') {
                        this.#globalWatchers.push(mediaOrCb);
                        // ✅ Jalankan callback langsung saat inisialisasi
                        mediaOrCb(this.#data);
                     }
                  };

                  destroy() {
                     for (const { mq, handler } of this.#mediaQueries) {
                        mq.removeEventListener('change', handler);
                     }
                     if (this.#orientationQuery) {
                        this.#orientationQuery.mq.removeEventListener('change', this.#orientationQuery.handler);
                     }
                     this.#globalWatchers = [];
                  };
               }

               const platfor_std = { mobile: '(max-width: 767px)', tablet: '(min-width: 768px) and (max-width: 1023px)', desktop: '(min-width: 1024px)' }
               if (typeof cfg.platform === 'boolean') {
                  cfg.platform && (n.platform = new PlatformAPI(platfor_std));
               } else if (n.helper.type(cfg.platform, 'object')) {
                  for (const key in cfg.platform) {
                     if (!platfor_std[key]) continue;
                     if (typeof cfg.platform[key] !== 'string') continue;
                     platfor_std[key] = cfg.platform[key]
                  }
                  n.platform = new PlatformAPI(platfor_std);
               } else {
                  log.error(`[platform] init`, `configuration is invalid, use type 'boolean' or 'object' instead of '${n.helper.type(cfg.platform)}'`);
               };

               if (n.platform) {
                  await n.ready();
                  n.platform.watcher(media => {
                     d.body.classList.toggle('mobile', media.device === 'mobile');
                     d.body.classList.toggle('tablet', media.device === 'tablet');
                     d.body.classList.toggle('desktop', media.device === 'desktop');
                     d.body.classList.toggle('landscape', media.orientation === 'landscape');
                     d.body.classList.toggle('portrait', media.orientation === 'portrait');
                  });
               };
               cfg.router && router();
            }();
            // jalankan config auto, jika user tidak melakukan config;
            d.readyState === "loading" && d.addEventListener("DOMContentLoaded", () => n.config({ __std__: true }), { once: true });
            const objectProxies = new WeakMap();
            // function -> Map(propName -> proxy)
            const functionProxyCache = new WeakMap();
            function getFunctionProxy(fn, propName, rootReceiver) {
               let map = functionProxyCache.get(fn);
               if (!map) {
                  map = new Map();
                  functionProxyCache.set(fn, map);
               }
               if (map.has(propName)) return map.get(propName);
               let proxy; // akan diisi setelah handler dibuat supaya bisa dipakai sebagai receiver
               const handler = {
                  // Jika config sudah resolved -> short-circuit, jangan buat overhead proxy
                  apply(fnTarget, thisArg, args) {
                     if (inter.promiseResolved) return Reflect.apply(fnTarget, thisArg, args);
                     if (!inter.promiseResolved) {
                        inter.config._deferred.deferredStaticQueue = inter.config._deferred.deferredStaticQueue || [];
                        const max = inter.config?.maxDeferredStaticCalls || 200;
                        const entry = { prop: propName, args, receiver: rootReceiver || proxy || n };
                        if (inter.config?.coalesceDeferredStaticCalls && inter.config._deferred.deferredStaticQueue.length) {
                           const last = inter.config._deferred.deferredStaticQueue[inter.config._deferred.deferredStaticQueue.length - 1];
                           if (last.prop === propName && last.receiver === entry.receiver) {
                              inter.config._deferred.deferredStaticQueue[inter.config._deferred.deferredStaticQueue.length - 1] = entry;
                           } else {
                              inter.config._deferred.deferredStaticQueue.push(entry);
                           }
                        } else {
                           inter.config._deferred.deferredStaticQueue.push(entry);
                        }
                        if (inter.config._deferred.deferredStaticQueue.length > max) inter.config._deferred.deferredStaticQueue.shift();
                        return entry.receiver; // kembalikan receiver (proxy/n) untuk chaining
                     }
                     return Reflect.apply(fnTarget, thisArg, args);
                  },
                  get(fnTarget, p, recv) {
                     // jika sudah resolved -> return nilai asli tanpa wrapping
                     if (inter.promiseResolved) return Reflect.get(fnTarget, p, recv);
                     const v = fnTarget[p];
                     if (typeof v === "function") {
                        // nested function property => buat proxy dengan receiver = proxy (fungsi proxied)
                        return getFunctionProxy(v, p, proxy);
                     }
                     if (v && typeof v === "object") {
                        // jika property adalah object, gunakan objectProxies agar fungsi di dalamnya juga ter-proxy
                        if (!objectProxies.has(v)) {
                           const objProxy = new Proxy(v, {
                              get(objTarget, objProp, objRecv) {
                                 // short-circuit ketika config sudah selesai
                                 if (inter.promiseResolved) return Reflect.get(objTarget, objProp, objRecv);
                                 const val = objTarget[objProp];
                                 if (typeof val === "function") return getFunctionProxy(val, objProp, objRecv || proxy);
                                 return val;
                              }
                           });
                           objectProxies.set(v, objProxy);
                        }
                        return objectProxies.get(v);
                     }
                     return v;
                  }
               };
               proxy = new Proxy(fn, handler);
               map.set(propName, proxy);
               return proxy;
            }
            return new Proxy(n, {
               get(target, prop, receiver) {
                  // Jika config sudah selesai, short‑circuit: kembalikan nilai asli tanpa proxying
                  if (typeof prop === 'string' && prop.startsWith("_")) {
                     // log('_config')
                     // throw new Error("xxx");

                  }
                  if (inter.promiseResolved) return Reflect.get(target, prop, receiver);
                  const value = target[prop];
                  if (typeof prop === "symbol") return value;
                  if (prop === 'config' ||
                     prop === 'getConfig' ||
                     prop === 'log' ||
                     // prop === 'storage' ||
                     prop === 'ready' ||
                     prop === 'extend' ||
                     prop === 'helper' ||
                     prop === 'plugin' ||
                     prop === 'observer' ||
                     prop === 'ajax' ||
                     prop === 'fn' ||
                     prop === 'EventCustom' ||
                     prop === '_promise' ||
                     prop === 'createElement' ||
                     prop === 'createForm' ||
                     prop === 'addEventListener' ||
                     prop === 'EventCustom' ||
                     prop === 'removeEventListener' ||
                     prop === 'qrCode' ||
                     prop === 'PDF' ||
                     prop === 'linePattern' ||
                     prop === 'positionStyle' ||
                     prop === 'trigger') {
                     return value;
                  };
                  // jika property adalah function statis -> wrapper yang menunda saat belum resolved
                  if (typeof value === "function") {
                     return getFunctionProxy(value, prop, receiver);
                  }
                  // Jika object => bungkus dengan proxy yang juga mem‑proxy fungsi internalnya
                  if (value && typeof value === "object") {
                     if (!objectProxies.has(value)) {
                        const objProxy = new Proxy(value, {
                           get(objTarget, objProp, objReceiver) {
                              // short-circuit ketika config sudah selesai
                              if (inter.promiseResolved) return Reflect.get(objTarget, objProp, objReceiver);
                              const v = objTarget[objProp];
                              if (typeof v === "function") {
                                 // buat/ambil proxy function yang menyimpan receiver = objReceiver (proxied object)
                                 return getFunctionProxy(v, objProp, objReceiver);
                              }
                              return v;
                           }
                        });
                        objectProxies.set(value, objProxy);
                     }
                     return objectProxies.get(value);
                  }

                  return value;
               },
            });
         }();
      function addHelper(source) {
         for (const key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
               n.helper[key] = source[key];
            }
         }
      };
      n.extend = function (target, ...sources) {
         sources.forEach(src => {
            if (!src) return;
            for (const key in src) {
               if (Object.prototype.hasOwnProperty.call(src, key)) {
                  target[key] = src[key];
               }
            }
         });
         return target;
      };
      n.fn.extend = function (obj) {
         n.ready(() => {
            const cfg = inter.config;
            if (cfg.instanceMethod) {
               n.extend(this, obj);
            } else {
               Object.keys(obj).forEach(key => obj[key] = notUse);
               n.extend(this, obj);
            }

         });
      };

      n.extend(n, {
         async plugin(name, factory) {
            const plugin_type_map = { form: (tp) => n.createForm._factory_type(tp) };//saat ini hanya masih mendukung jenis formulir belum element lainnya
            // log('PLUGIN-INIT')
            const cfg = await n.getConfig();
            // log('PLUGIN', cfg.formCostum)
            if (!cfg.formCostum && name === 'form') {
               // log('FORM-CUTOM=OFF')
               // jika config formCostum = false, maka plugin form tidak didukung
               return;
            }
            if (!plugin_type_map[name]) {
               log.error(`[plugins] not support`, `'${name}' tidak didukung`);
               return;
            };
            // aktifkan observer internal
            const _obs = n.plugin._obsMonitor();
            for (const key in factory) {
               const map = plugin_type_map[name]?.(key);
               if (!map) {
                  log.error(`[plugins] type '${name}'`, `'${key}' bukan termasuk element ${name}`);
                  continue;
               }
               _obs.define(map.selector, factory[key]);
            };
            // 
            return n;
         },
         RGBColor: function (color_string) {
            color_string = color_string || "";
            this.ok = false;

            // strip any leading #
            if (color_string.charAt(0) == "#") {
               // remove # if any
               color_string = color_string.substr(1, 6);
            }
            color_string = color_string.replace(/ /g, "");
            color_string = color_string.toLowerCase();
            var channels;

            // before getting into regexps, try simple matches
            // and overwrite the input
            var simple_colors = {
               aliceblue: "f0f8ff",
               antiquewhite: "faebd7",
               aqua: "00ffff",
               aquamarine: "7fffd4",
               azure: "f0ffff",
               beige: "f5f5dc",
               bisque: "ffe4c4",
               black: "000000",
               blanchedalmond: "ffebcd",
               blue: "0000ff",
               blueviolet: "8a2be2",
               brown: "a52a2a",
               burlywood: "deb887",
               cadetblue: "5f9ea0",
               chartreuse: "7fff00",
               chocolate: "d2691e",
               coral: "ff7f50",
               cornflowerblue: "6495ed",
               cornsilk: "fff8dc",
               crimson: "dc143c",
               cyan: "00ffff",
               darkblue: "00008b",
               darkcyan: "008b8b",
               darkgoldenrod: "b8860b",
               darkgray: "a9a9a9",
               darkgreen: "006400",
               darkkhaki: "bdb76b",
               darkmagenta: "8b008b",
               darkolivegreen: "556b2f",
               darkorange: "ff8c00",
               darkorchid: "9932cc",
               darkred: "8b0000",
               darksalmon: "e9967a",
               darkseagreen: "8fbc8f",
               darkslateblue: "483d8b",
               darkslategray: "2f4f4f",
               darkturquoise: "00ced1",
               darkviolet: "9400d3",
               deeppink: "ff1493",
               deepskyblue: "00bfff",
               dimgray: "696969",
               dodgerblue: "1e90ff",
               feldspar: "d19275",
               firebrick: "b22222",
               floralwhite: "fffaf0",
               forestgreen: "228b22",
               fuchsia: "ff00ff",
               gainsboro: "dcdcdc",
               ghostwhite: "f8f8ff",
               gold: "ffd700",
               goldenrod: "daa520",
               gray: "808080",
               green: "008000",
               greenyellow: "adff2f",
               honeydew: "f0fff0",
               hotpink: "ff69b4",
               indianred: "cd5c5c",
               indigo: "4b0082",
               ivory: "fffff0",
               khaki: "f0e68c",
               lavender: "e6e6fa",
               lavenderblush: "fff0f5",
               lawngreen: "7cfc00",
               lemonchiffon: "fffacd",
               lightblue: "add8e6",
               lightcoral: "f08080",
               lightcyan: "e0ffff",
               lightgoldenrodyellow: "fafad2",
               lightgrey: "d3d3d3",
               lightgreen: "90ee90",
               lightpink: "ffb6c1",
               lightsalmon: "ffa07a",
               lightseagreen: "20b2aa",
               lightskyblue: "87cefa",
               lightslateblue: "8470ff",
               lightslategray: "778899",
               lightsteelblue: "b0c4de",
               lightyellow: "ffffe0",
               lime: "00ff00",
               limegreen: "32cd32",
               linen: "faf0e6",
               magenta: "ff00ff",
               maroon: "800000",
               mediumaquamarine: "66cdaa",
               mediumblue: "0000cd",
               mediumorchid: "ba55d3",
               mediumpurple: "9370d8",
               mediumseagreen: "3cb371",
               mediumslateblue: "7b68ee",
               mediumspringgreen: "00fa9a",
               mediumturquoise: "48d1cc",
               mediumvioletred: "c71585",
               midnightblue: "191970",
               mintcream: "f5fffa",
               mistyrose: "ffe4e1",
               moccasin: "ffe4b5",
               navajowhite: "ffdead",
               navy: "000080",
               oldlace: "fdf5e6",
               olive: "808000",
               olivedrab: "6b8e23",
               orange: "ffa500",
               orangered: "ff4500",
               orchid: "da70d6",
               palegoldenrod: "eee8aa",
               palegreen: "98fb98",
               paleturquoise: "afeeee",
               palevioletred: "d87093",
               papayawhip: "ffefd5",
               peachpuff: "ffdab9",
               peru: "cd853f",
               pink: "ffc0cb",
               plum: "dda0dd",
               powderblue: "b0e0e6",
               purple: "800080",
               red: "ff0000",
               rosybrown: "bc8f8f",
               royalblue: "4169e1",
               saddlebrown: "8b4513",
               salmon: "fa8072",
               sandybrown: "f4a460",
               seagreen: "2e8b57",
               seashell: "fff5ee",
               sienna: "a0522d",
               silver: "c0c0c0",
               skyblue: "87ceeb",
               slateblue: "6a5acd",
               slategray: "708090",
               snow: "fffafa",
               springgreen: "00ff7f",
               steelblue: "4682b4",
               tan: "d2b48c",
               teal: "008080",
               thistle: "d8bfd8",
               tomato: "ff6347",
               turquoise: "40e0d0",
               violet: "ee82ee",
               violetred: "d02090",
               wheat: "f5deb3",
               white: "ffffff",
               whitesmoke: "f5f5f5",
               yellow: "ffff00",
               yellowgreen: "9acd32"
            };
            color_string = simple_colors[color_string] || color_string;

            // array of color definition objects
            var color_defs = [{
               re: /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/,
               example: ["rgb(123, 234, 45)", "rgb(255,234,245)"],
               process: function process(bits) {
                  return [parseInt(bits[1]), parseInt(bits[2]), parseInt(bits[3])];
               }
            }, {
               re: /^(\w{2})(\w{2})(\w{2})$/,
               example: ["#00ff00", "336699"],
               process: function process(bits) {
                  return [parseInt(bits[1], 16), parseInt(bits[2], 16), parseInt(bits[3], 16)];
               }
            }, {
               re: /^(\w{1})(\w{1})(\w{1})$/,
               example: ["#fb0", "f0f"],
               process: function process(bits) {
                  return [parseInt(bits[1] + bits[1], 16), parseInt(bits[2] + bits[2], 16), parseInt(bits[3] + bits[3], 16)];
               }
            }];

            // search through the definitions to find a match
            for (var i = 0; i < color_defs.length; i++) {
               var re = color_defs[i].re;
               var processor = color_defs[i].process;
               var bits = re.exec(color_string);
               if (bits) {
                  channels = processor(bits);
                  this.r = channels[0];
                  this.g = channels[1];
                  this.b = channels[2];
                  this.ok = true;
               }
            }

            // validate/cleanup values
            this.r = this.r < 0 || isNaN(this.r) ? 0 : this.r > 255 ? 255 : this.r;
            this.g = this.g < 0 || isNaN(this.g) ? 0 : this.g > 255 ? 255 : this.g;
            this.b = this.b < 0 || isNaN(this.b) ? 0 : this.b > 255 ? 255 : this.b;

            // some getters
            this.toRGB = function () {
               return "rgb(" + this.r + ", " + this.g + ", " + this.b + ")";
            };
            this.toHex = function () {
               var r = this.r.toString(16);
               var g = this.g.toString(16);
               var b = this.b.toString(16);
               if (r.length == 1) r = "0" + r;
               if (g.length == 1) g = "0" + g;
               if (b.length == 1) b = "0" + b;
               return "#" + r + g + b;
            };
         },

         LEFT: Symbol('left'),
         RIGHT: Symbol('right'),
         TOP: Symbol('top'),
         BOTTOM: Symbol('bottom'),
         CENTER: Symbol('center'),
         MIDDLE: Symbol('middle'),
         HANGING: Symbol('hanging'),
         ALPHABETIC: Symbol('alphabetic'),
         JUSTIFY: Symbol('justify'),
         AUTO: Symbol('auto'),
         NONE: Symbol('none'),
         MAX: Symbol('max'),
      }).extend(n.plugin, {
         _obsMonitor() {
            if (!n.plugin.instance) {
               n.observer('body', { childList: true, subtree: true });
               n.plugin.instance = new function () {
                  this.maps = [];
                  this.define = function (selector, fn) {
                     this.maps.push({ selector, fn });
                  };

                  n.ready(() => {
                     d.body.addEventListener('addElement', ({ detail }) => {

                        detail.added.forEach(node => {
                           node.querySelectorAll(this.maps.map(m => m.selector)).forEach(el => {
                              const fn = this.maps.filter(key => el.matches(key.selector)).map(src => src.fn.bind(el))?.[0];
                              let attr = n.helper.expando.get(el, 'observer');
                              if (!attr?.formCustom) {
                                 fn();
                                 n.helper.expando.set(el, 'observer', { formCustom: true });
                              }
                           })
                        });
                     });
                     d.querySelectorAll(this.maps.map(m => m.selector)).forEach(el => {
                        const fn = this.maps.filter(key => el.matches(key.selector)).map(src => src.fn.bind(el))?.[0];
                        const attr = n.helper.expando.get(el, 'observer');
                        if (!attr?.formCustom) {
                           fn();
                           n.helper.expando.set(el, 'observer', { formCustom: true });
                        }
                     })
                  })
               }
            };
            return n.plugin.instance;
         },
      });
      n.extend(n, {
         createElement(nodeName, attributes = {}) {
            if (typeof nodeName !== "string" || !nodeName) {
               log.error(`[createElement] nodeName invalid!`, ' nodeName must be a string');
               return null;
            };

            try {
               nodeName = nodeName.toLowerCase();
               const exclude = ["input", "select", "textarea"];
               if (exclude.includes(nodeName)) {
                  return this.createForm(nodeName, attributes);
               }
               const el = d.createElement(nodeName);

               for (const p in attributes) {
                  const value = attributes[p];
                  if (
                     p === "data" &&
                     typeof value === "object" &&
                     value !== null
                  ) {
                     for (const r in value) {
                        el.setAttribute("data-" + r, value[r]);
                     }
                  } else if (p === "content" || p === "html") {
                     if (n.helper.type(value, 'array')) {
                        value.forEach(ar => el.append(ar))
                     } else if (n.helper.type(value, 'html')) {
                        el.append(value);
                     } else if (n.helper.type(value, 'stringHtml')) {
                        el.innerHTML = value;
                     } else if (n.helper.type(value, 'string')) {
                        el.textContent = value;
                     }
                  } else if (p === "text") {
                     el.textContent = value;
                  } else if (
                     typeof value === "string" ||
                     typeof value === "number"
                  ) {
                     el.setAttribute(p, String(value).trim());
                  } else if (typeof value === "boolean") {
                     if (value) el.setAttribute(p, "");
                  }
               }
               return el;
            } catch (err) {
               log.error(`[createElement] failed to create element`, err);
               return null;
            }
         },
         createForm(type, options = {}) {

            const factory = n.createForm._type_form[type];
            if (typeof factory !== "function") {
               log.error(`[createForm] invalid type`, `type '${type}' not found in mapping`);
               return null;
            };
            const el = factory(type);
            if (type === "textarea") el.setAttribute("rows", "1");

            // urutkan key dulu
            const sortedKeys = Object.keys(options).sort();
            let lfag_selected = false;
            for (const key of sortedKeys) {

               const value = options[key];
               const tag = el.tagName.toLowerCase();
               if (tag === 'select') {
                  if (key === "option") {
                     if (n.helper.type(value, 'array')) {
                        const fragment = document.createDocumentFragment();
                        value.forEach(ar => {
                           const opt = n.createElement("option", {
                              value: ar.value,
                              text: ar.text
                           });
                           if (ar?.selected) {
                              lfag_selected = true;
                              opt.selected = true
                           }

                           fragment.appendChild(opt);
                        })
                        el.appendChild(fragment);
                     }
                  } else if (key === "placeholder") {
                     let emptyOpt = el.querySelector('option[value=""]');
                     if (emptyOpt) {
                        // Jika sudah ada, ubah teksnya
                        emptyOpt.textContent = value;
                     } else {
                        // Jika belum ada, buat option baru
                        emptyOpt = d.createElement("option");
                        emptyOpt.value = "";
                        emptyOpt.textContent = value;

                        if (!lfag_selected) {
                           emptyOpt.selected = true
                        }
                        // Sisipkan di awal daftar
                        el.prepend(emptyOpt);
                     }
                  } else if ((key === "value" || key === 'selected')) {
                     if (el.options.length) {
                        el.value = value;
                     }
                  } else if (key === "text") {
                     log.warn(`[select] does not support 'text' attribute`);
                  } else if (key === "html" || key === 'content') {
                     log.warn(`[select] does not support html string writing`);
                  } else if (key === "data" && typeof value === "object" && value !== null) {
                     for (const r in value) {
                        el.setAttribute("data-" + r, value[r]);
                     }
                  } else if (key in el || typeof el.getAttribute(key) !== "undefined") {
                     el.setAttribute(key, value);
                  } else {
                     el[key] = value;
                  }
               } else {
                  if (key === "value") {
                     if (tag === "input" || tag === "textarea") {
                        el.value = value;
                     } else {
                        el.setAttribute("value", value);
                     }
                  } else if (key === "data" && typeof value === "object" && value !== null) {
                     for (const r in value) {
                        el.setAttribute("data-" + r, value[r]);
                     }
                  } else if (key === "content" || key === "html") {
                     el.innerHTML = value;
                  } else if (key === "text") {
                     el.textContent = value;
                  } else if (key in el || typeof el.getAttribute(key) !== "undefined") {
                     el.setAttribute(key, value);
                  } else {
                     el[key] = value;
                  }
               }
            }
            return el;
         },
      }).extend(n.createForm, {
         _factory_form(typeName) {
            const input = d.createElement("input");
            input.type = typeName;
            return input;
         },
         _factory_type(name) {
            if (typeof name === "string") {
               const type = name.toLowerCase();

               if (type === "select") {
                  return { tag: "select", type: null, selector: "select" };
               }
               if (type === "textarea") {
                  return { tag: "textarea", type: null, selector: "textarea" };
               }
               if (Object.keys(n.createForm._type_form).includes(type)) {
                  return { tag: "input", type, selector: `input[type="${type}"]` };
               }

               return null;
            }
         },
      }), n.extend(n.createForm, {
         _type_form: {
            textarea: () => d.createElement("textarea"),
            select: () => d.createElement("select"),
            checkbox: () => {
               const input = d.createElement("input");
               input.type = "checkbox";
               return input;
            },
            radio: () => {
               const input = d.createElement("input");
               input.type = "radio";
               return input;
            },
            hidden: () => n.createForm._factory_form('hidden'),
            text: n.createForm._factory_form,
            password: n.createForm._factory_form,
            email: n.createForm._factory_form,
            number: n.createForm._factory_form,
            // date: () => n.createForm._factory_form("text"),
            datetime: n.createForm._factory_form,
            datetimeLocal: () => n.createForm._factory_form("datetime-local"),
            time: n.createForm._factory_form,
            color: n.createForm._factory_form,
            range: n.createForm._factory_form,
            file: n.createForm._factory_form,
            hidden: n.createForm._factory_form,
            submit: n.createForm._factory_form,
            reset: n.createForm._factory_form,
            url: n.createForm._factory_form,
            tel: n.createForm._factory_form,
            search: n.createForm._factory_form,
         },
      });

      // ==================================================
// method-global
const validation = new function ValidationAPI() {
   this.methods = {
      required: {
         fn: (value) => value.trim() !== '',
         msg: 'Field ini wajib diisi'
      },
   };
   const isHiddenDeep = function (el) {
      if (!el || !(el instanceof HTMLElement)) return true;

      while (el) {
         const style = window.getComputedStyle(el);

         const hiddenByCSS =
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            style.opacity === '0';

         const hiddenByAttr = el.hasAttribute('hidden');

         if (hiddenByCSS || hiddenByAttr) {
            return true;
         }

         el = el.parentElement;
      }

      return false;
   };
   this.validate_field = function (input) {
      const rules = input.getAttribute('rule')?.split(/[| ]+/).map(r => r.trim()).filter(Boolean);
      if (!rules) {
         // hapus flag error jika terdapat element yg tidak memiliki rule
         if (n(input).attr('shadow')) {
            this.showError(input.parentElement, '');
         } else {
            this.showError(input, '');
         }
         return
      };
      // log(input)
      const value = input.value.trim();
      let error = '';
      let target = input;
      for (const rule of rules) {
         const method = this.methods[rule];
         if (method && !method.fn(value, input)) {
            error = input.dataset[`msg${rule.charAt(0).toUpperCase() + rule.slice(1)}`] || method.msg;
            break;
         }
      }


      if (n(input).attr('shadow')) {
         target = input.parentElement;
      }


      if (n.helper.get_attr_element(input, 'disabled') ||
         n.helper.get_attr_element(input, 'readOnly')) {
         this.showError(target, '');
         return true;
      }

      // jika element tersembunyi, maka abaikan error validate
      if (isHiddenDeep(target)) {
         this.showError(target, '');
         return true;
      }
      this.showError(target, error);
      return !error;
   };
   function clearError(input, time = 0) {
      const err = n.helper.expando.get(input, 'error');
      if (err) {
         err.release(time);
         n.helper.expando.remove(input, 'error');
      }
   };
   this.showError = function (input, msg) {
      if (msg) {
         clearError(input);
         input.classList.add('error');
         n.helper.expando.set(input, 'error', q.tooltip({
            timer: 1500,
            target: input,
            // identity: 'form_error',
            content: `<p class="err-msg">${msg}</p>`,
         }));

      } else {
         clearError(input, 300)
         input.classList.remove('error');
      }
   };
   this.validate_form = function (form) {
      let valid = true;
      let firstError = null; // simpan input error pertama
      form.querySelectorAll('[rule]').forEach(input => {
         const isFieldValid = this.validate_field(input);
         if (!isFieldValid) {
            valid = false;
            if (!firstError) firstError = input; // tangkap error pertama
         }
      });
      // jika ada error pertama, scroll ke sana
      if (firstError) {
         setTimeout(() => {
            // jika input tersembunyi karena shadow, gunakan parent
            const target = n(firstError).attr('shadow')
               ? firstError.parentElement
               : firstError;

            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            target.focus?.();
         }, 100); // beri delay kecil agar error message sudah ter-render
      }

      return valid;
   };
};
// end method-global

addHelper({
generateUniqueId(length = 5) {
   const letters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
   const chars = letters + "0123456789";

   function generateCode() {
      let id = letters[Math.floor(Math.random() * letters.length)];
      for (let i = 1; i < length; i++) {
         id += chars[Math.floor(Math.random() * chars.length)];
      }
      return id;
   }

   let newId;
   do {
      newId = generateCode();
   } while (document.getElementById(newId)); // Ulang kalau ID sudah ada di DOM

   return newId;
},
expando: new function ElementExpando() {
   const codeGenerate = () => {
      const chars =
         "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let id = "";
      for (let i = 0; i < 5; i++) {
         const randomIndex = Math.floor(Math.random() * chars.length);
         id += chars[randomIndex];
      }
      return id;
   },
      isEmpty = (obj) => {
         if (!obj) return true;

         if (Array.isArray(obj)) {
            return obj.every(isEmpty);
         }

         if (typeof obj === "object") {
            return (
               Object.keys(obj).length === 0 ||
               Object.values(obj).every(isEmpty)
            );
         }
         return false;
      },
      cache = new WeakMap(),
      thisName = this.constructor.name;
   this.set = function (element, name, options) {
      if (typeof name !== "string") {
         return (
            warn(
               `[📚${thisName}] 'name' harus berupa 'string' tidak boleh '${n.helper.type(
                  name
               )}'`
            ),
            false
         );
      }
      if (!options) {
         return (
            warn(`[📚${thisName}] 'options' wajib memiliki nilai`), false
         );
      }
      if (element instanceof Element || element instanceof Document) {
         let data = cache.get(element);
         if (!data) {
            data = {};
            cache.set(element, data);
            if (
               n.helper.isFormElement(element) &&
               !element.hasAttribute("id")
            ) {
               element.setAttribute("id", codeGenerate());
            }
         }
         if (!data[name]) {
            data[name] = options;
            return true;
         }
         if (
            n.helper.type(data[name]) === "object" &&
            n.helper.type(options) === "object"
         ) {
            for (const key in options) {
               data[name][key] = options[key];
            }
            return true;
         }
         if (
            n.helper.type(data[name]) === "array" &&
            n.helper.type(options) === "array"
         ) {
            options.forEach((el) => {
               if (!data[name].includes(el)) {
                  data[name].push(el);
               }
            });
            // data[name].pushNotExists(...options)
            return true;
         }
         if (
            n.helper.type(data[name]) === "string" &&
            n.helper.type(options) === "string"
         ) {
            data[name] = options;
            return false;
         }
         warn(
            `[📚${thisName}] gagal menyimpan data!\n'${name}' ber-type '${n.helper.type(
               data[name]
            )}' tidak dapat ditimpah dengan '${n.helper.type(options)}'`
         );
         return false;
      } else {
         if (!element instanceof Window) {
            return warn(`[📚${thisName}] element tidak valid!`), false;
         }
      }
   };

   this.get = function (element, name) {
      if (element instanceof Element || element instanceof Document) {
         const obj = cache.get(element);
         return typeof name === "undefined" ? obj : obj?.[name];
      } else {
         if (!element instanceof Window) {
            return warn(`[📚${thisName}] element tidak valid!`), false;
         }
      }
   };
   this.remove = function (element, name) {
      if (element instanceof Element || element instanceof Document) {
         if (!name) {
            cache.delete(element);
         } else {
            const obj = cache.get(element);
            if (obj && obj.hasOwnProperty(name)) {
               delete obj[name];
            }
            if (isEmpty(obj)) {
               /*jika sudah tidak ada data yg disimpan maka, akan menghapus dari map*/
               cache.delete(element);
            }
         }
      } else {
         return warn(`[📚${thisName}] element tidak valid!`), null;
      }
   };
},
merge(target, source) {
   // remove numeric indices in target (original logic)
   for (let key in target) {
      if (
         Object.prototype.hasOwnProperty.call(target, key) &&
         !isNaN(key)
      ) {
         delete target[key];
      }
   }
   let len = source.length || 0;
   for (let i = 0; i < len; i++) target[i] = source[i];
   target.length = len;
   return target;
},
findScrollParent(el) {
   while (el && el !== document.body) {
      const style = getComputedStyle(el);
      if (/(auto|scroll)/.test(style.overflowY)) return el;
      el = el.parentElement;
   }
   return document.body;
},
toHTML(stringHtml) {
   if (n.helper.type(stringHtml) !== "stringHtml")
      return (
         warn(
            `toHTML: arg[0] tidak boleh ${n.helper.type(
               stringHtml
            )} isi dengan 'stringHTML'`
         ),
         []
      );
   let wrap = n.createElement("div"),
      frag = d.createRange().createContextualFragment(stringHtml),
      childs = [];
   wrap.append(frag), wrap.remove();
   childs = Array.from(wrap.children);
   return childs;
},
getVisibleRect(el) {
   if (!(el instanceof Element)) return false;

   const rect = el.getBoundingClientRect();
   const inViewport =
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
      rect.left < (window.innerWidth || document.documentElement.clientWidth);

   if (!inViewport) return false;

   return rect;
},
formatHash(url) {
   if (!url) return '#/';
   // hapus semua karakter # di depan
   let clean = url.replace(/^#*/, "");
   // pastikan diawali dengan /
   if (!clean.startsWith("/")) {
      clean = "/" + clean;
   }
   return "#" + clean;
},
formatNumber(value, decimals = 0) {
   // pastikan angka valid
   const num = Number(value);
   if (isNaN(num)) return '0';
   // jika decimals tidak didefinisikan, tampilkan apa adanya
   let fixed = (typeof decimals === 'number')
      ? num.toFixed(decimals)
      : String(num);
   // ubah titik menjadi koma untuk desimal
   let [intPart, decPart] = fixed.split('.');
   // format bagian ribuan dengan titik
   intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
   // gabungkan lagi
   const val = decPart ? `${intPart},${decPart}` : intPart;
   return {
      [Symbol.toPrimitive]() { return val; },
      toString() { return val.toString(); },
      toNumber() { return Number(num); },
      valueOf() { return val; },
      origin() { return num.toString(); }
   };
},
boxify(val) {
   /**
    * Mengubah array nilai (seperti CSS shorthand) menjadi objek sisi-sisi kotak.
    *
    * Fungsi ini mirip dengan cara CSS menangani shorthand untuk margin/padding.
    * Input berupa array angka (atau nilai lain), dan output berupa objek:
    *   { top, right, bottom, left }
    *
    * Pola konversi mengikuti urutan CSS:
    *   - 1 nilai  → semua sisi sama
    *   - 2 nilai  → [vertical, horizontal]
    *   - 3 nilai  → [top, horizontal, bottom]
    *   - 4 nilai  → [top, right, bottom, left]
    *
    * Contoh:
    *   n.helper.boxify([10])           → {top:10,right:10,bottom:10,left:10}
    *   n.helper.boxify([10,20])        → {top:10,right:20,bottom:10,left:20}
    *   n.helper.boxify([10,20,30])     → {top:10,right:20,bottom:30,left:20}
    *   n.helper.boxify([10,20,30,40])  → {top:10,right:20,bottom:30,left:40}
    *
    * Jika input bukan array valid, hasilnya semua sisi bernilai 0.
    */
   if (!Array.isArray(val)) return { top: 0, right: 0, bottom: 0, left: 0 };

   switch (val.length) {
      case 1:
         return { top: val[0], right: val[0], bottom: val[0], left: val[0] };
      case 2:
         return { top: val[0], right: val[1], bottom: val[0], left: val[1] };
      case 3:
         return { top: val[0], right: val[1], bottom: val[2], left: val[1] };
      case 4:
         return { top: val[0], right: val[1], bottom: val[2], left: val[3] };
      default:
         return { top: 0, right: 0, bottom: 0, left: 0 };
   }
},
parseColor(value) {
   if (value == null) return null;

   // 1️⃣ Jika array: [R, G, B] atau [R, G, B, A]
   if (Array.isArray(value)) {
      const [r, g = 0, b = 0, a = 1] = value;
      if ([r, g, b].every(v => typeof v === 'number' && v >= 0 && v <= 255) &&
         typeof a === 'number' && a >= 0 && a <= 1) {
         return [r, g, b, a];
      };
   }

   // 2️⃣ Jika numeric tunggal (contoh: 0 → hitam)
   if (typeof value === 'number' && value >= 0) {
      const c = Math.min(255, value);
      return [c, c, c, 1];
   }

   // 3️⃣ Jika string
   if (typeof value === 'string') {
      const val = value.trim().toLowerCase();

      // 🔸 HEX (#RGB, #RRGGBB, #RGBA, #RRGGBBAA)
      const hexMatch = val.match(/^#([a-f0-9]{3,4}|[a-f0-9]{6}|[a-f0-9]{8})$/i);
      if (hexMatch) {
         let hex = hexMatch[1];
         if (hex.length === 3 || hex.length === 4) {
            hex = hex.split('').map(c => c + c).join('');
         }
         const r = parseInt(hex.slice(0, 2), 16);
         const g = parseInt(hex.slice(2, 4), 16);
         const b = parseInt(hex.slice(4, 6), 16);
         const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
         return [r, g, b, a];
      }

      // 🔸 rgb()/rgba()
      const rgbMatch = val.match(/^rgba?\(\s*([^)]+)\)$/);
      if (rgbMatch) {
         const parts = rgbMatch[1].split(',').map(v => v.trim());
         if (parts.length >= 3) {
            const r = parseInt(parts[0]);
            const g = parseInt(parts[1]);
            const b = parseInt(parts[2]);
            const a = parts[3] !== undefined ? parseFloat(parts[3]) : 1;
            if ([r, g, b].every(v => !isNaN(v) && v >= 0 && v <= 255) && a >= 0 && a <= 1) {
               return [r, g, b, a];
            }
         }
      }

      // 🔸 Nama warna CSS (uji pakai canvas agar hasil pasti)
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.fillStyle = val;
      const computed = ctx.fillStyle; // akan jadi format standar "rgb(...)" atau "rgba(...)"
      if (computed && computed.startsWith('rgb')) {
         return n.helper.parseColor(computed); // rekursi ke fungsi yang sama
      }
   }

   // ❌ Tidak cocok format apapun
   return null;
},
isImageType(mime) {
   return /^image\/[a-z0-9.+-]+$/i.test(mime);
},
toCamelCase(str) {/*ubah "contoh-nama menjadi contohNama*/return str.replace(/-([a-z])/g, (_, char) => char.toUpperCase()) },
toKebabCase(str) { return str.replace(/([A-Z])/g, "-$1").toLowerCase() },
toSnakeCase(str) { return str.toLowerCase().trim().replace(/\s+/g, "_") },
toCapitalize(str) {
   return str
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());
},
getInitials(name, pos = 2) {
   if (typeof name !== "string") return "";
   return name.trim().split(/\s+/).map(word => word[0].toUpperCase()).slice(0, pos).join("");
},
findElementSelector: new function () {
   this.node = (el) => (el?.nodeType ? el.localName || el.nodeName : null);
   this.id = (el) => (el?.nodeType && el.id ? "#" + el.id : "");
   this.class = (el) => el?.nodeType && el.className ? "." + el.className.trim().replace(/\s+/g, ".") : "";
   this.name = (el) => (el?.nodeType ? el.localName || el.nodeName : "");
   this.list = function (el) { return this.name(el) + this.id(el) + this.class(el) }
},
isJson(str) {
   if (typeof str !== "string") return false;
   const trimmed = str.trim();
   if (!(trimmed.startsWith("{") || trimmed.startsWith("[")))
      return false;
   try {
      const parsed = JSON.parse(str);
      return parsed && typeof parsed === "object";
   } catch {
      return false;
   }
},
isClass(value) {
   if (
      typeof value === "function" &&
      /^class\s/.test(Function.prototype.toString.call(value))
   )
      return true;
   return false;
},
isURL(url) {
   return "undefined" != typeof url && typeof url === "string"
      ? url.match(
         /^(http:\/\/|https:\/\/|www\.|localhost)|(.html|.php|.com|.json|.xml\b)/
      )
         ? !0
         : !1
      : !1;
},
get_attr_element(el, attr) {
   if (!el || !attr) return false;

   // Ubah ke huruf kecil agar konsisten
   attr = attr.toLowerCase();

   // --- 1. Cek properti DOM langsung (misal: el.disabled, el.readOnly, el.checked)
   if (attr in el) {
      const prop = el[attr];
      if (typeof prop === 'boolean') return prop; // Jika properti boolean → langsung pakai
   }

   // --- 2. Cek atribut HTML ---
   const val = el.getAttribute(attr);

   if (val === null) return false; // atribut tidak ada
   if (val === '' || val === attr || val === 'true') return true;
   if (val === 'false') return false;

   // --- 3. Fallback: coba interpretasi string lain ---
   return Boolean(val);
},
isFormElement(el) {
   return (
      el instanceof HTMLInputElement ||
      el instanceof HTMLSelectElement ||
      el instanceof HTMLTextAreaElement
   );
},
getContentType(contentType) {
   if (!contentType || typeof contentType !== 'string') return 'unknown';

   const normalized = contentType.toLowerCase().split(';')[0].trim();

   const typeMap = new Map([
      ['application/json', 'json'],
      ['application/ld+json', 'jsonld'],
      ['application/vnd.api+json', 'jsonapi'],
      ['application/x-ndjson', 'ndjson'],
      ['text/html', 'html'],
      ['text/plain', 'text'],
      ['text/xml', 'xml'],
      ['application/xml', 'xml'],
      ['application/javascript', 'js'],
      ['text/javascript', 'js'],
      ['application/pdf', 'pdf'],
      ['application/zip', 'zip'],
      ['application/octet-stream', 'binary'],
      ['application/x-www-form-urlencoded', 'form'],
      ['multipart/form-data', 'multipart'],
      ['application/graphql', 'graphql'],
      ['text/event-stream', 'sse']
   ]);

   if (typeMap.has(normalized)) return typeMap.get(normalized);

   const [main, subtype] = normalized.split('/');
   if (main === 'image' || main === 'audio' || main === 'video') return subtype;

   return 'unknown';
},
isFunction(scr, fn) {
   let st;
   if (scr instanceof Function) st = true;
   if (typeof scr === 'function') st = true;

   if (st) {
      if (typeof fn === 'function') {
         return fn() || true;
      } else if (typeof fn !== 'undefined') {
         return fn;
      } else {
         return true;
      }
   }
   return false;
},

});
n.fn.extend({
on(event, handler) {
   if (typeof event === "string" && typeof handler === "function") {
      this.forEach((el) => {
         el.addEventListener(event, handler);
      });
   }
   return this;
},
trigger(event, data) {
   this.forEach((el) => EventBase.trigger(el, event, data));
   return this;
},
animate(keyframes, options, callback) {
   if (typeof keyframes === "undefined" || keyframes === "") return this;
   if (typeof options === "undefined" || options === "") return this;
   const promises = [];
   this.forEach((el) => {
      const anim = el.animate(keyframes, options),
         anims = el.getAnimations();
      n.helper.expando.set(el, "animateCache", anims);
      promises.push(...anims.map((a) => a.finished.catch(() => { })));
   });
   this.promise = Promise.all(promises);
   if (typeof callback === "function") {
      this.promise = this.promise.then(() => callback.call(this, this));
   }
   return this;
},
done(callback) {
   if (typeof callback !== "function") return this;
   const allPromises = [];
   this.forEach((el) => {
      const anims = n.helper.expando.get(el, "animateCache");
      if (Array.isArray(anims)) {
         allPromises.push(...anims.map((a) => a.finished.catch(() => { })));
      }
   });
   if (allPromises.length > 0) {
      this.promise = Promise.all(allPromises).then(() => {
         callback.call(this, this);
         this.forEach((el) => n.helper.expando.remove(el, "animateCache"));
      });
   }
   return this;
},
pause() {
   this.forEach((el) => {
      const anims =
         n.helper.expando.get(el, "animateCache") || el.getAnimations();
      anims.forEach((anim) => {
         try {
            anim.pause();
         } catch (err) { }
      });
   });
   return this;
},
resume() {
   this.forEach((el) => {
      const anims =
         n.helper.expando.get(el, "animateCache") || el.getAnimations();
      anims.forEach((anim) => {
         try {
            anim.play();
         } catch (err) { }
      });
   });
   return this;
},
stop() {
   this.forEach((el) => {
      const anims =
         n.helper.expando.get(el, "animateCache") || el.getAnimations();
      anims.forEach((anim) => {
         try {
            anim.cancel();
         } catch (err) { }
      });
      n.helper.expando.remove(el, "animateCache");
   });
   return this;
},
addClass(cls) {
   if (typeof cls === "string" && cls.trim()) {
      const classes = cls.trim().replace(/^[.]*/g, "").split(/\s+/);
      return this.forEach(
         (el) => el.classList && el.classList.add(...classes)
      );
   }
   return this;
},
toggleClass(A) {
   /*Menambahkan jika belum ada, menghapus jika sudah ada.*/
   return (
      "string" === typeof A && A
         ? this.forEach((B) => B.classList.toggle(A))
         : void 0,
      this
   );
},
removeClass(A) {
   /*Menghapus class dari elemen.*/
   let B;
   B =
      "string" === typeof A && A
         ? A.split(" ")
         : n.helper.type(A) === "array"
            ? A
            : false;
   this.forEach((c) => {
      if (B) for (const i of B) c.classList.remove(i);
      else c.classList = "";
   });
   return this;
},
replaceClass(oldClass, newClass) {
   if (typeof oldClass === "string" && typeof newClass === "string") {
      this.forEach((el) => {
         el.classList.remove(...oldClass.trim().split(/\s+/));
         el.classList.add(...newClass.trim().split(/\s+/));
      });
   }
   this;
   return this;
},
hasClass(nameClass) {
   /*Mengecek apakah elemen pertama punya class tertentu.*/
   if (nameClass === "" || typeof nameClass !== "string") return false;
   return this[0].matches("." + nameClass.replace(/^\./, ""));
},
closest(selector) {
   /*Mencari elemen terdekat ke atas yang cocok dengan selector.*/
   if (typeof selector === "undefined" || selector === "") {
      return n(this).parent();
   }
   let result = [];
   for (let i = 0; i < this.length; i++) {
      const el = this[i],
         found = el.closest(selector);
      if (found && !result.includes(found)) {
         result.push(found);
      }
   }
   return this.pushStack(result);
},
next(selector) {
   const result = [];
   this.forEach((el) => {
      let next = el.nextElementSibling;
      if (next) {
         typeof selector === "string"
            ? next.matches(selector) && result.push(next)
            : result.push(next);
      }
   });
   return this.pushStack(result);
},
prev(selector) {
   const result = [];
   this.forEach((el) => {
      let prev = el.previousElementSibling;
      if (prev) {
         typeof selector === "string"
            ? prev.matches(selector) && result.push(prev)
            : result.push(prev);
      }
   });
   return this.pushStack(result);
},
siblings(selector) {
   const result = [];
   this.forEach((el) => {
      const siblings = Array.from(el.parentNode?.children || []);
      siblings.forEach((sib) => {
         if (sib !== el) {
            typeof selector === "string"
               ? sib.matches(selector) && result.push(sib)
               : result.push(sib);
         }
      });
   });
   return this.pushStack(result);
},
children(selector) {
   const result = [];
   this.forEach((el) => {
      const children = Array.from(el.children || []);
      children.forEach((child) =>
         typeof selector === "string"
            ? child.matches(selector) && result.push(child)
            : result.push(child)
      );
   });
   return this.pushStack(result);
},
parent(selector) {
   const result = [];
   this.forEach((el) => {
      const parent = el.parentElement;
      if (parent && !result.includes(parent)) {
         typeof selector === "string"
            ? parent.matches(selector) && result.push(parent)
            : result.push(parent);
      }
   });
   return this.pushStack(result);
},
serialize() {
   const form = this[0];
   if (!form || form.nodeName.toUpperCase() !== "FORM") return "";
   const params = [],
      elements = form.elements;
   for (let i = 0; i < elements.length; i++) {
      const field = elements[i];
      if (
         !field.name ||
         field.disabled ||
         ["file", "reset", "submit", "button"].includes(field.type)
      )
         continue;
      if (field.type === "select-multiple") {
         for (let j = 0; j < field.options.length; j++) {
            const option = field.options[j];
            if (option.selected) {
               params.push(
                  encodeURIComponent(field.name) +
                  "=" +
                  encodeURIComponent(option.value ?? "")
               );
            }
         }
      } else if (
         (field.type !== "checkbox" && field.type !== "radio") ||
         field.checked
      ) {
         params.push(
            encodeURIComponent(field.name) +
            "=" +
            encodeURIComponent(field.value ?? "")
         );
      }
   }
   return params.join("&");
},
css(prop, value) {
   if (typeof prop === "string") {
      if (value !== undefined) {
         this.forEach((el) =>
            value === null || value === ""
               ? el.style.removeProperty(prop)
               : (el.style[prop] = value)
         );
         return this;
      } else {
         return this[0]?.style?.[prop] || getComputedStyle(this[0])[prop];
      }
   } else if (typeof prop === "object") {
      this.forEach((el) => {
         for (let key in prop)
            prop[key] === null || prop[key] === ""
               ? el.style.removeProperty(key)
               : (el.style[key] = prop[key]);
      });
      return this;
   }
},
val(value, text = '') {
   /*penggunaan argument [2] hanya berlaku untuk type 'select'*/
   if (typeof value === "undefined") {
      const el = this[0];
      if (!el) return undefined;
      if (el.multiple && el.options) {
         return Array.from(el.options)
            .filter((opt) => opt.selected)
            .map((opt) => opt.value);
      }
      return el.value;
   } else {
      this.forEach((el) => {
         // -----------------------------------------------------
         // if (el.tagName === 'SELECT') {

         //   let opt = Array.from(el.options).find(o => o.value == value);
         //   if (!opt) {
         //     log(el, text, value)
         //     opt = new Option(text, value);
         //     opt.selected = true
         //     el.add(opt);
         //   }
         // }
         // -----------------------------------------------------
         // el.multiple && el.options && Array.isArray(value) ? Array.from(el.options).forEach((opt) => (opt.selected = value.includes(opt.value))) : (el.value = value);
         if (el.multiple) {
            if (el.options) {
               Array.from(el.options).forEach((opt) => (opt.selected = value.includes(opt.value)));
            }
         } else {
            el.value = value;
         }
      });
      this.trigger("change", { value });
      return this;
   }
},
text(value) {
   if (typeof value === "undefined") {
      /* Getter: ambil teks dari elemen pertama*/
      const el = this[0];
      return el ? el.textContent : "";
   } else {
        /*Setter: atur teks semua elemen*/ this.forEach(
      (el) => (el.textContent = value)
   );
      return this;
   }
},
attr(name, value) {
   /* .attr("href"), .attr("id")	Mengakses/mengatur atribut HTML*/

   if (typeof name === "string" && typeof value === "undefined") {
      const el = this[0];
      // return el ? el.getAttribute(name) : undefined;
      return el ? n.helper.get_attr_element(el, name) : undefined;
   } else if (typeof name === "string") {
      this.forEach((el) => el.setAttribute(name, value));
   } else if (typeof name === "object" && name !== null) {
        /*Setter multiple attr via object*/ this.forEach((el) => {
      for (let key in name) el.setAttribute(key, name[key]);
   });
   }
   return this;
},
prop(name, value) {
   /*.prop("checked"), .prop("disabled")	Akses properti JavaScript DOM langsung*/
   if (typeof name === "string" && typeof value === "undefined") {
      const el = this[0];
      return el ? el[name] : undefined;
   } else if (typeof name === "string") {
      this.forEach((el) => (el[name] = value));
   } else if (typeof name === "object" && name !== null) {
      /*Setter multiple prop via object*/
      this.forEach((el) => {
         for (let key in name) el[key] = name[key];
      });
   }
   return this;
},
append(node, position = "beforeend") {
   if (typeof node === "undefined" || node === "") return this;
   const pos = ["beforebegin", "afterbegin", "beforeend", "afterend"];
   if (!pos.includes(position)) {
      log.warn(
         "argument 'position' pada method 'insertElement' tidak benar"
      );
      return this;
   }
   let newElement =
      (typeof node === "string"
         ? n.helper.toHTML(node)
         : node?.length && Array.from(node)) ||
      (node?.nodeType && [node]);
   this.forEach((elem) =>
      newElement.forEach((newElem) =>
         elem.insertAdjacentElement(position, newElem)
      )
   );
   return this;
},
get(index) {
   if (index === undefined) {
      return [...this];
   }
   if (index < 0) {
      return this[this.length + index];
   }
   return this.length - 1 < index ? null : this[index];
},
find(selector) {
   /*Mencari elemen di dalam elemen lain (seperti querySelectorAll).*/
   if (typeof selector !== "string" || selector === "") return this;
   let result = [];
   for (let i = 0; i < this.length; i++) {
      const found = this[i].querySelectorAll(selector);
      if (found.length) result.push(...found);
   }
   return this.pushStack(result);
},
appendTo(target) {
   const targets = n(target),
      inserted = [];
   targets.forEach((targetEl, i) => {
      this.forEach((el) => {
         const node = i === 0 ? el : el.cloneNode(true);
         targetEl.appendChild(node);
         inserted.push(node);
      });
   });
   return n(inserted);
},
match(selector) {
   const el = this[0];
   if (!el || el.nodeType !== 1) return false;
   return el.matches(selector);
},
removeAttr(attrName) {
   if (typeof attrName !== "string") return this;

   const attrs = attrName.trim().split(/\s+/); // bisa "title" atau "title aria-label"
   this.forEach((el) => {
      attrs.forEach((attr) => el.removeAttribute(attr));
   });

   return this;
},
hide() {
   this.forEach((el) => {
      if (!el || !(el instanceof Element)) return this;

      const inlineDisplay = el.style.display;
      if (inlineDisplay && inlineDisplay !== "none") {
         n.helper.expando.set(el, "style", { display: inlineDisplay });
         el.style.display = "none";
      } else {
         const currentDisplay = getComputedStyle(el).display;
         if (currentDisplay !== "none") {
            el.style.display = "none";
         }
      }
   });
   return this;
},
show() {
   this.forEach((el) => {
      if (!el || !(el instanceof Element)) return this;
      const data = n.helper.expando.get(el, "style");
      if (data?.display) {
         el.style.display = data.display;
      } else {
         el.style.display = "";
      }
   });
   return this;
},
remove() {
   this.forEach((el) => {
      const anims =
         n.helper.expando.get(el, "animateCache") ||
         el.getAnimations?.() ||
         [];
      anims.forEach((anim) => {
         try {
            anim.cancel();
         } catch { }
      });
      el.remove();
   });
   return this;
},
select(attr) {
   return this.forEach(select => {
      n.helper.expando.set(select, 'attribute', { ...attr, cache: new Map(), lastRequest: null });
   }), this;
},
loader(options) {
   return this.forEach(el => n.loader({ target: el, ...options })), this;
},
stopLoader() {
   this.forEach(el => {
      el.querySelectorAll('.loader').forEach(loader => n(loader).animate({ opacity: [1, 0] }, 500).done(() => loader.remove()));
   })
},
validate(options) { return this.forEach(el => q.validate({ ...options, target: el })), this },

});
n.extend(n,{
layerManager: new class LayerManager {
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
},
face: new function () {
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
},
debounce(fn, delay) {
   let timer = null;
   return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
   };
},
ajax(options = {}) {
   if (!n.helper.isURL(options?.url)) {
      log.error(`[ajax] parameter 'url' accepts only type 'string'`);
      return;
   };
   options = { ...n.ajax?._global_config, ...options };
   // log(options)
   // return
   const method = (options?.method || "GET").toUpperCase();
   const timeout = options?.timeout || 0;
   const cache = options?.cache !== false;
   const result = { dataType: [], cache: cache, response: null, status: null, statusText: null };
   const crossDomain = options.crossDomain || false;
   const responseType = options?.responseType || "";
   const done_cb = n.helper.isFunction(options?.success, [options.success]) || [];
   const fail_cb = n.helper.isFunction(options?.error, [options.error]) || [];
   const always_cb = n.helper.isFunction(options?.always, [options.always]) || [];
   const serializeData = function (data) {
      if (!data) return null;
      // Kalau sudah FormData, jangan diubah
      if (data instanceof FormData) {
         return data;
      }
      if (n.helper.type(data) === "sQ") data = data[0];
      if (data?.constructor?.name === "NodeList") data = data[0];
      if (n.helper.type(data) === "html" && data.nodeName?.toUpperCase() === "FORM") return n(data).serialize();
      if (n.helper.type(data) === "stringJson") data = JSON.parse(data);
      if (n.helper.type(data) === "object") return Object.keys(data).map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(data[k])}`).join("&");
      return data;
   };
   let data = serializeData(options.data);
   const normalizeHeaders = function (headers) {
      const result = {};
      for (let key in headers || {}) {
         result[key.replace(/([a-z])([A-Z])/g, "$1-$2").split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("-")] = headers[key];
      }
      if (method !== 'GET') result["Content-Type"] = result["Content-Type"] || options.contentType || "application/x-www-form-urlencoded; charset=UTF-8";
      return result;
   };
   const headers = normalizeHeaders(typeof options.headers === 'function' ? options.headers() : options.headers || {});
   const request = {
      abort: () => xhr.abort(),
      done(cb) { return done_cb.push(cb), this },
      fail(cb) { return fail_cb.push(cb), this },
      always(cb) { return always_cb.push(cb), this },
      then(onFulfilled, onRejected) { return new Promise((resolve, reject) => { this.done(resolve).fail(reject) }).then(onFulfilled, onRejected) },
   };
   const json_parse = function (strJson) {
      try {
         return JSON.parse(strJson);
      } catch (err) {
         log.error(`[ajax] json_parse error`, err);
      }
   };
   let errorFired = false;
   const fireFail = function (status) {
      if (!errorFired) {
         errorFired = true;
         const res = json_parse(xhr.responseText);
         if (res) {
            if (status) { res.status = status }
            result.status = xhr.status;
            result.statusText = xhr.statusText;
            fail_cb.forEach((cb) => cb.call(result, res));
            always_cb.forEach((cb) => cb.call(result, res));
         }
      }
   };
   if (method === 'GET') {
      const params = [];
      if (data) params.push(data);
      if (!cache) params.push("_=" + Date.now());
      if (params.length) {
         const sep = options.url.includes("?") ? "&" : "?";
         options.url += sep + params.join("&");
      }
   };
   n.helper.isFunction(options?.beforeSend, () => {
      const proceed = options.beforeSend.call(xhr, data);
      if (proceed === false) {
         return { abort: () => xhr.abort(), done: () => this, fail: () => this, always: () => this, then: () => Promise.reject(), };
      }
   });
   n.helper.isFunction(options?.progress, () => xhr.onprogress = event => options.progress(event, xhr));
   n.helper.isFunction(options?.uploadProgress, () => xhr.upload.onprogress = event => options.uploadProgress(event, xhr));
   const xhr = new XMLHttpRequest();
   xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
         if (xhr.status >= 200 && xhr.status < 300) {
            let response = xhr.response;
            const content_type = n.helper.getContentType(xhr.getResponseHeader("Content-Type") || "");

            result.dataType.push(content_type);
            if (content_type === "json") {
               response = json_parse(xhr.responseText);
            }
            result.response = response;
            result.status = xhr.status;
            result.statusText = xhr.statusText;
            done_cb.forEach(cb => cb.call(result, response));
         } else {
            fireFail();
         }
      };
   };
   xhr.onerror = xhr.ontimeout = () => fireFail(xhr.ontimeout && "timeout");
   xhr.open(method, options.url, options.async !== false);
   xhr.timeout = timeout;
   if (crossDomain && "withCredentials" in xhr) xhr.withCredentials = true;
   for (const h in headers) { if (!(data instanceof FormData && h.toLowerCase() === "content-type")) xhr.setRequestHeader(h, headers[h]) };
   try { xhr.responseType = responseType } catch (e) { log.warn("[ajax] Unsupported responseType:", responseType) };
   xhr.send(method === 'GET' ? null : data);
   return request;
},
Date(...args) {
   n.Date.days;
   n.Date.months;
   const OFFSET = 7 * 60 * 60 * 1000; // +7 jam
   const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
   const isLeap = y => (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
   let inputFormat = 'unknown';
   function normalize(y, m, d, h, min, s) {
      while (m > 12) { m -= 12; y++; }
      while (m < 1) { m += 12; y--; }
      let mdays = monthDays.slice();
      if (isLeap(y)) mdays[1] = 29;
      while (d > mdays[m - 1]) { d -= mdays[m - 1]; m++; if (m > 12) { m = 1; y++; if (isLeap(y)) mdays[1] = 29; else mdays[1] = 28; } }
      while (d < 1) { m--; if (m < 1) { m = 12; y--; if (isLeap(y)) mdays[1] = 29; else mdays[1] = 28; } d += mdays[m - 1]; }
      return [y, m, d, h, min, s];
   };

   function detec_str_format(s) {
      // === 3) Format umum: tanggal saja atau tanggal + waktu ===
      // Pola: 3 kelompok angka tanggal + opsional waktu
      const dateTimeMatch = s.match(
         /^(\d{1,4})(\D+)(\d{1,2})(\D+)(\d{1,4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/
      );
      // if (!dateTimeMatch) throw new Error("Format tanggal tidak dikenali");
      if (!dateTimeMatch) return;
      const [, a, sep1, b, sep2, c, h, m, sec] = dateTimeMatch;
      // === 4) Tentukan urutan ===
      let baseFormat = null;

      if (a.length === 4 && b.length <= 2 && c.length <= 2) {
         baseFormat = `YY${sep1}m${sep2}d`;
      } else if (c.length === 4 && a.length <= 2 && b.length <= 2) {
         baseFormat = `d${sep1}m${sep2}YY`;
      } else {
         // throw new Error("Format tanggal tidak dikenali atau tidak didukung");
         return;
      }
      // === 5) Tambahkan waktu jika ada ===
      if (h !== undefined && m !== undefined) {
         if (sec !== undefined) {
            return { d: a, m: b, y: c, h: h || 0, min: m || 0, s: sec || 0, format: `${baseFormat} h:ms:s` };
         } else {
            return { d: a, m: b, y: c, h: h || 0, min: m || 0, s: sec || 0, format: `${baseFormat} h:ms` };
         }
      }
      return {
         d: a, m: b, y: c, h: h || 0, min: m || 0, s: sec || 0, format: baseFormat
      };
   }

   // --- Penambahan parsing argumen ---
   function parseArgs(args) {
      if (args.length === 0) {
         // Tanpa argumen, gunakan waktu sekarang
         inputFormat = 'timestamp';
         return fromTimestamp(Date.now());
      }
      let arg = args[0];
      // Timestamp (number)
      if (args.length === 1 && typeof args[0] === 'number' && !isNaN(arg)) {
         inputFormat = 'timestamp';
         return arg;
      }
      // String: "dd-mm-yyyy" atau "yyyy-mm-dd" atau "dd/mm/yyyy" atau ISO
      if (typeof arg === 'string') {
         // TimeStamp
         if (/^\d{10,13}$/.test(arg)) {
            inputFormat = 'timestamp';
            return Number(arg)
         }
         // Coba ISO
         // Manual ISO parsing (tanpa Date())
         let isoMatch = arg.match(
            /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/
         );
         if (isoMatch) {
            let [, y, m, d, h = 0, min = 0, s = 0] = isoMatch;
            inputFormat = 'iso';
            return normalize(
               Number(y),
               Number(m),
               Number(d),
               Number(h),
               Number(min),
               Number(s)
            );
         };
         const str = detec_str_format(arg);
         if (str) {
            inputFormat = str.format;
            return normalize(Number(str.y), Number(str.m), Number(str.d), Number(str.h), Number(str.min), Number(str.s));
         }
         // Format "dd-mm-yyyy" atau "dd/mm/yyyy"
         // let match = arg.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
         // if (match) {
         //   let [, d, m, y, h = 0, min = 0, s = 0] = match;
         //   y = y.length === 2 ? '20' + y : y;
         //   return normalize(Number(y), Number(m), Number(d), Number(h), Number(min), Number(s));
         // }
         // // Format "yyyy-mm-dd"
         // match = arg.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
         // if (match) {
         //   let [, y, m, d, h = 0, min = 0, s = 0] = match;
         //   return normalize(Number(y), Number(m), Number(d), Number(h), Number(min), Number(s));
         // }
      }

      // Array: [y, m, d, h, min, s]
      if (Array.isArray(arg)) {
         return normalize(
            arg[0] || 1970,
            arg[1] || 1,
            arg[2] || 0,
            arg[3] || 0,
            arg[4] || 0,
            arg[5] || 0
         );
      }
      // Multiple argumen: y, m, d, h, min, s
      if (args.length >= 3) {
         return normalize(
            args[0] || 1970,
            args[1] || 1,
            args[2] || 0,
            args[3] || 0,
            args[4] || 0,
            args[5] || 0
         );
      }
      // Fallback: waktu sekarang
      error = true;
      // return fromTimestamp(Date.now());
   }

   function toTimestamp(y, m, d, h, min, s) {
      let days = 0;
      for (let yr = 1970; yr < y; yr++) days += isLeap(yr) ? 366 : 365;
      const mdays = monthDays.slice(0, m - 1).reduce((a, b) => a + b, 0);
      days += mdays + (d - 1);
      if (isLeap(y) && m > 2) days += 1;
      return days * 24 * 60 * 60 * 1000 + h * 60 * 60 * 1000 + min * 60 * 1000 + s * 1000 - OFFSET;
   }
   function fromTimestamp(ts) {
      ts += OFFSET;
      let days = Math.floor(ts / (24 * 60 * 60 * 1000));
      let rem = ts % (24 * 60 * 60 * 1000);

      let h = Math.floor(rem / (60 * 60 * 1000));
      rem %= 60 * 60 * 1000;
      let min = Math.floor(rem / (60 * 1000));
      rem %= 60 * 1000;
      let s = Math.floor(rem / 1000);

      let year = 1970;
      while (true) {
         const dy = isLeap(year) ? 366 : 365;
         if (days >= dy) { days -= dy; year++ } else break;
      }
      const mdays = monthDays.slice();
      if (isLeap(year)) mdays[1] = 29;
      let month = 0;
      while (days >= mdays[month]) { days -= mdays[month]; month++; }
      let dd = days + 1;
      return { y: year, m: month + 1, d: dd, h, min, s };
   };

   let value = { y: 1970, m: 1, d: 1, h: 0, min: 0, s: 0 };
   let stamp = 0;
   let error = false;

   // --- Gunakan parseArgs baru ---
   try {
      // log(args)
      value = parseArgs(args);
      if (n.helper.type(value, 'array')) {
         stamp = toTimestamp(...value);
      } else if (n.helper.type(value, 'object')) {
         stamp = toTimestamp(value.y, value.m, value.d, value.h, value.min, value.s);
      } else if (n.helper.type(value, 'number')) {
         stamp = value;
      }
      // log(value, args)
      value = fromTimestamp(stamp);
   } catch (e) {
      console.error(`[Date]`, e)
   }

   function updateFromValue() {
      if (error) return;
      [value.y, value.m, value.d, value.h, value.min, value.s] = normalize(value.y, value.m, value.d, value.h, value.min, value.s);
      stamp = toTimestamp(value.y, value.m, value.d, value.h, value.min, value.s);
      value = fromTimestamp(stamp);
   }
   function updateFromStamp() {
      if (error) return;
      value = fromTimestamp(stamp);
   }
   const validate = res => error ? '' : res;

   return {
      [Symbol.toPrimitive]() { return validate(stamp); },
      toString() { return validate(this.getFormat()); },
      valueOf() { return validate(stamp); },
      getDay() {
         let y = value.y, m = value.m, d = value.d;
         if (m < 3) { m += 12; y--; }
         let h = (d + Math.floor((13 * (m + 1)) / 5) + y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400)) % 7;
         return validate((h + 6) % 7);
      },
      getDayName() { return validate(n.Date.days[this.getDay()]); },
      getDate() { return validate(value.d); },
      getMonth() { return validate(value.m); }, // tetap 1-based
      getMonthName() { return validate(n.Date.months[value.m - 1]); },
      getYear() { return validate(value.y); },
      getHours() { return validate(value.h); },
      getMinutes() { return validate(value.min); },
      getSeconds() { return validate(value.s); },
      getFormat(fmt = 'DD, d-M-YY h:ms:s') {
         if (isNaN(stamp) || error) return '';
         const map = {
            'DD': this.getDayName(),
            'D': this.getDay() ? this.getDayName().slice(0, 3) : this.getDayName().slice(0, 4),
            'd': String(this.getDate()).padStart(2, '0'),
            'MM': this.getMonthName(),
            'M': this.getMonthName().slice(0, 3),
            'm': String(this.getMonth()).padStart(2, '0'),
            'YY': String(this.getYear()).padStart(4, '0'),
            'yy': String(this.getYear()).padStart(4, '0'),
            'Y': String(this.getYear()).slice(-2),
            'y': String(this.getYear()).slice(-2),
            'h': String(this.getHours()).padStart(2, '0'),
            'ms': String(this.getMinutes()).padStart(2, '0'),
            's': String(this.getSeconds()).padStart(2, '0'),
         };
         const tokens = Object.keys(map).sort((a, b) => b.length - a.length);
         const regex = new RegExp(tokens.join('|'), 'g');
         return fmt.replace(regex, t => map[t]);
      },
      getInputFormat() { return inputFormat; },
      setDate(val) { value.d = val; updateFromValue(); },
      setMonth(val) { value.m = val; updateFromValue(); },
      setYear(val) { value.y = val; updateFromValue(); },
      setHours(val) { value.h = val; updateFromValue(); },
      setMinutes(val) { value.min = val; updateFromValue(); },
      setSeconds(val) { value.s = val; updateFromValue(); },
      addDays(n) { stamp += n * 24 * 60 * 60 * 1000; updateFromStamp(); },
      addMonths(n) { value.m += n; updateFromValue(); },
      addYears(n) { value.y += n; updateFromValue(); },
      toLocaleString() { return validate(this.toString()); },
      getTime() { return validate(stamp); },
      setTime(ts) { stamp = ts; updateFromStamp(); },
      getAge(x = '') {
         // Ambil tanggal lahir dari instance
         // log(this.toString())
         const now = n.Date();
         let age = now.getYear() - this.getYear();
         const mDiff = now.getMonth() - this.getMonth();
         const dDiff = now.getDate() - this.getDate();
         if (mDiff < 0 || (mDiff === 0 && dDiff < 0)) age--;

         return validate(age + ' ' + x);
      },
      // Mengembalikan objek detail: usia (tahun, bulan, hari), tanggal lahir, timestamp, dan format string.
      getBirthInfo(format = 'DD, d MM yy') {
         const now = n.Date();
         let years = now.getYear() - this.getYear();
         let months = now.getMonth() - this.getMonth();
         let days = now.getDate() - this.getDate();
         if (days < 0) {
            months--;
            days += n.Date(now.getYear(), now.getMonth(), 0).getDate();
         }
         if (months < 0) {
            years--;
            months += 12;
         }
         return {
            age: years,
            years,
            months,
            days,
            date: this.getFormat(format),
            timestamp: this.getTime()
         };
      },
      // ...existing code...
      add(obj = {}) {
         if (obj.years) this.addYears(obj.years);
         if (obj.months) this.addMonths(obj.months);
         if (obj.days) this.addDays(obj.days);
         if (obj.hours) this.setHours(this.getHours() + obj.hours);
         if (obj.minutes) this.setMinutes(this.getMinutes() + obj.minutes);
         if (obj.seconds) this.setSeconds(this.getSeconds() + obj.seconds);
         return this;
      },
      substract(obj = {}) {
         if (obj.years) this.addYears(-obj.years);
         if (obj.months) this.addMonths(-obj.months);
         if (obj.days) this.addDays(-obj.days);
         if (obj.hours) this.setHours(this.getHours() - obj.hours);
         if (obj.minutes) this.setMinutes(this.getMinutes() - obj.minutes);
         if (obj.seconds) this.setSeconds(this.getSeconds() - obj.seconds);
         return this;
      },
      toObject() {
         return {
            year: this.getYear(),
            month: this.getMonth(),
            date: this.getDate(),
            hours: this.getHours(),
            minutes: this.getMinutes(),
            seconds: this.getSeconds(),
            timestamp: this.getTime()
         };
      },
      diff(other, unit = 'days') {
         const t1 = this.getTime();
         const t2 = n.Date(other).getTime();
         const diffMs = t1 - t2;
         if (unit === 'days') return Math.floor(diffMs / (24 * 60 * 60 * 1000));
         if (unit === 'months') {
            return (this.getYear() - n.Date(other).getYear()) * 12 + (this.getMonth() - n.Date(other).getMonth());
         }
         if (unit === 'years') return this.getYear() - n.Date(other).getYear();
         if (unit === 'seconds') return Math.floor(diffMs / 1000);
         if (unit === 'minutes') return Math.floor(diffMs / (60 * 1000));
         if (unit === 'hours') return Math.floor(diffMs / (60 * 60 * 1000));
         return diffMs;
      },
      diffDays(other) {
         return this.diff(other, 'days');
      },
      diffMonths(other) {
         return this.diff(other, 'months');
      },
      diffYears(other) {
         return this.diff(other, 'years');
      },
      getError() { return error },
      // ...existing code...
   };
},
loader(options) {
   // sunQuery,html,string
   options = { ...n.loader._global_config, ...options };
   let target;
   if (n.helper.type(options?.target, 'string')) {
      target = d.querySelector(options?.target);
   } else if (n.helper.type(options?.target, 'html')) {
      target = options?.target;
   } else if (n.helper.type(options?.target, 'sunQuery')) {
      target = options?.target[0];
   } else {
      console.error(`[loader] target '${options?.target}' not found on page`);
      return;
   }
   const id = n.helper.generateUniqueId(5);
   const wrap = n.createElement('div', { class: 'loader', id: id });
   const spin = n.createElement('div', { class: 'spinner' });
   const title = n.createElement('div', { class: 'title', content: options?.title || '' });
   spin.append(title);
   const ind = n.createElement('h2', { text: options?.text || 'loading...' })
   wrap.append(spin, ind);
   n(target).append(wrap);
   n(wrap).css("z-index", n.face.index());
   return wrap;
},
modal(options) {
   const
      attr = {
         title: typeof options?.title === 'string' && options.title,
         bar: null,
      },
      action_close = function (modal, backdrop) {
         n(modal).animate({
            transform: ['translateY(0%)', 'translateY(-5%)'],
            opacity: [1, 0]
         }, 300).done(() => {
            this.release();
            n(backdrop).animate({ opacity: [1, 0] }, 100).done(() => backdrop.remove())
         });
      };
   if (attr.title) {
      attr.bar = n.createElement('div', {
         class: 'overlay-bar',
         html: `<span>${attr.title}</span>`
      })
   };

   n.layerManager.define("modal", {
      source: options?.source,
      overlay: {
         backdrop: true,
         matchWidth: false,
         attached: false,
         content: options?.content
      },
      connected: function (ev) {
         const overlay = ev.context;
         const backdrop = overlay.parentElement;
         if (ev.type === 'init') {
            overlay.classList.add("modal");
            overlay.classList.add(n.helper.normalizeSize(options?.size));
            attr.bar && overlay.insertAdjacentElement('afterbegin', attr.bar);
            backdrop.addEventListener('click', ({ target }) => {
               if (target.matches('.backdrop')) {
                  n(overlay).animate([{ transform: "scale(1)" }, { transform: "scale(1.02)" }, { transform: "scale(0.97)" }, { transform: "scale(1)" }], { duration: 400, easing: "ease-in-out" });
                  return;
               };
               if (target.closest('[dismiss="modal"]')) {
                  action_close.call(this, overlay, backdrop)
               }
            })
         };
         if (ev.type === "escape") {
            action_close.call(this, overlay, backdrop)
         };
      }
   });
},
observer(target, options = {}) {
   target = n.helper.type(target, 'string') ? d.querySelectorAll(target) : n.helper.type(target, 'html') ? [target] : n.helper.type(target, 'sunQuery') ? target.get() : null;

   // log(target, options)
   // return
   target.forEach(el => {
      if (!(el instanceof Element)) return;

      const existing = n.helper.expando.get(el, 'observer');
      if (existing) {
         existing.disconnect();
         n.helper.expando.remove(el, 'observer');
      };
      // Konfigurasi observer
      const config = {
         attributes: !!options.attributes,
         childList: !!options.childList,
         subtree: !!options.subtree,
         attributeOldValue: options.attributes ? true : false
      };
      // Jika attributes berupa array → gunakan attributeFilter
      if (Array.isArray(options.attributes)) {
         config.attributes = true;
         config.attributeFilter = options.attributes;
      };
      // Buat observer baru
      const obs = new MutationObserver(mutations => {
         mutations.forEach(m => {
            const detail = {
               target: m.target,
               type: m.type,
               mutation: m
            };

            // 🔸 Perubahan atribut
            if (m.type === "attributes") {
               detail.attrName = m.attributeName;
               detail.oldValue = m.oldValue;
               detail.newValue = m.target.getAttribute(m.attributeName); // nilai baru
               // n(el).trigger("changeAttr", detail);
               EventBase.trigger(el, "changeAttr", detail);
            }

            // 🔸 Penambahan atau penghapusan elemen
            if (m.type === "childList") {
               if (m.addedNodes.length) {
                  detail.added = Array.from(m.addedNodes).filter(n => n.nodeType === 1);
                  if (detail.added.length) {
                     // n(el).trigger("addElement", detail);
                     EventBase.trigger(el, "addElement", detail);
                  }
               }
               if (m.removedNodes.length) {
                  detail.removed = Array.from(m.removedNodes).filter(n => n.nodeType === 1);
                  if (detail.removed.length) {
                     // n(el).trigger("remElement", detail);
                     EventBase.trigger(el, "remElement", detail);
                  }
               }
            }
         });
      });

      // obs.observe(el, config);
      obs.observe(el, { childList: true, subtree: true, attributes: true });
      n.helper.expando.set(el, 'observer', obs);
   })
},
storage(options) { },
tooltip(options) {
   if (n.helper.type(options?.target, 'string')) {
      // jika target adalah string, maka ambil elemen dengan selector yang sesuai
      options.target = d.querySelector(options?.target);
   } else if (n.helper.type(options?.target, 'html')) {
      options.target = options.target;
   } else if (n.helper.type(options?.target, 'sunQuery')) {
      options.target = options.target[0];
   } else {
      console.error(`[tooltip] target must be a string, html or sunQuery`);
      return;
   };
   if (!options?.content) {
      console.error(`[tooltip] content must be a string, html, stringHtml, url, or sunQuery`);
      return;
   }
   if (options?.identity) {
      if (options.target.parentElement.querySelector('[data-identity="' + options.identity + '"]')) {
         return;
      }
   }
   const identity = options?.identity || '';
   let content = options.content;
   let request;
   const visible = n.helper.getVisibleRect(options.target);
   if (!visible) {
      console.error(`[tooltip] target must be visible`);
      return;
   };

   const tooltip = n.createElement('div', { class: 'tooltip' });
   function onRelease(time = 0) {
      if (time) {
         n(tooltip).animate({ opacity: [1, 0] }, 300).done(() => tooltip.remove());
      } else {
         tooltip.remove();
      }
      if (request) {
         request.abort();
      };
   }

   async function render() {
      if (n.helper.isURL(content)) {
         request = n.ajax({ url: content });
         content = await request;
      };
      if (identity) {
         tooltip.setAttribute('data-identity', identity);
      }
      options.target.insertAdjacentElement('afterend', tooltip);


      if (n.helper.type(content, 'stringHtml')) {
         content = n.helper.toHTML(content);
      }
      if (n.helper.type(content, 'sunQuery')) {
         content = content.get();
      };

      if (n.helper.type(content, 'array')) {
         content.forEach(el => tooltip.append(el));
      } else if (n.helper.type(content, 'string')) {
         tooltip.innerHTML = content;
      } else {
         console.error(`[tooltip] content not supported`);
      };

      const rect = n.helper.getVisibleRect(tooltip);
      tooltip.style.position = 'fixed';
      tooltip.style.left = `${visible.right - rect.width - 5}px`;
      tooltip.style.top = `${visible.y}px`;
      tooltip.style.zIndex = '1';//n.face.index();

      n(tooltip).addClass('pos-top');
      tooltip.style.top = `${visible.y - rect.height - 7}px`;

      await new Promise(res => setTimeout(() => res(), options?.timer || 1000));
      onRelease(300);
   };
   render();
   return {
      release: tm => onRelease(tm),
   };
},
validate(options) {
   const form = options?.target;
   if (!(form instanceof HTMLFormElement)) {
      console.error(`[validator] target harus berupa elemen 'form'`);
      return false;
   };
   function fungsi(ev) {
      ev.preventDefault();
      const isValid = validation.validate_form(form);
      if (!isValid) return false;
      if (typeof options?.submit === 'function') {
         options.submit(ev);
      } else {
         form.submit();
      }
   };
   // event submit
   form.addEventListener('submit', fungsi);
   form.addEventListener('input', ({ target }) => validation.validate_field(target));
   form.addEventListener('change', ({ target }) => validation.validate_field(target));
   form.addEventListener('blur', ({ target }) => validation.validate_field(target));
   return form; // return agar bisa chaining kalau perlu;
},

});
n.ajax.config = function (options) {
if (options?.success || options?.done || options?.fail || options?.error || options?.complete) {
log.warn(`[ajax] GlobalConfig`, `options.success, options.error,  options.complete are deprecated, use options.done, options.fail, options.always, options.done instead`);
}
n.ajax._global_config = options || {};
}
n.Date.days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
n.Date.months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
n.loader.setup = function (config) { n.loader._global_config = config || {}; };
n.storage.save = function (key, obj) {
localStorage.setItem(key, JSON.stringify(obj));
}
n.storage.load = function (key) {
const data = localStorage.getItem(key);
return data ? JSON.parse(data) : null;
}
n.storage.remove = function (key) {
localStorage.removeItem(key);
}
n.storage.clear = function () {
localStorage.clear();
}
n.validate.addMethod = function (name, fn, msg) { validation.methods[name] = { fn, msg } };
n.validate.addMethod('nik', (value) => {
return /^\d*$/.test(value) && (value === '' || value.length === 16);
}, 'Harus 0 atau bilangan 16 digit');
n.validate.addMethod('number', (value) => {
return /^\d+$/.test(value);
}, 'Hanya karakter angka');
n.validate.addMethod('rupiah', (value) => {
return /^[0-9.,]+$/.test(value);
}, 'Hanya boleh berisi karakter numerik dan titik/koma');

n.plugin('form', {
datetime() {
   const input = this;
   const format = function () {
      const fmt = n.Date(input.value).getInputFormat();
      return fmt.toLowerCase() === 'unknown' ? 'timestamp' : fmt;
   }();
   // Tombol trigger & wrapper input
   const wrap = n.createElement('div', { class: 'input' });
   const self = n.createForm('text', { value: n.Date(input.value).getFormat('DD, d MM YY') });
   const btn_triger = n.createElement('span', { class: 'icon', html: `<i class="ph-fill ph-calendar-dots"></i>` });
   input.insertAdjacentElement('beforebegin', wrap);
   wrap.prepend(self, btn_triger, input);
   input.setAttribute('type', 'text');
   if (n.helper.get_attr_element(input, 'readonly')) {
      wrap.setAttribute('readonly', '')
   }
   if (n.helper.get_attr_element(input, 'disabled')) {
      wrap.setAttribute('disabled', '')
   }
   const attr = n.helper.expando.get(input, 'attribute');
   attr?.rule && input.setAttribute('shadow', true);
   input.hidden = true;
   self.placeholder = input.placeholder;
   input.removeAttribute('placeholder');
   if (n.helper.get_attr_element(input, 'readonly')) {
      self.setAttribute('readonly', '')
   }
   if (n.helper.get_attr_element(input, 'disabled')) {
      self.setAttribute('disabled', '')
   };

   const popup_show = function () {
      const date = input.value ? n.Date(input.value) : n.Date();
      const cur = {
         d: date.getDate(),
         m: date.getMonth(),
         y: date.getYear(),
         stam: date.getTime(),
      };
      const now = n.Date(Date.now());

      const btn_prev = n.createElement('span', { class: 'prev', text: '◀' });
      const title_date = n.createElement('span', { class: 'title', text: 'November 2025' });
      const btn_next = n.createElement('span', { class: 'next', text: '▶' });
      const head = n.createElement('div', { class: 'calendar-head', content: n.createElement('div', { content: [btn_prev, title_date, btn_next] }) });
      const body = n.createElement('div', { class: 'calendar-body' });
      const foot = n.createElement('div', {
         class: 'calendar-foot',
         html: `<span class="">${now.getFormat('d M YY')}</span><p>create by: wahyu_widodo</p>`
      });

      const wrap_main = n.createElement('div', { class: 'calendar-wrap' });
      const wrap_month = n.createElement('div', { class: 'calendar-wrap' });
      const wrap_year = n.createElement('div', { class: 'calendar-wrap' });

      let flag = {
         day_pick: true,
         month_pick: null,
         year_pick: null,
      }, context;

      const render_calendar = function (...args) {
         let [y = date.getYear(), m = date.getMonth(), d = date.getDate()] = args;
         const prevMonth = n.Date(y, m, 0);
         const OfMonth = n.Date(y, m + 1, 0);
         const nextMonth = n.Date(y, m, 1);
         const count = (prevMonth.getDay() === 6 ? 0 : prevMonth.getDay() + 1) + OfMonth.getDate() - nextMonth.getDay();
         const show_days = () => {
            wrap_main.innerHTML = '';
            const btn_day = (text, disabled = false, today = false, selected = false) => {
               const el = n.createElement('li', { text })
               if (selected) {
                  n(el).addClass('active')
               }
               if (today) {
                  n(el).addClass('today')
               }
               if (disabled) {
                  n(el).addClass('disabled')
               }
               return el;
            };
            // membuat daftar hari
            const content_week = function () {
               const div_week = n.createElement('ul');
               n.Date.days.forEach(ar => div_week.children.length < 7 && div_week.appendChild(n.createElement("li", { text: ar.slice(0, 3) })));
               wrap_main.append(div_week);
               return div_week;
            }();
            // membuat tanggal bulan
            const content_days = function () {
               const div_days = n.createElement('ul', { class: 'days-content' });
               // tanggal bulan lalu
               for (let i = 0; i <= prevMonth.getDay(); i++) {
                  if (prevMonth.getDay() === 6) break;
                  const text = prevMonth.getDate() - prevMonth.getDay() + i;
                  const el = btn_day(text, true);
                  n(el).addClass('before');
                  div_days.appendChild(el);
               };
               // tanggal bulan ini
               for (let i = 1; i <= OfMonth.getDate(); i++) {
                  let active = false, isToday = false;
                  if (now.getDate() === i && now.getMonth() === m && now.getYear() === y) {
                     isToday = true
                  };
                  if (cur.m === m && cur.d === i && cur.y === y) {
                     active = true;
                  }
                  const el = btn_day(i, false, isToday, active);
                  div_days.appendChild(el)
               };
               // tanggal bulan depan
               for (let i = nextMonth.getDay(); i < (42 - count); i++) {
                  const text = nextMonth.getDate() - nextMonth.getDay() + i;
                  const el = btn_day(text, true);
                  n(el).addClass('after');
                  div_days.appendChild(el);
               };
               wrap_main.append(div_days);
               return div_days;
            }();
            title_date.textContent = OfMonth.getMonthName() + ' ' + OfMonth.getYear();
         };
         const show_month = function () {
            if (!flag.month_pick) return;
            wrap_month.innerHTML = '';
            const div_month = n.createElement('ul', { class: 'month-content' });
            wrap_month.append(n.createElement('ul'), div_month);
            // 
            n.Date.months.forEach((ar, idx) => {
               const el = n.createElement('li', { text: ar, data: { value: (idx + 1) } });
               div_month.appendChild(el);
            });
            title_date.textContent = OfMonth.getYear();
         };
         const show_year = function () {
            if (!flag.year_pick) return;
            wrap_year.innerHTML = '';
            const div_year = n.createElement('ul', { class: 'year-content' });
            wrap_year.append(n.createElement('ul'), div_year);
            for (let i = y - 6; i < y + 6; i++) {
               const el = n.createElement('li', { text: i, data: { value: i } });
               div_year.appendChild(el);
            };
            title_date.textContent = (y - 6) + '-' + (y + 5)
         };

         show_days();
         show_month();
         show_year();

      };
      body.append(wrap_main);
      body.append(wrap_month);
      body.append(wrap_year);
      n(wrap_main).show();
      n(wrap_month).hide();
      n(wrap_year).hide();

      const release = function () {
         n(this).animate({ opacity: [1, 0] }, 250).done(() => {
            head.remove();
            body.remove();
            foot.remove();
            this.release();
            self.focus();
         })
      };
      render_calendar();
      btn_prev.addEventListener('click', function () {
         if (flag.year_pick) {
            date.setYear(date.getYear() - 12);
         } else if (flag.month_pick) {
            date.setYear(date.getYear() - 1);
         } else {
            date.setMonth(date.getMonth() - 1);
         }
         render_calendar();
      });
      btn_next.addEventListener('click', function () {
         if (flag.year_pick) {
            date.setYear(date.getYear() + 12);
         } else if (flag.month_pick) {
            date.setYear(date.getYear() + 1);
         } else {
            date.setMonth(date.getMonth() + 1);
         }
         render_calendar();
      });
      title_date.addEventListener('click', function () {
         if (flag.day_pick) {
            // tampilan Bulan
            flag.month_pick = true;
            flag.day_pick = false;
            n(wrap_main).animate({ transform: ['scale(1)', 'scale(0.8)'] }, 250);
            n(wrap_month).show();
            n(wrap_month).animate({ opacity: [0, 1], transform: ['scale(0.5)', 'scale(1)'] }, 250).done(() => n(wrap_main).hide())
         } else if (flag.month_pick) {
            // tampilkan tahun
            flag.day_pick = false;
            flag.month_pick = false;
            flag.year_pick = true;
            n(wrap_month).animate({ transform: ['scale(1)', 'scale(0.8)'] }, 250);
            n(wrap_year).animate({ opacity: [0, 1], transform: ['scale(0.5)', 'scale(1)'] }, 250).done(() => n(wrap_month).hide())
            n(wrap_year).show();
            n(wrap_main).hide();
         }
         render_calendar();
      });

      body.addEventListener('click', function ({ target }) {
         const date_sel = target.closest('.days-content>li');
         const month_sel = target.closest('.month-content>li');
         const year_sel = target.closest('.year-content>li');
         if (date_sel) {
            if (target.matches('.before')) {
               date.setMonth(date.getMonth() - 1);
            }
            else if (target.matches('.after')) {
               date.setMonth(date.getMonth() + 1);
            };
            date.setDate(parseInt(n(target).text()));
            n(input).val(format === 'timestamp' ? date.getTime() : date.getFormat(format));
            release.call(context);
         };
         // pilih bulan
         if (month_sel) {
            date.setMonth(parseInt(target.getAttribute('data-value')));
            flag.day_pick = true;
            flag.month_pick = false;
            render_calendar();
            n(wrap_month).animate({ transform: ['scale(1)', 'scale(0.8)'], opacity: [1, 0] }, 250);
            n(wrap_main).animate({ opacity: [0, 1], transform: ['scale(0.5)', 'scale(1)'] }, 250).done(() => n(wrap_month).hide());
            n(wrap_main).show();
         }
         // pilih Tahun
         if (year_sel) {
            date.setYear(parseInt(target.getAttribute('data-value')));
            n(wrap_main).hide();
            flag.day_pick = false;
            flag.month_pick = true;
            flag.year_pick = false;

            n(wrap_year).animate({ transform: ['scale(1)', 'scale(0.8)'], opacity: [1, 0] }, 250);
            n(wrap_month).animate({ opacity: [0, 1], transform: ['scale(0.5)', 'scale(1)'] }, 250)
               .done(() => {
                  n(wrap_year).hide();
               })
            n(wrap_month).show();

            render_calendar();
         }
      });
      foot.addEventListener('click', function ({ target }) {
         if (target.matches('span')) {
            n(input).val(format === 'timestamp' ? now.getTime() : now.getFormat(format));
            release.call(context);
         }
      })


      wrap_main.addEventListener('keydown', ev => {
         try {
            const daysContainer = wrap_main.querySelector('.days-content');
            if (!daysContainer) return;
            // include all day items (allow navigating into before/after if present, but skip disabled)
            const all = Array.from(daysContainer.querySelectorAll('li'));
            if (!all.length) return;
            // current index: prefer nav-focus, then active, else 0
            let idx = all.findIndex(li => li.classList.contains('nav-focus'));
            if (idx === -1) idx = all.findIndex(li => li.classList.contains('active')) || all.findIndex(li => li.textContent == flag.last_nav && !li.classList.contains('before') && !li.classList.contains('after')) || 0;

            if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft' || ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
               ev.preventDefault();
               const step = ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowLeft' ? -1 : ev.key === 'ArrowDown' ? 7 : -7;
               idx = Math.max(0, Math.min(all.length - 1, idx + step));
               // update focus marker
               all.forEach(li => li.classList.remove('nav-focus'));
               const item = all[idx];
               item.classList.add('nav-focus');
               item.scrollIntoView({ block: 'nearest' });
               if (item.matches('.after') || item.matches('.before')) {
                  date.setMonth(date.getMonth() + (item.matches('.after') ? 1 : -1));
                  render_calendar();
                  const li = [...wrap_main.querySelectorAll('.days-content li')].filter(li => !li.classList.contains('before') && !li.classList.contains('after'));
                  for (const key of li) {
                     if (key.textContent === item.textContent) {
                        key.classList.add('nav-focus');
                        break;
                     }
                  }
               }
               return;
            }

            if (ev.key === 'Enter') {
               ev.preventDefault();
               const cur = all[idx] || all[0];
               if (!cur) return;
               // behave same as clicking a date: adjust month if before/after, set date, update input and close
               if (cur.matches('.before')) {
                  date.setMonth(date.getMonth() - 1);
               } else if (cur.matches('.after')) {
                  date.setMonth(date.getMonth() + 1);
               }
               date.setDate(parseInt(cur.textContent, 10));
               n(input).val(format === 'timestamp' ? date.getTime() : date.getFormat(format));
               // close popup using release/context as existing code
               release.call(context);
            }
         } catch (err) {
            console.error(err);
         }
      })

      // manager popup
      n.layerManager.define('date', {
         source: wrap,
         causeExit: ['onblur', 'onfocus'],
         overlay: {
            backdrop: false,
            matchWidth: false,
            attached: true,
            content: [head, body, foot],
            offsetY: 10
         },
         connected(ev) {
            context = ev.context;
            if (ev.type === 'init') {
               context.classList.add("input-calendar");
               n(context).animate({ opacity: [0, 1] }, 400);
               // const items = wrap_main.querySelector('.days-content');
               wrap_main.setAttribute('tabindex', 0);
               wrap_main.focus();
               wrap_main.querySelector('.days-content li.active').classList.add('nav-focus')
            };
            if (ev.type !== 'onfocus' && ev.type !== 'init' && !btn_triger.contains(ev.target)) {
               // Hapus elemen kalender dari DOM agar tidak menumpuk
               release.call(this)
            }
         }
      });
   };
   // 
   btn_triger.addEventListener('click', popup_show);
   self.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' || ev.key === 'ArrowDown') {
         ev.preventDefault();
         popup_show();
      }
   });
   input.addEventListener('change', () => self.value = n.Date(input.value).getFormat('DD, d MM yy'));
   self.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "");
      let out = "";
      if (value.length > 0) {
         const val = value.substring(0, 2);
         out = parseInt(val) < 31 ? val : 31;
      }
      if (value.length >= 3) {
         const val = value.substring(2, 4);
         out += parseInt(val) < 12 ? '-' + val : '-' + 12;
      }
      if (value.length >= 5) out += "-" + value.substring(4, 8);
      e.target.value = out;

      const in_value = n.Date(out);
      const error = in_value.getError();
      // log(format, in_value.getError())
      input.value = error ? '' : (format === 'timestamp' ? n.Date(out).getTime() : n.Date(out).getFormat(format));
   });

   self.addEventListener('focus', () => self.value = n.Date(input.value).getFormat('d-m-yy'))
   self.addEventListener('blur', () => self.value = n.Date(input.value).getFormat('DD, d MM yy'));
   const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
         if (mutation.type === 'attributes') {
            if (n.helper.get_attr_element(mutation.target, 'readonly')) {
               input.closest('.input').setAttribute('readonly', '')
            } else {
               input.closest('.input').removeAttribute('readonly')
            }
            if (n.helper.get_attr_element(mutation.target, 'disabled')) {
               input.closest('.input').setAttribute('disabled', '')
            } else {
               input.closest('.input').removeAttribute('disabled')
            }
         }
      }
   });
   observer.observe(input, { attributes: true, attributeFilter: ['readonly', 'disabled'] });
},
number() {
   const input = this;
   const min = isNaN(parseFloat(input.getAttribute('min'))) ? undefined : parseFloat(input.getAttribute('min'));
   const max = isNaN(parseFloat(input.getAttribute('max'))) ? undefined : parseFloat(input.getAttribute('max'));
   const step = parseFloat(input.getAttribute('step') || 1);
   const formatter = n.helper.get_attr_element(input, 'formatter');
   const defaultValue = this.defaultValue;
   const placeholder = input.getAttribute('placeholder');
   const wrap = n.createElement('div', { class: 'input' });
   const self = n.createForm('text', { placeholder: placeholder, value: defaultValue && (formatter ? n.helper.formatNumber(defaultValue, "auto") : defaultValue) });
   const act = n.createElement('span', { class: 'input-number-action', html: `<i class="up ph ph-caret-up"></i><i class="down ph ph-caret-down"></i>` });

   input.insertAdjacentElement('beforebegin', wrap);
   wrap.prepend(self, act, input);
   if (n.helper.get_attr_element(input, 'readonly')) self.setAttribute('readonly', '');
   if (n.helper.get_attr_element(input, 'disabled')) self.setAttribute('disabled', '');
   input.setAttribute('type', 'text');
   input.setAttribute('shadow', true);
   input.hidden = true;
   input.removeAttribute('placeholder');
   input.removeAttribute('step');
   input.removeAttribute('min');
   input.removeAttribute('max');
   input.removeAttribute('formatter');

   Object.defineProperty(input, 'stepUp', {
      value: function StepUp() {
         const raw = dividerValue(this.value, step);
         this.value = raw;
         n(this).trigger('change');
         self.value = sanitizeNumberInput(raw, min, max);
      }
   });
   Object.defineProperty(input, 'stepDown', {
      value: function StepDown() {
         const raw = dividerValue(this.value, -step);
         this.value = raw;
         n(this).trigger('change');
         self.value = sanitizeNumberInput(raw, min, max);
      }
   });
   // piranti

   function dividerValue(value, step) {
      const base = isNaN(parseFloat(value)) ? 0 : parseFloat(value);
      const next = base + step;
      // kembalikan dengan titik sebagai pemisah decimal internal (sanitize akan meng-handle)
      return String(next);
   }

   function formatNumber(num) {
      return n.helper.formatNumber(num, 'auto').toString();
   }

   function sanitizeNumberInput(rawValue, min, max) {
      if (!formatter) {
         let numeric = Number(rawValue);
         if (typeof max !== 'undefined' && numeric > max) return max.toString();
         if (typeof min !== 'undefined' && numeric < min) return min.toString();
         return rawValue;
      }
      // allow temporary states while typing
      if (rawValue === '-' || rawValue === '.' || rawValue === ',' || rawValue === '-,' || rawValue === '-.') return rawValue;

      let cleaned = String(rawValue || '');
      // keep only digits, minus, dot, comma
      cleaned = cleaned.replace(/[^\d\-,.]/g, '');

      // ensure minus only at start
      if ((cleaned.match(/-/g) || []).length > 1 || (cleaned.includes('-') && cleaned.indexOf('-') > 0)) {
         cleaned = cleaned.replace(/-/g, '');
      }

      // normalize decimal separators: decide which char is decimal (last occurring)
      const lastDot = cleaned.lastIndexOf('.');
      const lastComma = cleaned.lastIndexOf(',');
      if (lastDot === -1 && lastComma === -1) {
         // no decimal separators
      } else {
         let decimalChar = null;
         if (lastDot > lastComma) decimalChar = '.';
         else decimalChar = ',';
         // remove all occurrences of the other char, keep decimalChar only for last occurrence
         const other = decimalChar === '.' ? /,/g : /\./g;
         cleaned = cleaned.replace(other, '');
         // if multiple decimalChar, collapse to single (keep last)
         const parts = cleaned.split(decimalChar);
         if (parts.length > 1) {
            const intPart = parts.shift();
            const frac = parts.join('');
            cleaned = intPart + '.' + frac; // use '.' as internal decimal
         } else {
            // single decimalChar -> replace with internal '.'
            cleaned = cleaned.replace(decimalChar, '.');
         }
      }

      // if user typed trailing dot like "12." keep it as "12."
      if (cleaned.endsWith('.')) {
         const intPart = cleaned.slice(0, -1);
         const n = parseFloat(intPart);
         const formattedInt = isNaN(n) ? (intPart || '') : formatNumber(Math.trunc(n));
         return formattedInt + '.';
      }

      // empty or lone minus
      if (cleaned === '' || cleaned === '-') return cleaned;

      const numeric = parseFloat(cleaned);
      if (isNaN(numeric)) return cleaned;

      if (typeof max !== 'undefined' && numeric > max) return formatNumber(max);
      if (typeof min !== 'undefined' && numeric < min) return formatNumber(min);

      return formatNumber(numeric);
   }
   /**
    * hapus karakter '.' dan ubah karakter ',' menjadi '.'
    * @param {*} str 
    * @returns 
    */
   function normalizeNumberString(str) {
      str = String(str || '').replace(/[^\d.,]/g, ''); // buang karakter aneh
      return str.replace(/\./g, '').replace(',', '.');
   }

   self.addEventListener('input', function () {
      const raw = this.value;
      const normal = normalizeNumberString(raw);

      const parts = raw.split(',');
      if (parts.length > 2) {
         // Gabungkan hanya bagian sebelum koma kedua
         input.value = normal.replace(/\,/g, '');
         n(input).trigger('change');
         this.value = parts.slice(0, 2).join(',');
         return
      };
      const hadTrailingComma = raw.endsWith(',');
      const hadTrailingDot = raw.endsWith('.');
      const usedComma = raw.indexOf(',') !== -1;
      let sanitized = sanitizeNumberInput(normal, min, max);

      if (usedComma && !sanitized.includes(',')) {
         const lastDot = sanitized.lastIndexOf('.');
         if (lastDot !== -1) sanitized = sanitized.slice(0, lastDot) + ',' + sanitized.slice(lastDot + 1);
      }
      if (hadTrailingComma && !sanitized.endsWith(',')) sanitized = sanitized + ',';
      if (hadTrailingDot && !sanitized.endsWith('.')) sanitized = sanitized + '.';

      input.value = normalizeNumberString(sanitized);
      n(input).trigger('change');
      this.value = sanitized;
   });
   self.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowUp') {
         ev.preventDefault();
         input.stepUp();
      } else if (ev.key === 'ArrowDown') {
         ev.preventDefault();
         input.stepDown();
      }
   });
   act.addEventListener('click', (ev) => {
      if (ev.target.classList.contains('up')) {
         input.stepUp();
      } else if (ev.target.classList.contains('down')) {
         input.stepDown();
      }
   });
   input.addEventListener('change', () => self.value = input.value && (formatter ? n.helper.formatNumber(input.value, "auto") : input.value));
},
select() {
   const input = this;
   const attr = n.helper.expando.get(input, 'attribute') || { cache: new Map(), lastRequest: null };
   const ajax = n.helper.isURL(attr?.ajax?.url) ? (({ callback, processResults, ...rest }) => ({ config: rest, callback, processResults }))(attr.ajax) : false;
   const params = { limit: ajax?.config?.limit || 20, offset: ajax?.config?.offset || 0, search: '', page: 1, total_pages: 1, state: false };
   // wrapper utama (tampil di UI)
   const self = n.createElement('div', { class: 'input', html: `<i class="ph ph-caret-down"></i>`, tabindex: 0 });
   const container = n.createElement("div", { class: "select-container" });

   attr.placeholder = [...input.options].find(opt => !opt.value?.trim())?.text;
   // helpers

   const buildCacheKey = () => `${params.search}::${params.offset}`;
   const get_input_val = function () {
      const opt = input.options[input.selectedIndex];
      return { value: opt.value, text: opt.text }
   };
   const set_input_val = function (val, text) {
      let opt = Array.from(input.options).find(o => o.value == val.toString());
      if (opt) {
         // jika option ada ,namun text tidak sama maka lakukan upate text pada option select
         ajax && opt.text !== text && (opt.textContent = text)
      } else {
         // jika option belum ada pada select, maka buat option baru
         opt = new Option(text, val);
         opt.selected = true;
         input.add(opt);
      };
      opt.selected = true;
      set_label();
   };
   const set_label = function () {
      let label = self.querySelector('.input-value');
      if (!label) {
         label = n.createElement('div', { class: 'input-value' });
         self.prepend(label);
      }
      const { value, text } = get_input_val();
      label.textContent = text;
   };
   const get_results = async function () {
      const cahce_key = buildCacheKey();
      if (attr.cache.has(cahce_key)) {
         const cached = attr.cache.get(cahce_key);
         // restore pagination meta agar scroll handler bekerja pada hasil cached
         if (cached?.meta) {
            params.total_pages = cached.meta.total_pages || params.total_pages;
            params.page = cached.meta.page || params.page;
         }
         // cached may store either { items, meta } or plain array (backwards compat)
         return cached.items || cached;
      };
      const get_ajax = async function () {
         attr.lastRequest && attr.lastRequest.abort();
         const ajax_config = {
            ...ajax.config, data: {
               ...typeof ajax.config?.data === 'function' ? ajax.config.data() : ajax.config?.data,
               limit: params.limit,
               offset: params.offset,
               search: params.search || ''
            }
         };

         attr.lastRequest = n.ajax(ajax_config);
         try {
            // await new Promise(res => { })
            const response = await new Promise((resolve, reject) => attr.lastRequest.done(resolve).fail(reject));
            let items = [];
            if (ajax.processResults && typeof ajax.processResults === 'function') {
               if (Array.isArray(response?.data)) items = response.data.map(r => ajax.processResults.call(r, r));
               else if (n.helper.type(response?.data, 'object')) items = [ajax.processResults.call(response.data, response.data)];
            } else if (Array.isArray(response?.data)) {
               items = response.data;
            } else if (Array.isArray(response)) {
               items = response;
            };
            params.total_pages = response?.meta?.total || 1;
            params.page = response?.meta?.page || 1;
            // simpan items + meta ke cache agar scroll dapat melanjutkan dari cache
            attr.cache.set(cahce_key, { items, meta: { total_pages: params.total_pages, page: params.page } });
            return items;
         } catch (err) {
            attr.cache.set(cahce_key, { items: [], meta: { total_pages: params.total_pages, page: params.page } });
            console.error(err);
            return [];
         }
      };
      const get_option = async function () {
         // ambil data dari <option> native, filter berdasarkan params.search,
         // terapkan paging (offset/limit), set meta dan simpan ke cache
         try {
            const all = Array.from(input.options)
               .filter(o => o.value !== "")
               .map(o => ({ value: o.value, text: o.textContent }));
            const term = String(params.search || "").trim().toLowerCase();
            const filtered = term
               ? all.filter(o => String(o.text).toLowerCase().includes(term) || String(o.value).toLowerCase().includes(term))
               : all;

            const total = filtered.length;
            params.total_pages = Math.max(1, Math.ceil(total / params.limit));
            params.page = Math.floor(params.offset / params.limit) + 1;

            const items = filtered.slice(params.offset, params.offset + params.limit);

            // simpan ke cache dengan struktur { items, meta }
            attr.cache.set(cahce_key, { items, meta: { total_pages: params.total_pages, page: params.page } });
            return items;
         } catch (err) {
            // fallback: kosong
            attr.cache.set(cahce_key, { items: [], meta: { total_pages: params.total_pages, page: params.page } });
            console.error(err);
            return [];
         }
      };

      if (ajax) {
         return await get_ajax();
      } else {
         return await get_option();
      }
   };
   const makeItem = function (item) {
      const li = n.createElement("li", { data: { value: item.value }, tabindex: 0 });
      if (!params.search) {
         li.innerHTML = item.text;
         return li;
      }
      const t = String(params.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      li.innerHTML = String(item.text).replace(new RegExp(t, 'ig'), (m) => `<mark>${m}</mark>`);
      return li;
   };
   const on_release = function () {
      n(this).animate({ opacity: [1, 0] }, 250).done(() => {
         this.release();
         n(self).css('opacity', '1');
      });
   };
   const popup_show = function () {
      let context = null;
      let activeIndex = -1;
      container.innerHTML = '';
      const box_search = n.createElement('div', { class: 'select-box-search', html: `<i class="ph ph-magnifying-glass"></i>` });
      const box_content = n.createElement('div', { class: 'select-box-content' });
      const input_search = n.createForm('text', { placeholder: attr.placeholder || 'search...' });
      const box_results = n.createElement('div', { class: 'select-results' });
      const box_spinner_scroll = n.createElement('div', { class: 'select-spinner-scroll', html: `<span>loading...</span>` });
      const box_spinner_load = n.createElement('div', { class: 'select-spinner-load', html: `<span>loading...</span>` });
      box_search.append(input_search)
      container.append(box_search, box_content);

      box_content.append(box_results, box_spinner_scroll);
      function highlight_item(li) {
         const cur = get_input_val();
         if (li.getAttribute('data-value') === cur.value && li.textContent.trim() === cur.text.trim()) {
            return li;
         }
         return null;
      };

      function select_handler(ev) {
         const li = ev.target.closest('li:not(.empty)');
         if (!li) return;
         set_input_val(li.getAttribute("data-value"), li.textContent);
         on_release.call(context);
         n(input).trigger("change");
         self.focus();
      };
      async function scroll_handler(ev) {
         if (box_results.scrollTop + box_results.clientHeight >= box_results.scrollHeight && params.page < params.total_pages && !params.state) {
            params.offset += params.limit;
            n(box_spinner_scroll).show();
            await render(false);
            n(box_spinner_scroll).animate({ opacity: [1, 0] }, 300).done(function () {
               this.hide()

            });
         }
      };
      const searchHandler = n.debounce(() => {
         params.search = input_search.value.trim();
         render(true);
      }, 500);
      function marking_item(dir = 0) {
         const items = Array.from(box_results.querySelectorAll('li:not(.empty)'));
         if (!items.length) return;
         if (dir === 1) {
            activeIndex = Math.min(activeIndex + 1, items.length - 1);
            if (items[activeIndex].matches('.selected')) {
               activeIndex += 1;
            }
         } else if (dir === -1) {
            activeIndex = Math.max(activeIndex - 1, 0);
            if (items[activeIndex].matches('.selected')) {
               activeIndex -= 1;
            }
         } else if (dir === 0) activeIndex = 0;
         items.forEach((it, i) => it.classList.toggle('active', i === activeIndex));
         const current = items[activeIndex];
         if (current) current.scrollIntoView({ block: 'nearest' });
      };
      function key_handler(ev) {
         const key = ev.key;
         // Deteksi karakter yang bisa diketik (huruf, angka, simbol)
         const tag = ev.target.tagName.toLowerCase();
         if (tag === 'input' && ev.target === input_search) {
            const isPrintable = key === 'Backspace' || (key.length === 1 && !ev.ctrlKey && !ev.metaKey && !ev.altKey);
            if (isPrintable) {
               searchHandler();
            } else {
               if (key === 'ArrowDown') {
                  ev.preventDefault();
                  marking_item(1);
               } else if (key === 'ArrowUp') {
                  ev.preventDefault();
                  marking_item(-1);
               } else if (key === 'Enter') {
                  ev.preventDefault();
                  const cur = box_results.querySelector('li.active') || box_results.querySelector('li:not(.empty)');
                  select_handler({ target: cur });
               }
            }
         }
      };

      function clean_up() {
         box_results.removeEventListener('click', select_handler);
         box_results.removeEventListener('scroll', scroll_handler);
         d.removeEventListener('keydown', key_handler);
      };
      async function render(reset = true) {
         if (reset) {
            params.offset = 0;
            box_results.innerHTML = '';
            activeIndex = -1;
            box_results.append(box_spinner_load)
         };
         params.state = true;
         n(input_search).attr('disabled', true);
         const results = await get_results();
         if (reset) box_spinner_load.remove();
         n(input_search).removeAttr('disabled');
         input_search.focus();
         params.state = false;
         if (!results || results.length === 0) {
            if (reset) box_results.innerHTML = `<li class="empty">no results found</li>`;
            return;
         }
         if (!results || results.length === 0) return;
         for (const key of results) {
            const li = makeItem(key);
            if (highlight_item(li)) li.classList.add('selected');
            box_results.appendChild(li);
         };
         return results;
      };
      // event-listener
      box_results.addEventListener('click', select_handler);
      box_results.addEventListener('scroll', scroll_handler);
      container.addEventListener('afterRemove', clean_up);
      d.addEventListener('keydown', key_handler);
      // manager layer
      n.layerManager.define("select2", {
         source: self,
         causeExit: ["onblur", "onfocus"],
         overlay: {
            backdrop: false,
            matchWidth: true,
            attached: true,
            content: container,
            offsetY: -35,
         },
         connected: async function (ev) {
            const target = ev.target;
            if (ev.type === "init") {
               context = ev.context;
               n(context).animate({ opacity: [0, 1] }, 400);
               params.search = '';
               params.limit = ajax?.config?.limit || 20;
               params.offset = ajax?.config?.offset || 0;
               params.page = 1;
               params.total_pages = 1;
               params.state = false;
               n(box_spinner_scroll).hide();
               n(self).css('opacity', '0');
               await render();
               const items = box_results.querySelectorAll(`li`);
               for (const item of items) {
                  if (highlight_item(item)) item.scrollIntoView();
               };
            } else if (ev.type === "click" || ev.type === "escape") {
               on_release.call(this);
               self.focus();
            } else if (ev.type === 'onblur') {
               if (!self.contains(target)) on_release.call(this);
            } else if (ev.type == "onfocus") {
               // 
            }
         }
      });
   };

   // Initialize
   input.insertAdjacentElement('beforebegin', self);
   self.append(input);
   if (n.helper.get_attr_element(input, 'readonly')) self.setAttribute('readonly', '')
   if (n.helper.get_attr_element(input, 'disabled')) self.setAttribute('disabled', '')
   input.setAttribute('shadow', true);
   input.hidden = true;
   set_label();

   input.addEventListener('change', async ev => {
      // log('SELECT CHANGE', ev?.detail?.value);

      if (ev?.detail?.value) {
         if (ajax) {
            if (!typeof ajax?.callback === 'function') return;
            if (typeof ajax?.processResults === 'function') {
               const filt_asg = ajax.callback({ term: ev.detail.value });
               const ajax_config = {
                  ...ajax.config,
                  data: filt_asg,
               };
               delete ajax_config.callback;
               delete ajax_config.processResults;
               n.ajax(ajax_config).done(res => {
                  let data;
                  if (n.helper.type(res?.data, 'array')) {
                     for (const key of res.data) data = ajax.processResults.call(key, key);
                  } else if (n.helper.type(res?.data, 'object')) {
                     data = ajax.processResults.call(res?.data, res?.data)
                  };
                  if (data) set_input_val(data.value, data.text);
               }).fail(err => {
                  console.error(err)
               })
            }
         } else {
            set_input_val(ev.detail.value);
         }
      };
   });
   self.addEventListener('click', () => popup_show());
   self.addEventListener('keydown', (ev) => (ev.key === 'Enter' || ev.key === 'ArrowDown') && popup_show());
   const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
         if (mutation.type === 'attributes') {
            if (n.helper.get_attr_element(mutation.target, 'readonly')) {
               self.setAttribute('readonly', '')
            } else {
               self.removeAttribute('readonly')
            }
            if (n.helper.get_attr_element(mutation.target, 'disabled')) {
               self.setAttribute('disabled', '')
            } else {
               self.removeAttribute('disabled')
            }
         }
      }
   });
   observer.observe(input, { attributes: true, attributeFilter: ['readonly', 'disabled'] });
},

});
// method-export
n.ready(async () => {
         await new Promise(resolve => setTimeout(resolve, 0));
         const cfg = inter.config;
         (function replayAll() {
            const list = cfg._deferred.deferredInstancesList || [];
            // ambil antrean statis (jika ada)
            const staticQ = cfg._deferred.deferredStaticQueue || [];
            let instIndex = 0;
            const MAX_CALLS = cfg?.maxDeferredCallsPerTick || 200;
            function processChunk() {
               let calls = 0;
               // proses antrean statis terlebih dahulu (sementara batched bersama limit MAX_CALLS)
               while (staticQ.length && calls < MAX_CALLS) {
                  const entry = staticQ.shift();
                  try {
                     const ctx = entry.receiver || n;
                     const fn = ctx[entry.prop] || n[entry.prop];
                     if (typeof fn === "function") fn.apply(ctx, entry.args);
                  } catch (err) {
                     log.warn(`[deferred-static] error executing '${entry.prop}'`, err);
                  }
                  calls++;
               }
               while (instIndex < list.length && calls < MAX_CALLS) {
                  const inst = list[instIndex];
                  const q = inst._deferredQueue || [];
                  while (q.length && calls < MAX_CALLS) {
                     const entry = q.shift();
                     const ctx = entry.receiver || inst;
                     try {
                        const fn = ctx[entry.prop];
                        if (typeof fn === "function") fn.apply(ctx, entry.args);
                     } catch (err) {
                        log.warn(`[deferred] error executing '${entry.prop}'`, err);
                     }
                     calls++;
                  }
                  if ((inst._deferredQueue || []).length === 0) {
                     // clear flag agar instance bisa di-gc/atau direuse
                     inst._deferredEnqueued = false;
                     inst._deferredQueue = [];
                     instIndex++;
                  }
               }
               const hasMore = instIndex < list.length || staticQ.length > 0;
               if (hasMore) {
                  (window.requestIdleCallback || function (cb) { setTimeout(cb, 16); })(processChunk);
               } else {
                  cfg._deferred.deferredInstancesList = [];
                  // clear static queue container (safety)
                  cfg._deferred.deferredStaticQueue = [];
               }
            }
            processChunk();
         })();
      });
      if (!global.q && !global.sunQuery) global.q = global.sunQuery = n;
      return n;
   });

