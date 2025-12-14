// @method-helper
function generateUniqueId(length = 5) {
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
};

const expando = new function ElementExpando() {
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
}

function merge(target, source) {
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
}
function findScrollParent(el) {
   while (el && el !== document.body) {
      const style = getComputedStyle(el);
      if (/(auto|scroll)/.test(style.overflowY)) return el;
      el = el.parentElement;
   }
   return document.body;
};

function toHTML(stringHtml) {
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
};

function getVisibleRect(el) {
   if (!(el instanceof Element)) return false;

   const rect = el.getBoundingClientRect();
   const inViewport =
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
      rect.left < (window.innerWidth || document.documentElement.clientWidth);

   if (!inViewport) return false;

   return rect;
};