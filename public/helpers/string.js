// @method-helper
function toCamelCase(str) {/*ubah "contoh-nama menjadi contohNama*/return str.replace(/-([a-z])/g, (_, char) => char.toUpperCase()) };

function toKebabCase(str) { return str.replace(/([A-Z])/g, "-$1").toLowerCase() };

function toSnakeCase(str) { return str.toLowerCase().trim().replace(/\s+/g, "_") };
function toCapitalize(str) {
   return str
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());
};
function getInitials(name, pos = 2) {
   if (typeof name !== "string") return "";
   return name.trim().split(/\s+/).map(word => word[0].toUpperCase()).slice(0, pos).join("");
};

const findElementSelector = new function () {
   this.node = (el) => (el?.nodeType ? el.localName || el.nodeName : null);
   this.id = (el) => (el?.nodeType && el.id ? "#" + el.id : "");
   this.class = (el) => el?.nodeType && el.className ? "." + el.className.trim().replace(/\s+/g, ".") : "";
   this.name = (el) => (el?.nodeType ? el.localName || el.nodeName : "");
   this.list = function (el) { return this.name(el) + this.id(el) + this.class(el) }
};