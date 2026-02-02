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
      // log(source)
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


   //////////////////////////////////////////
   ////////// KODE BLOK UI ////////////////
   //////////////////////////////////////////
const Modal = function () { }

Modal.prototype = {
   // 
   resident_view: function () {

      return `<form class="paper">
                     <div class="form-input vertical">
                        <label for="nik">NIK</label>
                        <div class="input-group">
                           <input type="text" value="1802262403910001" name="nik" id="nik" />
                        </div>
                     </div>
                     <div class="form-input vertical">
                        <label for="nama">Nama Lengkap</label>
                        <div class="input-group">
                           <input type="text" value="SUGENG WAHYU WIDODO" name="nama" id="nama" />
                        </div>
                     </div>
                     <div class="form-group">
                        <div class="form-input vertical">
                           <label for="email">Tempat lahir</label>
                           <div class="input-group">
                              <input type="text" value="LABUHAN MARINGGAI" name="email" id="email" />
                           </div>
                        </div>
                        <div class="form-input vertical">
                           <label for="email">Tanggal lahir</label>
                           <div class="input-group">
                              <input type="text" value="24-03-1991" name="email" id="email" />
                           </div>
                        </div>
                     </div>
                     <div class="form-group">
                        <div class="form-input vertical">
                           <label for="email">Jenis Kelamin</label>
                           <div class="input-group">
                              <input type="text" value="" name="email" id="email" />
                           </div>
                        </div>
                        <div class="form-input vertical">
                           <label for="email">Agama</label>
                           <div class="input-group">
                              <input type="text" value="" name="email" id="email" />
                           </div>
                        </div>
                     </div>
                     <div class="form-group">
                        <div class="form-input vertical">
                           <label for="email">Pendidikan terakhir</label>
                           <div class="input-group">
                              <input type="text" value="" name="email" id="email" />
                           </div>
                        </div>
                        <div class="form-input vertical">
                           <label for="email">Status perkawinan</label>
                           <div class="input-group">
                              <input type="text" value="" name="email" id="email" />
                           </div>
                        </div>
                     </div>
                     <div class="form-input vertical">
                        <label for="nama">Pekerjaan</label>
                        <div class="input-group">
                           <input type="text" value="" name="nama" id="nama" />
                        </div>
                     </div>
                     <div class="form-input vertical">
                        <label for="nama">Alamat</label>
                        <div class="input-group">
                           <input type="text" value="" name="nama" id="nama" />
                        </div>
                     </div>
                     <div class="form-group">
                        <div class="form-input vertical">
                           <label for="email">Dusun</label>
                           <div class="input-group">
                              <input type="text" value="" name="email" id="email" />
                           </div>
                        </div>
                        <div class="form-input vertical">
                           <label for="email">RT</label>
                           <div class="input-group">
                              <input type="text" value="" name="email" id="email" />
                           </div>
                        </div>
                        <div class="form-input vertical">
                           <label for="email">RW</label>
                           <div class="input-group">
                              <input type="text" value="" name="email" id="email" />
                           </div>
                        </div>
                     </div>
                     <div class="action-group">
                        <button type="button" class="btn btn-danger"><i class="ph ph-x"></i> Batal</button>
                        <button type="button" class="btn btn-primary"><i class="ph ph-check"></i> Simpan</button>
                     </div>
              </form>`;
   },
   map: new function MapEditable() {
      const instance = this;

      this.popup = new function () {
         this.bidang = function (feature) {

            return `
            <div class="bind-popup-bidang">
               <table>
                  <tr>
                     <td>NOP</td><td>${feature.properties.nop}</td>
                  </tr>
                  <tr>
                     <td>Pemilik</td><td>${feature.properties.pemilik}</td>
                  </tr>
                  <tr>
                     <td>SHM</td><td>${feature.properties.shm}</td>
                  </tr>
               </table>
               <div class="action-group">
                  <button class="btn-icon btn-danger" >
                     <i class="ph ph-x"></i>
                  </button>
                  <button class="btn-icon btn-primary" >
                     <i class="ph ph-pencil"></i>
                  </button>
               </div>
            </div>`;
         };
         this.marker = function (feature) {

            return `
            <div class="bind-popup-marker">
               <table>
                  <tr>
                     <td colspan="2">${feature.properties.nama}</td>
                  </tr>
                  <tr>
                     <td>Jenis</td><td>${feature.properties.jenis}</td>
                  </tr>
               </table>
               <div class="action-group">
                  <button class="btn-icon btn-danger" >
                     <i class="ph ph-x"></i>
                  </button>
                  <button class="btn-icon btn-primary" >
                     <i class="ph ph-pencil"></i>
                  </button>
               </div>
            </div>`;
         };
      };

      this.form = new function () {
         this.bidang = function (options) {
            const form = n.createElement('form', {
               class: 'paper',
               html: `
                     <div class="form-input vertical">
                        <label for="pemilik">Pemilik</label>
                        <div class="input-group">
                           <input type="text" value="" name="pemilik" id="pemilik" />
                        </div>
                     </div>
                     <div class="form-group">
                        <div class="form-input vertical">
                           <label for="shm">Nomor Surat/SHM</label>
                           <div class="input-group">
                              <input type="text" value="" name="shm" id="shm" />
                           </div>
                        </div>
                        <div class="form-input vertical">
                           <label for="nop">NOP</label>
                           <div class="input-group">
                              <input type="text" value="" name="nop" id="nop" />
                           </div>
                        </div>
                     </div>
                    
                     <div class="action-group">
                        <button type="button" dismiss="modal" class="btn btn-danger"><i class="ph ph-x"></i> Batal</button>
                        <button type="submit" class="btn btn-primary"><i class="ph ph-check"></i> Simpan</button>
                     </div>
            `
            });

            n(form).on('submit', function (ev) {
               ev.preventDefault()
               const pemilik = this.elements['pemilik'].value;
               const shm = this.elements['shm'].value;
               const nop = this.elements['nop'].value;

               options.layer.feature = {
                  type: 'Feature',
                  properties: {
                     pemilik: pemilik,
                     shm: shm,
                     nop: nop
                  }
               };

               options.layer.bindPopup(instance.popup.bidang(options.layer.feature));

               options.draw.addLayer(options.layer);
               // log("GeoJSON:", JSON.stringify(options.editableLayers.toGeoJSON()));
               log("GeoJSON:", options.editableLayers.toGeoJSON().features[0].geometry.coordinates);
               form.querySelector('button[dismiss="modal"]').click();
            });

            return form;
         };
      };


   },
};
const UI = function () {

};

UI.prototype.component = new function () {
   this.section = function () {
      const section = n.createElement('section');

      Object.defineProperty(section, 'addHead', {
         value: function (element) {
            let head = this.querySelector('.head');
            if (!head) {
               head = n.createElement('div', { class: 'head' });
               this.append(head);
               attach(head, element);
            }
            return this;
         }
      });

      Object.defineProperty(section, 'addContent', {
         value: function (element) {
            let body = this.querySelector('.body');
            if (!body) {
               body = n.createElement('div', { class: 'body' });
               this.append(body);
            };
            attach(body, element);
            return this;
         }
      });

      Object.defineProperty(section, 'toArray', {
         value: function () {
            return [this];
         }
      });

      return section;
   };
   this.card = function () {
      const card = n.createElement('div', { class: 'card' });

      Object.defineProperty(card, 'addHead', {
         value: function (element) {
            let head = this.querySelector('.head');
            if (!head) {
               head = n.createElement('h3', { class: 'head' });
               this.append(head);
            }
            attach(head, element);
            return this;
         }
      });

      Object.defineProperty(card, 'addContent', {
         value: function (element) {
            let body = this.querySelector('.body');
            if (!body) {
               body = n.createElement('div', { class: 'body' });
               this.append(body);
            }
            attach(body, element);
            return this;
         }
      });

      Object.defineProperty(card, 'toArray', {
         value: function () {
            return [this];
         }
      });

      return card;
   };
   this.chart = function (config) {
      if (!config?.type) {
         throw new Error("[chart] 'type' must be valid");
      }
      if (!config?.data) {
         throw new Error("[chart] 'data' must be valid");
      }
      const chart = n.createElement('canvas');

      new Chart(chart, {
         type: config.type,
         data: config.data,
         options: config?.options || {},
      });

      Object.defineProperty(chart, 'toArray', {
         value: function () {
            return [this];
         }
      });

      return chart;
   };

   this.form = function () {

   };
}

   //////////////////////////////////////////
   ////////// KODE BLOK KERNEL ////////////////
   //////////////////////////////////////////
class ContextMenu {
   static #mapData = new WeakMap();
   static #initialized = false;
   static #lastContext = null;

   constructor() {
      if (ContextMenu.#initialized) return;

      ContextMenu.#initialized = true;

      // remove ContextMenu saat terjadi scroll pada sebuah halaman
      document.addEventListener('scroll', e => {
         // console.log('scroll dari:', e.target);
         if (ContextMenu.#lastContext) {
            ContextMenu.#lastContext.release();
         };
      }, true);


      document.addEventListener('contextmenu', ev => {
         ev.preventDefault();

         const source = ev.target.closest('[data-context]') || ev.target;

         const config = ContextMenu.#mapData.get(source);

         if (!config) return;

         const menu = n.createElement('div', {
            class: 'contextMenu',
            html: `<div class="header">
                     <span></span>
                        <button class="btn-icon btn-danger" dismiss="modal">
                           <i class="ph ph-x"></i>
                        </button>
                  </div>`,
         });
         const ul = n.createElement('ul');
         let data = {
            context: menu,
            source: source
         };
         menu.append(ul);
         config.items.forEach(item => {
            const icon = item.icon ? `<i class="ph ph-${item.icon}"></i>` : '';
            const li = n.createElement('li', { html: `<a>${icon}${item.label}</a>` });
            item.context = li;
            ul.append(li);
         });

         if (ContextMenu.#lastContext) {
            ContextMenu.#lastContext.release();
         };
         if (typeof config?.attach === 'function') {
            data = config.attach.call(menu, ev, {
               context: menu,
               source: source
            });
         }
         if (!data) return;
         const pos = { x: ev.clientX, y: ev.clientY };

         n.layerManager.define("contextMenu", {
            source: data.source,
            causeExit: ["onblur", "onfocus"],
            overlay: {
               backdrop: false,
               matchWidth: false,
               attached: false,
               content: menu,
            },
            connected: async function (ev) {
               const target = ev;
               const context = target.context;

               if (ev.type === "init") {
                  ContextMenu.#lastContext = context;
                  n(context).css({ top: `${pos.y}px`, left: `${pos.x}px` });
                  const rect = menu.getBoundingClientRect();
                  if ((rect.width + rect.x) >= (window.innerWidth - 20)) {
                     n(context).css({ left: `${pos.x - rect.width}px` });
                  }
                  if (rect.y - rect.height - 20 > 0) {
                     n(context).css({ top: `${pos.y - rect.height}px` });
                  }

               } else if (ev.type === "click" || ev.type === "escape") {
                  this.release();
                  ContextMenu.#lastContext = null;
               } else if (ev.type === 'onblur') {
                  if (!source.contains(context)) {
                     this.release();
                     ContextMenu.#lastContext = null;
                  }
               } else if (ev.type == "onfocus") {
                  config.items.forEach(item => {
                     if (item.context.contains(ev.target)) {
                        item.action(ev);
                        this.release();
                     };
                  });
                  ContextMenu.#lastContext = null;
               }
            }
         });
      });
   }

   define(source, options) {
      if (!options) return;
      n(source).attr('data-context', '');
      ContextMenu.#mapData.set(source, options || { items: [] });
   }
}





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
function observer(selector, options) {
   const { onAdd = () => { }, onRemove = () => { } } = options;
   const obs = new MutationObserver(mutations => {
      mutations.forEach(m => {
         m.addedNodes.forEach(n => {
            if (n.nodeType !== 1) return;

            if (n.matches?.(selector)) onAdd?.(n);
            n.querySelectorAll?.(selector).forEach(onAdd);
         });

         m.removedNodes.forEach(n => {
            if (n.nodeType !== 1) return;

            if (n.matches?.(selector)) onRemove?.(n);
            n.querySelectorAll?.(selector).forEach(onRemove);
         });

      });
   });
   obs.observe(document.body, { childList: true, subtree: true });
   // initial
   document.querySelectorAll(selector).forEach(onAdd);
   return obs;
}

// pakai:


Kernel.background = function () {
   const canvas = q.createElement("canvas", { class: "bg-sky" });
   // q("body").append(canvas, "afterbegin");
   document.body.insertAdjacentElement("afterbegin", canvas);

   const earth = q.createElement("div", {
      class: "background-earth-wrap",
      html: `<div class="earth"></div>`,
   });
   q(canvas).append(earth, "afterend");
   const ctx = canvas.getContext("2d");

   const resize = function () {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
   };

   resize();

   let stars = [],
      mouseX,
      mouseY,
      shootingStar = { x: -100, y: 0, vx: 0, vy: 0, active: false };

   // Generate Stars
   for (let i = 0; i < 500; i++) {
      stars.push({
         x: Math.random() * canvas.width,
         y: Math.random() * canvas.height,
         radius: Math.random() * 1.7,
         alpha: Math.random(),
         speed: Math.random() * 0.02 + 0.005,
      });
   }

   function drawStars() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";

      stars.forEach((star) => {
         // Twinkle
         star.alpha += star.speed * (Math.random() < 0.5 ? -1 : 1);
         if (star.alpha < 0.1) star.alpha = 0.1;
         if (star.alpha > 1) star.alpha = 1;

         // Mouse interaction
         if (mouseX !== null && mouseY !== null) {
            let dx = star.x - mouseX;
            let dy = star.y - mouseY;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
               let angle = Math.atan2(dy, dx);
               star.x += Math.cos(angle) * 0.5;
               star.y += Math.sin(angle) * 0.5;
            }
         }

         ctx.globalAlpha = star.alpha;
         ctx.beginPath();
         ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
         ctx.fill();
      });

      // Shooting star logic
      if (!shootingStar.active && Math.random() < 0.002) {
         shootingStar.x = Math.random() * canvas.width;
         shootingStar.y = 0;
         shootingStar.vx = -4 - Math.random() * 2;
         shootingStar.vy = 4 + Math.random() * 2;
         shootingStar.active = true;
      }
      if (shootingStar.active) {
         ctx.globalAlpha = 1;
         ctx.strokeStyle = "#fff";
         ctx.lineWidth = 2;
         ctx.beginPath();
         ctx.moveTo(shootingStar.x, shootingStar.y);
         ctx.lineTo(shootingStar.x + 10, shootingStar.y - 10);
         ctx.stroke();
         shootingStar.x += shootingStar.vx;
         shootingStar.y += shootingStar.vy;
         if (shootingStar.y > canvas.height) shootingStar.active = false;
      }

      requestAnimationFrame(drawStars);
   }
   drawStars();
   window.addEventListener("resize", resize);
   window.addEventListener("mousemove", (ev) => {
      mouseX = ev.clientX;
      mouseY = ev.clientY;
   });
}
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
         };
      };
   }(src, events);
};


// @method-global

   const app = new Kernel({
      host: 'http://localhost/',
      defaultRouter: 'dashboard'
   });
   n.extend(n, {
      app: app
   });

   //////////////////////////////////////////
   ////////// KODE BLOK PAGES ////////////////
   //////////////////////////////////////////
app.view({
   dashboard: function (sss) {
      const isi = [
         {
            ico: 'user-list',
            title: 'Residents',
            desc: 'deskripsi resident data',
            hash: 'residents'
         },
         {
            ico: 'barn',
            title: 'Letters',
            desc: 'deskripsi letters data',
            hash: ''
         },
         {
            ico: 'certificate',
            title: 'Letters',
            desc: 'deskripsi letters data',
            hash: ''
         },
      ];
      let items = '';
      for (let i = 0; i < isi.length; i++) {
         items += `
               <div class="item">
                  <div class="head">
                     <i class="ph-fill ph-${isi[i].ico}"></i>
                  </div>
                  <div class="body">
                     <div class="title">${isi[i].title}</div>
                     <div class="desc">${isi[i].desc}</div>
                     <div class="action-group">
                        <a href="#${isi[i].hash}" class="btn btn-primary">
                           <i class="ph ph-book-open"></i>
                           <span>Open</span>
                        </a>
                     </div>
                  </div>
               </div>
            `;
      }
      // let items = `
      //       <div class="item">
      //          <div class="head">
      //             Nomor
      //          </div>
      //          <div class="body">
      //             <div class="title">Residents</div>
      //             <div class="desc"> Kelola Data Penduduk desa dan luar desa agar supaya berguna</div>
      //             <div class="action-group">
      //                <a class="btn btn-success">
      //                   <i class="ph ph-book-open"></i>
      //                   <span>Open</span>
      //                </a>
      //             </div>
      //          </div>
      //       </div>      
      // `;

      // for (let i = 0; i < 5; i++) {

      //    items += `
      //       <div class="item">
      //          <div class="head">
      //             <i class="ph-fill ph-user-list"></i>
      //          </div>
      //          <div class="body">
      //             <div class="title">Residents</div>
      //             <div class="desc"> Kelola Data Penduduk desa dan luar desa agar supaya berguna</div>
      //             <div class="action-group">
      //                <a class="btn btn-primary">
      //                   <i class="ph ph-book-open"></i>
      //                   <span>Open</span>
      //                </a>
      //             </div>
      //          </div>
      //       </div>
      //    `;
      // }

      const panel = `
      <div class="panel">
         <div class="head">
            <h3 class="panel-title">Panel title</h3>
         </div>
         <div class="body">
            <p>Panel content</p>
            ${items}
         </div>
      </div>
      `;
      const section = n.createElement('section', { class: 'list' });
      section.innerHTML = ` <div class="head">
               <h1>Dashboard</h1>
               <div class="action-group">
                  <button class="btn-icon" fad="search" type="button">
                     <i class="ph ph-magnifying-glass"></i>
                  </button>
                  <button class="btn-icon" fad="view" type="button">
                     <i class="ph ph-squares-four"></i>
                  </button>
                  <button class="btn-icon" fad="add" type="button">
                     <i class="ph ph-plus-square"></i>
                  </button>
               </div>
            </div>
            <div class="body">
               ${panel}
            </div>`;

      return View.dispatch(section, {
         mount(uri) {
            n.fontSize(rootFSize => {
               const head = this.querySelector('section>.head');
               const height = head.getBoundingClientRect().height;

               const main_h = this.getBoundingClientRect().height;
               n(this).find('section').css('max-height', `${main_h - height}px`)
            });

            // n.storage.save('uri', {
            //    name: uri.controller_name,
            //    view: section.matches('.list') ? 'list' : 'grid'
            // });

            const action = this.querySelector('section>.head>.action-group');
            action.addEventListener('click', ev => {
               const btn = ev.target.closest('button');
               if (!btn) return;
               // view
               if (btn.matches('[fad="view"]') && btn.closest('section')) {
                  const target = btn.closest('section');
                  n(target).toggleClass('list');
               };
            });
         },
      });
   },
});
app.view({
   login: function () {
      xx = `
            <div class="login frm-sign" id="wasu">
               <section>
                  <div class="head">
                     <h1>Sign in</h1>
                  </div>
                  <div class="body">
                     <form action="">
                        <div class="form-group">
                           <label for="email">Email</label>
                           <div class="input-group">
                              <input type="text" name="email" id="email" />
                           </div>
                        </div>
                        <div class="form-group">
                           <label for="password">Password</label>
                           <div class="input-group">
                              <input type="password" name="password" id="password" />
                           </div>
                        </div>

                        <div class="login-action">
                           <a href="#">Forgot Password?</a>
                           <button type="submit" class="btn btn-primary">Sign In</button>
                           <span class="sparator">or</span>


                           <button type="button" class="btn btn-google" id="googleLogin">
                              <img src="http://localhost/assets/images/google.svg" alt="Google">
                              <span>Continue with Google</span>
                           </button>

                     </form>
                  </div>
               </section>
               <span>New to CBNLink? <a href="#">Join now</a></span>
            </div>
            `;
      return View.dispatch(xx, {
         mount(res) {

            // n.ajax({
            //    url: 'http://localhost/api/test',
            //    headers: {
            //       Authorization:
            //          "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0IiwiYXVkIjoiaHR0cDovL2xvY2FsaG9zdCIsImlhdCI6MTc2NjE3NTk2OSwiZXhwIjoxNzY2MTc5NTY5LCJkYXRhIjp7Im5hbWUiOiJ3aWRvZG8ifX0.dbQqF41I1ifbIBGvtRVXaarJN_ADqdS7Qr-6A6I1Ld0",
            //    },
            //    success: (res) => {
            //       log('SUCCESS', res)
            //    },
            //    error: (err) => {
            //       log('ERROR', err)
            //    }
            // });


            n('.login form').on('submit', function (ev) {
               ev.preventDefault();
               n.ajax({
                  url: buildURL('login'),
                  data: n(this).serialize(),
                  method: 'POST',
                  success: (res) => {
                     log('SUCCESS', res)
                  },
                  error: (err) => {
                     log('ERROR', err)
                  }
               });
               // const email = this.querySelector('#email').value;
               // const password = this.querySelector('#password').value;
               // n.location('auth/login', { email, password });
            });

            const client = google.accounts.oauth2.initTokenClient({
               client_id: '598543379687-1o9bsasf8sialvhb0j8llndbhjgbgl6u.apps.googleusercontent.com',
               scope: 'email profile',
               callback: (res) => {
                  // log(res)
                  n.loader({
                     target: d.body,
                     logo: buildURL('assets/images/logo.png'),
                  });
                  n.ajax({
                     url: buildURL('api/google'),
                     data: { access_token: res.access_token },
                     method: 'POST',
                     success: (res) => {
                        log('GOOGLE', res)
                        n.location('otp', { otp: res.data });
                     },
                     error: (err) => {
                        log('GOOGLE ERROR', err)
                     },
                     always: () => {
                        n(d.body).stopLoader();
                     }
                  });
               }
            });
            d.querySelector('#googleLogin')?.addEventListener('click', () => {
               client.requestAccessToken(); // 🔥 INI YANG MEMUNCULKAN POPUP
            });
         }
      });
   },
});
app.view({
   map: function (sss) {
      const panel = n.createElement('div', {
         class: 'panel',
         html: `<div class="head">
                  <div>
                     <h1 class="title">Map Data</h1>
                     <div class="subtitle">Kelola Data Administrasi Wilayah</div>
                  </div>
                  <div class="action-group">
                     <button class="btn-icon" fad="search" type="button">
                        <i class="ph ph-magnifying-glass"></i>
                     </button>
                     <button class="btn-icon" fad="filter" type="button">
                        <i class="ph ph-sliders"></i>
                     </button>
                     <button class="btn-icon" fad="add" type="button">
                     <i class="ph ph-plus-square"></i>
                     </button>
                     <button class="btn-icon" fad="view" type="button">
                        <i class="ph ph-polygon"></i>
                     </button>
                  </div>
               </div>
               <div class="data-map" id="map"></div>`
      });

      const modal_form = function (source, options) {
         n.modal({
            header: {
               title: options?.title || 'No Title',
               close: true,
            },
            dismiss: {
               esc: true,
               backdrop: true,
            },
            source: source, // elemen pemicu (opsional)
            // content: "contoh", // url | string | html | element
            content: options.content,
            size: "md", // sm | md | lg | xl (dinormalisasi)
         });
      };

      const data = {
         type: "FeatureCollection",
         features: [
            {
               type: "Feature", properties: { pemilik: "SUDAR", shm: "123456", nop: "18.02.0812" },
               geometry: { type: "Polygon", coordinates: [[[105.809615, -4.662925], [105.810418, -4.663354], [105.810013, -4.664155], [105.809214, -4.663741], [105.809615, -4.662925]]] }
            },
            {
               type: "Feature", properties: { pemilik: "MISNAN", shm: "1012475", nop: "18.02.008.3" }, geometry: { type: "Polygon", coordinates: [[[105.809533, -4.665054], [105.809128, -4.665842], [105.809935, -4.666283], [105.810351, -4.665463], [105.809533, -4.665054]]] }
            },
            {
               type: "Feature", properties: { pemilik: "MISNAN", shm: "1012475", nop: "18.02.008.4" }, geometry: { type: "Polygon", coordinates: [[[105.812003, -4.666205], [105.812777, -4.666598], [105.813189, -4.665808], [105.812416, -4.665423], [105.812003, -4.666205]]] }
            },
            {
               type: "Feature", properties: { pemilik: "MISNAN", shm: "1012475", nop: "18.02.008.6" }, geometry: { type: "Polygon", coordinates: [[[105.809828, -4.662926], [105.808937, -4.662433], [105.809224, -4.661953], [105.810107, -4.66241], [105.809828, -4.662926]]] }
            },
            {
               type: "Feature", properties: { type: "batas_desa" }, geometry: { type: "Polygon", coordinates: [[[105.79731, -4.643172], [105.803661, -4.654286], [105.814991, -4.651551], [105.816793, -4.664375], [105.815334, -4.669675], [105.812416, -4.673266], [105.800228, -4.671727], [105.793962, -4.664118], [105.79731, -4.643172]]] }
            },
            {
               type: "Feature",
               properties: { nama: "Balai Kampung", jenis: "Perkantoran" },
               geometry: { type: "Point", coordinates: [105.808586, -4.659951] }
            },
            {
               type: "Feature",
               properties: { nama: "Poskesdes", jenis: "Kesehatan" },
               geometry: { type: "Point", coordinates: [105.808681, -4.660217] }
            },
            {
               type: "Feature",
               properties: { nama: "Gapoktan", jenis: "Perkantoran" },
               geometry: { type: "Point", coordinates: [105.808237, -4.660996] }
            },
            {
               type: "Feature",
               properties: { nama: "SDN 1 Cabang", jenis: "Pendidikan" },
               geometry: { type: "Point", coordinates: [105.80566, -4.665657] }
            },
         ]
      };



      return View.dispatch(panel, {
         mount(uri) {
            const map = L.map('map', {
               zoomControl: false
            }).setView([-4.665833, 105.805833], 15);

            // === satelit
            L.tileLayer(
               "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
               { maxZoom: 20, attribution: 'wahyu_widodo', maxNativeZoom: 18 }
            ).addTo(map);

            // ================= LAYERS =================
            const bidangLayer = new L.FeatureGroup().addTo(map);
            const jalanLayer = new L.FeatureGroup().addTo(map);
            const kanalLayer = new L.FeatureGroup().addTo(map);
            const markerLayer = new L.FeatureGroup().addTo(map);
            const batasLayer = new L.FeatureGroup().addTo(map);

            L.geoJSON(data, {
               onEachFeature: (feature, layer) => {
                  if (layer instanceof L.Polygon && !(layer instanceof L.Rectangle)) {
                     if (feature.properties?.type !== 'batas_desa') {
                        layer.bindPopup(app.Modal.map.popup.bidang(feature));
                        bidangLayer.addLayer(layer);
                     } else {
                        batasLayer.addLayer(layer);
                     }
                  };
                  // JALAN / KANAL
                  if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
                     if (feature.properties?.jenis === "jalan") jalanLayer.addLayer(layer);
                     if (feature.properties?.jenis === "kanal") kanalLayer.addLayer(layer);
                  };
                  if (layer instanceof L.Marker) {
                     layer.bindPopup(app.Modal.map.popup.marker(feature));
                     markerLayer.addLayer(layer);
                  };
               },
               style: feature => {

                  if (feature.properties?.jenis === "jalan")
                     return { color: "red", weight: 4 };

                  if (feature.properties?.jenis === "kanal")
                     return { color: "blue", weight: 4 };

                  if (feature.properties?.type === "batas_desa") {
                     return {
                        color: '#ff9100ff',
                        weight: 2,
                        dashArray: '8,6',
                        fill: false
                     };
                  }
                  return {
                     color: '#39b400ff',
                     weight: 1,
                     fillOpacity: .2
                  };
               }
            });//.addTo(map);



            // container edit tunggal
            const editableLayers = new L.FeatureGroup([
               bidangLayer,
               jalanLayer,
               kanalLayer,
               markerLayer,
               batasLayer
            ]).addTo(map);


            // ================= DRAW CONTROL =================
            const drawControl = new L.Control.Draw({
               edit: {
                  featureGroup: editableLayers
               },
               draw: {
                  polyline: false,
                  polygon: false,
                  rectangle: false,
                  circle: false,
                  marker: false,
                  circlemarker: false
               }
            });
            // map.addControl(drawControl);

            // Buat tombol custom: Bidang Tanah
            const drawBidang = new L.Draw.Polygon(map, {
               showArea: true,
               shapeOptions: {
                  color: '#ffc400ff',
                  fillOpacity: 0.2,
                  weight: 1,
               }
            });
            // Buat tombol custom: jalan
            const drawJalan = new L.Draw.Polyline(map, {
               shapeOptions: { color: 'red', weight: 4 },
               repeatMode: false
            });

            // Buat tombol custom: kanal
            const drawKanal = new L.Draw.Polyline(map, {
               shapeOptions: { color: 'blue', weight: 4 },
               repeatMode: false
            });

            // Buat tombol custom: Marker / Tanda
            const drawMarker = new L.Draw.Marker(map, {
               repeatMode: false,
            });

            // Batas Desa (polygon dashed)
            const drawBatas = new L.Draw.Polygon(map, {
               shapeOptions: {
                  color: '#ff9900',
                  weight: 3,
                  dashArray: '8,6',
                  fill: false
               }
            });



            n('button[fad="add"]').popup({
               menu: [
                  {
                     label: 'Tambah Bidang',
                     action: () => drawBidang.enable(),
                  },
                  {
                     label: 'Buat Tanda',
                     action: () => {
                        drawMarker.enable();
                     },
                  },
                  {
                     label: 'Tambah Jalan',
                     action: () => {
                        drawJalan.enable();
                     },
                  },
                  {
                     label: 'Tambah Irigasi',
                     action: () => {
                        drawKanal.enable();
                     },
                  },
                  {
                     label: 'Batas Desa',
                     action: () => {
                        drawBatas.enable();
                     },
                  },
               ],
            });

            // event saat polygon dibuat
            map.on(L.Draw.Event.CREATED, function (e) {
               const layer = e.layer;
               // ===== BATAS DESA
               if (layer instanceof L.Polygon && layer.options.dashArray) {
                  layer.feature = {
                     type: "Feature",
                     properties: {
                        jenis: "batas_desa",
                        nama: "Cabang " + (batasLayer.getLayers().length + 1)
                     }
                  };
                  // layer.bindPopup(`
                  //    <b>Batas Desa</b><br>
                  //    ${layer.feature.properties.nama}
                  //    `);

                  batasLayer.addLayer(layer);

                  log("GeoJSON:", editableLayers.toGeoJSON());
                  return;
               }

               // ===== BIDANG (Polygon)
               if (layer instanceof L.Polygon && !(layer instanceof L.Rectangle)) {
                  modal_form(n('#map').get(0), {
                     layer, editableLayers,
                     content: app.Modal.map.form.bidang({
                        layer, editableLayers,
                        draw: bidangLayer
                     }),
                     title: 'Form Bidang Tanah'
                  });
                  return;
               };

               // ===== JALAN / KANAL (Polyline)
               if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {

                  const warna = layer.options.color;

                  if (warna === 'red') {
                     layer.feature = {
                        type: "Feature",
                        properties: {
                           jenis: "jalan",
                           nama: prompt("Nama Jalan")
                        }
                     };

                     layer.bindPopup(`Jalan: ${layer.feature.properties.nama}`);
                     jalanLayer.addLayer(layer);
                  }

                  if (warna === 'blue') {
                     layer.feature = {
                        type: "Feature",
                        properties: {
                           jenis: "kanal",
                           nama: prompt("Nama Kanal")
                        }
                     };

                     layer.bindPopup(`Kanal: ${layer.feature.properties.nama}`);
                     kanalLayer.addLayer(layer);
                  }
               };

               // ===== MARKER
               if (layer instanceof L.Marker) {

                  const nama = prompt("Nama Lokasi:");
                  const jenis = prompt("Jenis (Kantor / Masjid / Patok / dll):");

                  layer.feature = {
                     type: "Feature",
                     properties: {
                        nama,
                        jenis
                     }
                  };

                  layer.bindPopup(`
                     <b>${nama}</b><br>
                     Jenis: ${jenis}
                     `);

                  markerLayer.addLayer(layer);
               }

               console.log("GeoJSON sekarang:", JSON.stringify(editableLayers.toGeoJSON()));
            });
         },
      });
   },
});
app.view({
   otp: function () {
      function content_otp_form(email) {
         return `
         <p>Enter the OTP sent to your email ${email}. Keep this code private and never share it with anyone, even if they claim to be from us.</p>
         <div class="form-otp">
         <input type="text" maxlength="1" />
         <input type="text" maxlength="1" />
         <input type="text" maxlength="1" />
         <input type="text" maxlength="1" />
         <input type="text" maxlength="1" />
         <input type="text" maxlength="1" />
         </div>

         <div class="login-action">
         <button class="btn btn-primary">Verify</button>
         <span>Code not received? <a class="btn-resend">Request again</a></span>
      `;
      };
      function content_otp_resend(email) {
         return `
         <p>The OTP code you entered has expired.  Please request a new code by pressing the 'Resend' button.  The new OTP will be sent to your email '${email}'.</p>

         <div class="login-action">
         <button type="button" class="btn btn-primary btn-resend">Resend</button>
      `;
      };
      xx = `
            <div class="login frm-otp" id="wasu">
               <section>
                  <div class="head">
                     <h1>OTP Verify</h1>
                  </div>
                  <div class="body">
                     <form action="" class="otp">

                     </form>
                  </div>
               </section>
            </div>
            `;
      return View.dispatch(xx, {
         mount(response) {
            let otp = response.data?.otp;
            let token = otp?.token;
            let payload = otp?.data;

            if (otp) {
               n.storage.save('otp', {
                  token: otp.token,
                  expires: otp.expires,
                  data: otp.data
               });
            } else {
               otp = n.storage.load('otp');
               token = otp?.token;
               payload = otp?.data;
            };
            function reloadForm(selector) {
               const form = d.querySelector(selector);
               form.innerHTML = content_otp_form(payload?.email || '');

               const inputs = form.querySelectorAll(".form-otp input");
               inputs.forEach((input, index) => {
                  input.addEventListener("input", () => {
                     if (input.value.length === 1 && index < inputs.length - 1) {
                        inputs[index + 1].focus();
                     }
                  });
                  input.addEventListener("keydown", (e) => {
                     if (e.key === "Backspace" && input.value === "" && index > 0) {
                        inputs[index - 1].focus();
                     }
                  });
               });
               return inputs;
            };
            let inputs = reloadForm('.login form');
            // 
            const otp_submit = function () {
               // Gabungkan semua nilai input jadi satu string
               const code = Array.from(inputs).map((input) => input.value).join("");
               if (code.length < 6) {
                  alert("Lengkapi semua digit OTP!");
                  return;
               };
               n.loader({ target: d.body, logo: buildURL('assets/images/logo.png') });
               n.ajax({
                  url: buildURL('api/verify'),
                  data: {
                     token: token,
                     code: code
                  },
                  method: 'POST',
                  success: (res) => {
                     // log('SUCCESS', res)
                     n.storage.remove('otp');
                     n.storage.save('auth_session', res.data.token);
                     location.hash = "";
                  },
                  error: (err) => {
                     if (err.message === 'Expired verification code') {
                        const data = err.data;
                        // hapus semua token yg disimpan
                        n.storage.remove('otp');
                        n.storage.remove('auth_session');
                        this.innerHTML = content_otp_resend(payload?.email || '');
                        return;
                     }
                     log('ERROR', err)
                  },
                  always: () => n(d.body).stopLoader(),
               });
            };

            const otp_resend = function () {
               n.loader({ target: d.body, logo: buildURL('assets/images/logo.png') });
               n.ajax({
                  url: buildURL('api/resend-otp'),
                  data: payload,
                  method: 'POST',
                  success: (res) => {
                     otp = res.data;
                     token = otp?.token;
                     payload = otp?.data;

                     n.storage.save('otp', {
                        token: otp.token,
                        expires: otp.expires,
                        data: otp.data
                     });
                     inputs = reloadForm('.login form');
                  },
                  error: (err) => {
                     log('ERROR RESEND OTP', err)
                  },
                  always: () => n(d.body).stopLoader(),
               })
            }
            // 

            n('.login form.otp').on('submit', function (ev) {
               ev.preventDefault();
               log('SUBMIT');
               otp_submit.call(this);
            });

            n(".login form.otp").on('click', function (ev) {
               if (!ev.target.closest('.btn-resend')) return
               ev.preventDefault();
               otp_resend.call(this);
            });

         }
      });
   },
});
app.view({
   residents: function (sss) {
      const isi = [
         {
            ico: 'user-list',
            title: 'SUGENG WAHYU WIDODO',
            desc: 'DUSUN III 001/002',
            hash: 'residents'
         },
         {
            ico: 'barn',
            title: 'NOERLIA NINGRUM',
            desc: 'DUSUN III 001/002',
            hash: ''
         },
         {
            ico: 'certificate',
            title: 'VINCENT ARKAAN FAEZA',
            desc: 'deskripsi letters data',
            hash: ''
         },
         {
            ico: 'barn',
            title: 'NOERLIA NINGRUM',
            desc: 'deskripsi letters data',
            hash: ''
         },
         {
            ico: 'certificate',
            title: 'VINCENT ARKAAN FAEZA',
            desc: 'deskripsi letters data',
            hash: ''
         },
         {
            ico: 'barn',
            title: 'NOERLIA NINGRUM',
            desc: 'deskripsi letters data',
            hash: ''
         },
         {
            ico: 'certificate',
            title: 'VINCENT ARKAAN FAEZA',
            desc: 'deskripsi letters data',
            hash: ''
         },
         {
            ico: 'barn',
            title: 'NOERLIA NINGRUM',
            desc: 'deskripsi letters data',
            hash: ''
         },
         {
            ico: 'certificate',
            title: 'VINCENT ARKAAN FAEZA',
            desc: 'deskripsi letters data',
            hash: ''
         },
         {
            ico: 'barn',
            title: 'NOERLIA NINGRUM',
            desc: 'deskripsi letters data',
            hash: ''
         },
         {
            ico: 'certificate',
            title: 'VINCENT ARKAAN FAEZA',
            desc: 'deskripsi letters data',
            hash: ''
         },
         {
            ico: 'barn',
            title: 'NOERLIA NINGRUM',
            desc: 'deskripsi letters data',
            hash: ''
         },
         {
            ico: 'certificate',
            title: 'VINCENT ARKAAN FAEZA',
            desc: 'deskripsi letters data',
            hash: ''
         },
         {
            ico: 'barn',
            title: 'NOERLIA NINGRUM',
            desc: 'deskripsi letters data',
            hash: ''
         },
         {
            ico: 'certificate',
            title: 'VINCENT ARKAAN FAEZA',
            desc: 'deskripsi letters data',
            hash: ''
         },
         {
            ico: 'barn',
            title: 'NOERLIA NINGRUM',
            desc: 'deskripsi letters data',
            hash: ''
         },
         {
            ico: 'certificate',
            title: 'VINCENT ARKAAN FAEZA',
            desc: 'deskripsi letters data',
            hash: ''
         },
         {
            ico: 'barn',
            title: 'NOERLIA NINGRUM',
            desc: 'deskripsi letters data',
            hash: ''
         },
         {
            ico: 'certificate',
            title: 'VINCENT ARKAAN FAEZA',
            desc: 'deskripsi letters data',
            hash: ''
         },
         {
            ico: 'barn',
            title: 'NOERLIA NINGRUM',
            desc: 'deskripsi letters data',
            hash: ''
         },
         {
            ico: 'certificate',
            title: 'VINCENT ARKAAN FAEZA',
            desc: 'deskripsi letters data',
            hash: ''
         },
         {
            ico: 'barn',
            title: 'NOERLIA NINGRUM',
            desc: 'deskripsi letters data',
            hash: ''
         },
         {
            ico: 'certificate',
            title: 'VINCENT ARKAAN FAEZA',
            desc: 'deskripsi letters data',
            hash: ''
         },
         {
            ico: 'barn',
            title: 'NOERLIA NINGRUM',
            desc: 'deskripsi letters data',
            hash: ''
         },
         {
            ico: 'certificate',
            title: 'VINCENT ARKAAN FAEZA',
            desc: 'deskripsi letters data',
            hash: ''
         },
         {
            ico: 'barn',
            title: 'NOERLIA NINGRUM',
            desc: 'deskripsi letters data',
            hash: ''
         },
         {
            ico: 'certificate',
            title: 'VINCENT ARKAAN FAEZA',
            desc: 'deskripsi letters data',
            hash: ''
         },
         {
            ico: 'barn',
            title: 'NOERLIA NINGRUM',
            desc: 'deskripsi letters data',
            hash: ''
         },
         {
            ico: 'certificate',
            title: 'VINCENT ARKAAN FAEZA',
            desc: 'deskripsi letters data',
            hash: ''
         },
         {
            ico: 'barn',
            title: 'NOERLIA NINGRUM',
            desc: 'deskripsi letters data',
            hash: ''
         },
         {
            ico: 'certificate',
            title: 'VINCENT ARKAAN FAEZA',
            desc: 'deskripsi letters data',
            hash: ''
         },
         {
            ico: 'barn',
            title: 'NOERLIA NINGRUM',
            desc: 'deskripsi letters data',
            hash: ''
         },
         {
            ico: 'certificate',
            title: 'VINCENT ARKAAN FAEZA',
            desc: 'deskripsi letters data',
            hash: ''
         },
      ];
      let items = '';
      for (let i = 0; i < isi.length; i++) {
         items += `
               <div class="item">
                  <div class="head">
                     <i class="ph-fill ph-${isi[i].ico}"></i>
                  </div>
                  <div class="body">
                     <div class="title">${isi[i].title}</div>
                     <div class="desc">${isi[i].desc}</div>
                  </div>
               </div>
            `;
      };

      const panel = n.createElement('div', {
         class: 'panel',
         html: `<div class="head">
                  <div>
                     <h1 class="title">Residents Data</h1>
                     <div class="subtitle">Kelola Data Penduduk dalam desa ini</div>
                  </div>
                  <div class="action-group">
                     <button class="btn-icon" fad="search" type="button">
                        <i class="ph ph-magnifying-glass"></i>
                     </button>
                     <button class="btn-icon" fad="filter" type="button">
                        <i class="ph ph-sliders"></i>
                     </button>
                     <button class="btn-icon" fad="view" type="button">
                        <i class="ph ph-squares-four"></i>
                     </button>
                     <button class="btn-icon" fad="add" type="button">
                        <i class="ph ph-plus-square"></i>
                     </button>
                  </div>
               </div>
               <div class="body data-view">
                     <p>Panel content</p>
                     ${items}
               </div>`
      });

      const modal_form = function (source, options) {
         n.modal({
            header: {
               title: "Preview",
               close: true,
            },
            dismiss: {
               esc: true,
               backdrop: true,
            },
            source: source, // elemen pemicu (opsional)
            // content: "contoh", // url | string | html | element
            content: app.Modal.resident_view(),
            size: "md", // sm | md | lg | xl (dinormalisasi)
         });
      };

      const marking = function (source) {
         if (!n(source).hasClass('marking')) {
            n(source).addClass('marking');
            const mark = n.createElement('span', {
               class: 'marking-icon',
               html: `<i class="ph-fill ph-check-circle"></i>`
            });
            source.appendChild(mark);
            store.set(source, { value: 123 });
            console.log('Tandai');
         } else {
            n(source).removeClass('marking');
            source.querySelector('.marking-icon').remove();
            store.delete(source);
            log('hilangkan tanda')
         };
      };

      const store = new n.Memory();
      store.addEventListener('memory', ev => {
         log(ev.action, ev.data.size)
         const actions = panel.querySelector('.head>.action-group');
         const btn_check = actions.querySelector('.btn-icon[fad="check-all"]');
         const btn_add = actions.querySelector('.btn-icon[fad="add"]');
         if (ev.data.size) {
            if (btn_check) {
               btn_check.querySelector('span').textContent = ev.data.size;
            } else {
               const btn = n.createElement('button', {
                  class: 'btn-icon',
                  fad: 'check-all',
                  type: 'button',
                  html: `<i class="ph ph-check-square"></i><span>1</span>`
               });
               btn_add.remove();
               actions.appendChild(btn);
            }
         } else {
            btn_check.remove();
            const btn = n.createElement('button', {
               class: 'btn-icon',
               fad: 'add',
               type: 'button',
               html: `<i class="ph ph-plus-square"></i>`
            });
            actions.appendChild(btn);
         }
      })

      return View.dispatch(panel, {
         mount(uri) {
            this.addEventListener('click', ev => {
               const action = ev.target.closest('.action-group [fad]');
               const target_item = ev.target.closest('.item');
               if (!action && !target_item) return;
               const contextMenu = document.querySelectorAll('.contextMenu');
               if (contextMenu.length) {
                  contextMenu.forEach(c => c.parentElement.release());
                  return;
               }

               // ubah tampilan [grid/list]
               if (action && action.matches('[fad="view"]')) {
                  const target = ev.target.closest('.panel');
                  n(target).toggleClass('list');
               };

               // show modal popup
               if (target_item) {
                  if (store.size) {
                     marking(target_item);
                  } else {
                     modal_form(target_item);
                  }
               };
            });

            const menu = [
               {
                  label: 'Preview data',
                  icon: 'eye',
                  action: function (ev) {
                     modal_form(ev.src);
                     console.log('preview data');
                  },
               },
               {
                  label: 'Tandai',
                  icon: 'check-square',
                  action: function (ev) {
                     marking(ev.src);
                  },
               },
               {
                  label: 'Ubah data',
                  icon: 'pencil-line',
                  action: function (ev) {
                     modal_form(ev.src);
                     console.log('ubah data');
                  }
               },
               {
                  label: 'Ubah Status',
                  icon: 'highlighter',
                  action: function () {
                     console.log('ubah status');
                  }
               },
               {
                  label: 'Hapus',
                  icon: 'trash',
                  action: function (ev) {
                     ev.src.remove();
                     console.log('hapus');
                  }
               },
            ];

            app.contextMenu(panel, {
               items: menu,
               attach: (ev, data) => {
                  const target = ev.target.closest('.item');
                  if (!target) return;
                  data.source = target;
                  return data;
               },
            });
         },
      });
   },
});
app.view({
   tes: function (sss) {
      const section = n.createElement('section', { class: '' });
      section.innerHTML = `
            <div class="body paper">
               <div class="form-input vertical">
                  <label for="email">Email</label>
                  <div class="input-group">
                     <input type="text" name="email" id="email" />
                  </div>
               </div>
               <div class="form-input vertical">
                  <label for="nama">Nama</label>
                  <div class="input-group">
                     <input type="text" name="nama" id="nama" />
                  </div>
               </div>
               <div class="form-input vertical">
                  <label for="email">Email</label>
                  <div class="input-group">
                     <input type="text" value="widodo@xx" name="email" id="email" />
                  </div>
               </div>
               <div class="form-group">
                  <div class="form-input">
                     <label for="email">Email</label>
                     <div class="input-group">
                        <input type="text" value="" name="email" id="email" />
                     </div>
                  </div>
                  <div class="form-input">
                     <label for="email">Alamat Tinggal</label>
                     <div class="input-group vertical">
                        <input type="text" value="" name="email" id="email" />
                        <input type="text" value="" name="email" id="email" />
                     </div>
                  </div>
               </div>
               <div class="form-group vertical">
                  <div class="form-input">
                     <label for="email">Email</label>
                     <div class="input-group">
                        <input type="text" value="" name="email" id="email" />
                     </div>
                  </div>
                  <div class="form-input">
                     <label for="email">Alamat Tinggal hantu</label>
                     <div class="input-group">
                        <input type="text" value="" name="email" id="email" />
                        <input type="text" value="" name="email" id="email" />
                     </div>
                  </div>
               </div>
               <div class="form-input">
                  <label for="email">Alamat Tinggal rumah cabang</label>
                  <div class="input-group">
                     <input type="text" value="" name="email" id="email" />
                  </div>
               </div>
            </div>`;

      return View.dispatch(section, {
         mount(uri) {
            // 
         },
      });
   },
});


app.view({
   web: function (sss) {
      // log(buildURL('/assets/images/logo.png'))
      const isi = [
         {
            head: 'distribusi penduduk',
            type: 'doughnut',
            data: {
               labels: ["0-17 tahun", "18-35 tahun", "36-55 tahun", "56+ tahun"],
               datasets: [{
                  label: "Jumlah Penduduk",
                  data: [3125, 4375, 3125, 1875],
                  backgroundColor: ["#6366f1", "#10b981", "#f59e0b", "#ef4444"],
                  borderWidth: 0,
               },],
            },
            options: {
               responsive: true,
               maintainAspectRatio: false,
               plugins: {
                  legend: {
                     position: "bottom",
                     labels: {
                        color: "#a3a8ad",
                        padding: 20,
                        usePointStyle: true,
                     },
                  },
               },
               scales: {
                  y: {
                     beginAtZero: true,
                     grid: {
                        color: "rgba(255,255,255,0.1)",
                     },
                     ticks: {
                        color: "#a3a8ad",
                     },
                  },
                  x: {
                     grid: {
                        color: "rgba(255,255,255,0.1)",
                     },
                     ticks: {
                        color: "#a3a8ad",
                     },
                  },
               },
            },
         },
         {
            head: 'Anggaran Desa',
            type: 'bar',
            data: {
               labels: ["Pemasukan", "Pengeluaran"],
               datasets: [{
                  label: "Anggaran (Rp Juta)",
                  data: [2500, 2250],
                  backgroundColor: ["#10b981", "#ef4444"],
                  borderWidth: 0,
               },],
            },
            options: {
               responsive: true,
               maintainAspectRatio: false,
               plugins: {
                  legend: {
                     display: false,
                  },
               },
               scales: {
                  y: {
                     beginAtZero: true,
                     grid: {
                        color: "rgba(255,255,255,0.1)",
                     },
                     ticks: {
                        color: "#a3a8ad",
                     },
                  },
                  x: {
                     grid: {
                        color: "rgba(255,255,255,0.1)",
                     },
                     ticks: {
                        color: "#a3a8ad",
                     },
                  },
               },
            },
         },
         {
            head: 'Pajak PBB',
            type: 'line',
            data: {
               labels: ["2020", "2021", "2022", "2023", "2024"],
               datasets: [{
                  label: "Pajak PBB (Rp Juta)",
                  data: [50, 55, 60, 58, 62],
                  borderColor: "#9b59b6",
                  fill: false,
               },],
            },
            options: {
               responsive: true,
               maintainAspectRatio: false,
               plugins: {
                  legend: {
                     display: false,
                  },
               },
               scales: {
                  y: {
                     beginAtZero: true,
                     grid: {
                        color: "rgba(255,255,255,0.1)",
                     },
                     ticks: {
                        color: "#a3a8ad",
                     },
                  },
                  x: {
                     grid: {
                        color: "rgba(255,255,255,0.1)",
                     },
                     ticks: {
                        color: "#a3a8ad",
                     },
                  },
               },
            },
         },
         {
            head: 'Aparatur Desa',
            type: 'bar',
            data: {
               labels: ["Kepala Desa", "Sekretaris", "Kaur", "Kadus", "BPD"],
               datasets: [{
                  label: "Jumlah Aparatur",
                  data: [1, 1, 3, 5, 7],
                  backgroundColor: "#34495e",
               },],
            },
            options: {
               responsive: true,
               maintainAspectRatio: false,
               plugins: {
                  legend: {
                     display: false,
                  },
               },
               scales: {
                  y: {
                     beginAtZero: true,
                     grid: {
                        color: "rgba(255,255,255,0.1)",
                     },
                     ticks: {
                        color: "#a3a8ad",
                     },
                  },
                  x: {
                     grid: {
                        color: "rgba(255,255,255,0.1)",
                     },
                     ticks: {
                        color: "#a3a8ad",
                     },
                  },
               },
            },
         },
      ];
      const section = n.app.UI.component.section();
      section.addHead(`<h1 class="center">Data & Statistik Desa</h1>`);
      isi.forEach(item => {
         const chart = n.app.UI.component.chart({
            type: item.type,
            data: item.data,
            options: item.options
         });
         const card = n.app.UI.component.card()
            .addHead(item.head)
            .addContent(chart)
         section.addContent(card);
      });

      return section;
   },
});

   //////////////////////////////////////////
   ////////// KODE BLOK LETTERS ////////////////
   //////////////////////////////////////////
// @extended
});