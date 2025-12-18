// @method-instance

function on(event, handler) {
   if (typeof event === "string" && typeof handler === "function") {
      this.forEach((el) => {
         el.addEventListener(event, handler);
      });
   }
   return this;
};
function trigger(event, data) {
   this.forEach((el) => EventBase.trigger(el, event, data));
   return this;
};
function animate(keyframes, options, callback) {
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
};
function done(callback) {
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
};
function pause() {
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
};
function resume() {
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
};
function stop() {
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
};
function addClass(cls) {
   if (typeof cls === "string" && cls.trim()) {
      const classes = cls.trim().replace(/^[.]*/g, "").split(/\s+/);
      return this.forEach(
         (el) => el.classList && el.classList.add(...classes)
      );
   }
   return this;
};
function toggleClass(A) {
   /*Menambahkan jika belum ada, menghapus jika sudah ada.*/
   return (
      "string" === typeof A && A
         ? this.forEach((B) => B.classList.toggle(A))
         : void 0,
      this
   );
};
function removeClass(A) {
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
};
function replaceClass(oldClass, newClass) {
   if (typeof oldClass === "string" && typeof newClass === "string") {
      this.forEach((el) => {
         el.classList.remove(...oldClass.trim().split(/\s+/));
         el.classList.add(...newClass.trim().split(/\s+/));
      });
   }
   this;
   return this;
};
function hasClass(nameClass) {
   /*Mengecek apakah elemen pertama punya class tertentu.*/
   if (nameClass === "" || typeof nameClass !== "string") return false;
   return this[0].matches("." + nameClass.replace(/^\./, ""));
};
function closest(selector) {
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
};
function next(selector) {
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
};
function prev(selector) {
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
};
function siblings(selector) {
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
};
function children(selector) {
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
};
function parent(selector) {
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
};
function serialize() {
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
};
function css(prop, value) {
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
};
function val(value, text = '') {
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
};
function text(value) {
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
};
function attr(name, value) {
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
};
function prop(name, value) {
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
};
function append(node, position = "beforeend") {
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
};
function get(index) {
   if (index === undefined) {
      return [...this];
   }
   if (index < 0) {
      return this[this.length + index];
   }
   return this.length - 1 < index ? null : this[index];
};
function find(selector) {
   /*Mencari elemen di dalam elemen lain (seperti querySelectorAll).*/
   if (typeof selector !== "string" || selector === "") return this;
   let result = [];
   for (let i = 0; i < this.length; i++) {
      const found = this[i].querySelectorAll(selector);
      if (found.length) result.push(...found);
   }
   return this.pushStack(result);
};
function appendTo(target) {
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
};
function match(selector) {
   const el = this[0];
   if (!el || el.nodeType !== 1) return false;
   return el.matches(selector);
};
function removeAttr(attrName) {
   if (typeof attrName !== "string") return this;

   const attrs = attrName.trim().split(/\s+/); // bisa "title" atau "title aria-label"
   this.forEach((el) => {
      attrs.forEach((attr) => el.removeAttribute(attr));
   });

   return this;
};
function hide() {
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
};
function show() {
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
};
function remove() {
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
};


function load(url, options) {
   if (!url) return this;
   // Pisahkan URL dan selector fragment
   let [requestUrl, selector] = url.split(/\s+(.*)/s);
   const target = this;
   q.ajax({
      url: requestUrl,
      method: options?.data ? 'POST' : 'GET',
      data: options?.data || {},
      success: function (res) {
         let html = res;

         // Jalankan callback sebelum render
         if (typeof options?.onResults === 'function') {
            html = options.onResults(html) || html;
         };

         if (q.helper.type(html, "stringHtml")) {
            html = q.helper.toHTML(html);
         }

         if (selector) {
            const tmp = document.createElement('div');
            if (n.helper.type(html, "array")) {
               tmp.append(...html);
            } else if (typeof html === "string") {
               tmp.innerHTML = html;
            }
            html = tmp.querySelectorAll(selector);
         }

         // Render ke elemen target
         target.forEach(el => {
            el.innerHTML = '';
            if (selector) {
               html.forEach(node => el.append(node.cloneNode(true)));
            } else {
               if (n.helper.type(html, "array")) {
                  el.append(...html);
               } else if (typeof html === "string") {
                  el.innerHTML = html;
               }
            }
         });

         if (typeof options?.status === 'function') options.status({
            status: this.status,
            statusText: this.statusText
         });
      },
      error: function (err) {
         if (typeof options?.status === 'function') options.status(err);
      }
   });

   return this;
};


