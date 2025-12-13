// @method-static
function storage(options) { };
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