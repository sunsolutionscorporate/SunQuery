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
      //@method-export
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

