const View = function () {
   this.version = '1.0.0';
   const views = {};
   const layout = {
      head: null,
      main: null,
      foot: null
   };
   n.ready(() => {
      layout.head = d.querySelector('header');
      layout.main = d.querySelector('main');
      layout.foot = d.querySelector('footer');
      Object.defineProperty(layout.head, 'update', { value: function (element) { this.innerHTML = '', attach(this, element) } });
      Object.defineProperty(layout.main, 'update', {
         value: function (element) {
            this.innerHTML = '', attach(this, element)
         }
      });
      Object.defineProperty(layout.foot, 'update', { value: function (element) { this.innerHTML = '', attach(this, element) } });
   });


   this.define = function (pageView) {
      if (typeof pageView !== 'object') {
         throw new Error("[View] define 'pageView' must be a 'object'");
      };
      for (const key in pageView) {
         views[key] = pageView[key];
      };
   }

   n.addEventListener('routes', async (uri) => {
      uri.controller_name = uri.controller_name.replace(/^\/|\/$/g, "");//hilangkan '/' awal dan akhir;
      uri.controller_name = uri.controller_name || app.utils.defaultRouter || 'web';

      if (typeof views[uri.controller_name] !== 'function') {
         throw new Error(`[View] Controller '${uri.controller_name}' not found!`);
      };

      uri.host = app.host;
      const page = await views[uri.controller_name](uri);
      layout.main.update(page);
      if (page?.constructor?.name === 'Dispatcher') {
         page.mount.call(layout.main, uri);
      }
   });
};

View.dispatch = function (src, events) {
   // 
   return new class Dispatcher {
      constructor(src, events) {
         this.mount = events?.mount || function () { };
         this.getContent = function () {
            return src;
         }
      }
   }(src, events);
};

