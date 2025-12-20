!(function (a) {
   try {
      if (!window.sunQuery) throw new Error(`library 'sunQuery.js' belum terpasang`);
      return a(q);
   } catch (error) {
      console.warn(error);
   }
})(async function (n) {
   const log = console.log;
   const d = document;
   const attach = function (target, source) {
      if (!(target instanceof Element)) {
         throw new Error("[attach] 'target' must be a valid DOM element.");
      };
      // if (source instanceof ) {
      if (source?.constructor?.name === 'Dispatcher') {
         if (typeof source?.getContent === 'function') {
            source = source.getContent();
         } else {
            throw new Error(`[attach] method 'getContent' not found on 'source' by 'Dispatcher'`);
         }
      }
      // }
      if (n.helper.type(source, 'object')) {
         if (typeof source?.toArray === 'function') {
            source = source.toArray();
         } else {
            throw new Error(`[attach] method 'toArray' not found on 'source'`);
         }
      }

      if (n.helper.type(source, 'stringHtml')) {
         source = n.helper.toHTML(source);
      }
      if (n.helper.type(source, 'array')) {
         target.append(...source);
         return true;
      }
      if (source instanceof Element) {
         target.append(source);
         return true;
      }
      if (n.helper.type(source, 'string')) {
         target.textContent = source;
         return true;
      }
      return false;
   };
   const buildURL = function (...paths) {
      const url = new URL(n.app.host);
      url.pathname = [url.pathname, ...paths].join('/').replace(/\/+/g, '/');
      return url.toString();
   };

   // @method-global

   const app = new Kernel({
      host: 'http://localhost/',
      defaultRouter: 'dashboard'
   });
   n.extend(n, {
      app: app
   });
   // @extended
});