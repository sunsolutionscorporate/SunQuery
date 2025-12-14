// @method-helper
function isJson(str) {
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
};

function isClass(value) {
   if (
      typeof value === "function" &&
      /^class\s/.test(Function.prototype.toString.call(value))
   )
      return true;
   return false;
};


function isURL(url) {
   return "undefined" != typeof url && typeof url === "string"
      ? url.match(
         /^(http:\/\/|https:\/\/|www\.|localhost)|(.html|.php|.com|.json|.xml\b)/
      )
         ? !0
         : !1
      : !1;
};

function get_attr_element(el, attr) {
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
};

function isFormElement(el) {
   return (
      el instanceof HTMLInputElement ||
      el instanceof HTMLSelectElement ||
      el instanceof HTMLTextAreaElement
   );
};

function getContentType(contentType) {
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
};


function isFunction(scr, fn) {
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
};