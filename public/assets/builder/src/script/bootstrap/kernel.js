



function Kernel(options) {
   if (!options?.host) {
      throw new Error("[Kernel] Host not defined");
   };
   options.host = options?.host?.replace(/^\/|\/$/g, "") + "/";//hilangkan '/' awal dan akhir
   this.version = '1.0.0';
   this.UI = new UI();
   this.Modal = new Modal();
   this.contextMenu = (new ContextMenu()).define;
   this.host = options.host;
   const router = new View();
   const instance = this;

   instance.utils = { src: null, api_url: options?.api };

   //////////////////////////////////
   ////////// PRIVATE METHOD ////////
   //////////////////////////////////

   q.config({ observer: true, formCostum: true, router: true, platform: true, ...options });
   n.ready(async function () {
      // render background canvas
      Kernel.background();
      // 
      instance.utils = { ...await n.getConfig(), ...instance.utils };

      document.addEventListener("click", function (ev) {
         const target = ev.target;
         if (target.closest('.item')) {

            const ripple = document.createElement("div");
            ripple.className = "cursor-ripple";
            ripple.style.left = `${ev.clientX - 10}px`;
            ripple.style.top = `${ev.clientY - 10}px`;
            ripple.style.width = "20px";
            ripple.style.height = "20px";

            document.body.appendChild(ripple);

            // Hapus setelah animasi selesai
            ripple.addEventListener("animationend", () => {
               ripple.remove();
            });
         }
      });

      // method untuk membuat auto focus pada form
      const fieldMap = new WeakMap();
      const EVENTS = ['focus', 'input', 'blur', 'change'];
      function attachForm(group) {
         group.querySelectorAll('input, textarea, select').forEach(field => {
            if (fieldMap.has(field)) return;

            if (field.value) {
               n(field).closest('.form-input').addClass('focused')
            } else {
               n(field).closest('.form-input').removeClass('focused')
            }
            const handlers = {
               focus: e => n(field).closest('.form-input').addClass('focused'),
               input: e => n(field).closest('.form-input').addClass('focused'),
               blur: e => !field.value && n(field).closest('.form-input').removeClass('focused'),
               change: e => {
                  if (field.value) {
                     n(field).closest('.form-input').addClass('focused')
                  } else {
                     n(field).closest('.form-input').removeClass('focused')
                  }
               }
            };

            EVENTS.forEach(ev =>
               field.addEventListener(ev, handlers[ev], ev === 'focus')
            );

            fieldMap.set(field, handlers);
         });
      };
      function detachForm(group) {
         group.querySelectorAll('input, textarea, select').forEach(field => {
            const handlers = fieldMap.get(field);
            if (!handlers) return;

            EVENTS.forEach(ev =>
               field.removeEventListener(ev, handlers[ev], ev === 'focus')
            );

            fieldMap.delete(field);
         });
      };
      observer('.form-input.vertical', {
         onAdd: attachForm,
         onRemove: detachForm
      });
      observer('.form-group.vertical', {
         onAdd: el => {
            const labels = el.querySelectorAll('label');
            let max = 0;
            labels.forEach(l => {
               l.style.width = "auto";   // reset dulu
               max = Math.max(max, l.offsetWidth);
            });
            // log('max', max)
            labels.forEach(l => {
               l.style.minWidth = max + "px";
               l.style.width = max + "px";
            });
         },
         // onRemove: detachForm
      });
   });

   //////////////////////////////////
   ////////// PUBLIC METHOD /////////
   //////////////////////////////////
   this.request = async function (url, options) {
      url = url.replace(/^\/|\/$/g, "");//hilangkan '/' awal dan akhir
      url = this.utils.host + '/' + url;
      try {
         return await n.ajax({ url: url, ...options });
      } catch (error) {
         console.error(`Request Error: "${url}"`, error);
      }
   };

   this.view = function (view) {
      router.define(view);
   };
};