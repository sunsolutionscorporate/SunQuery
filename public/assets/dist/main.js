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


   //////////////////////////////////////////
   ////////// KODE BLOK UI ////////////////
   //////////////////////////////////////////
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

function Kernel(options) {
   if (!options?.host) {
      throw new Error("[Kernel] Host not defined");
   };
   options.host = options?.host?.replace(/^\/|\/$/g, "") + "/";//hilangkan '/' awal dan akhir
   this.version = '1.0.0';
   this.UI = new UI();
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
   }
};
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
         }
      }
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
      let items = '';

      for (let i = 0; i < 20; i++) {

         items += `
            <div class="item">
               <div class="head">
                  <i class="ph-fill ph-user-list"></i>
               </div>
               <div class="body">
                  <div class="title">Residents</div>
                  <div class="desc"> Kelola Data Penduduk desa dan luar desa agar supaya berguna</div>
                  <div class="action-group">
                     <a class="btn btn-primary" href="#/penduduk/">
                        <i class="ph ph-book-open"></i>
                        <span>Open</span>
                     </a>
                  </div>
               </div>
            </div>
         `;
      }

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
      const section = `
         <section>
            <div class="head">
               <h1>Dashboard</h1>
            </div>
            <div class="body">
               ${panel}
            </div>
         </section>   
      `;

      return View.dispatch(section, {
         mount(res) {
            n.fontSize(rootFSize => {
               const head = this.querySelector('section>.head')
               const height = head.getBoundingClientRect().height;

               const main_h = this.getBoundingClientRect().height;
               n(this).find('section').css('max-height', `${main_h - height}px`)
            })
         }
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