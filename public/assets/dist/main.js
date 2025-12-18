!(function (a) {
   try {
      if (!window.sunQuery) throw new Error(`library 'sunQuery.js' belum terpasang`);
      return a(q);
   } catch (error) {
      console.warn(error);
   }
})(async function (n) {
   const log = console.log;


   //////////////////////////////////////////
   ////////// KODE BLOK UI ////////////////
   //////////////////////////////////////////
function wasu() { }
function wasux() { }
function wasuxx() { }

   //////////////////////////////////////////
   ////////// KODE BLOK PAGES ////////////////
   //////////////////////////////////////////

   //////////////////////////////////////////
   ////////// KODE BLOK LETTERS ////////////////
   //////////////////////////////////////////

   //////////////////////////////////////////
   ////////// KODE BLOK KERNEL ////////////////
   //////////////////////////////////////////
function Kernel() {
   this.version = '1.0.0';
   const instance = this;
   const b = document.body;
   const d = document;
   const vwSections = {
      'header': 'header.html',
      'main': 'form-login.html',
      'footer': 'footer.html'
   };
   const pageRender = async (callback) => {
      const promises = [];

      for (const key in vwSections) {
         // Buat promise untuk setiap load
         const p = new Promise((resolve, reject) => {
            setTimeout(() => {//timer hanya untuk simulaso loading testing
               q(key).load(vwSections[key], {
                  status: function (res) {
                     if (res.statusText === 'OK') {
                        resolve();
                     } else {
                        reject(res);
                     }
                  }
               });
            }, 500)
         });

         promises.push(p);
      }

      try {
         // Tunggu semua load selesai
         await Promise.all(promises);
         // Semua selesai, panggil callback
         if (typeof callback === 'function') callback();
      } catch (err) {
         console.error('Gagal load salah satu section:', err);
      }
   };

   //////////////////////////////////
   ////////// PRIVATE METHOD ////////
   //////////////////////////////////



   n.loader({ target: b, logo: 'assets/img/logo.png' });

   pageRender(function () {
      // console.log('OKE')
      n(b).stopLoader();
   });
   // render background canvas
   Kernel.background();
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

   // kode penutup

   new Kernel();
});