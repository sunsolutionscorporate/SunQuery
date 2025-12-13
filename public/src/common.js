// @method-common

!async function () {
   const cfg = await n.getConfig()
   async function router() {
      const path_url = { controller_name: null, path: '/', params: {}, segments: [] };
      function wrt() {
         const hash = location.hash.replace(/^#\/?/, '') || '/';
         const [pathPart, queryPart] = hash.split('?');
         path_url.path = pathPart;
         path_url.segments = pathPart.split('/').filter(Boolean);
         path_url.params = {};
         if (queryPart) {
            for (const [k, v] of new URLSearchParams(queryPart)) path_url.params[k] = v;
         };
         path_url.controller_name = path_url.segments[0] || '';
         // n.EventCustom('routes', { ...path_url }).target(n);
      };
      function setHash(hash) {
         wrt();
         n.EventCustom('routes', { ...path_url }).target(n);
      }
      window.addEventListener("hashchange", setHash);
      // await new Promise((resolve) => setTimeout(resolve, 50));
      // log('ROUTER')
      // n.addEventListener('afterinit', async function () {
      //    wrt();
      // });
      n.router = new function () {
         this.path = () => path_url.path;
         this.segments = () => path_url.segments;
         this.params = () => path_url.params;
         this.controller = () => path_url.controller_name;
      }
      n.ready(setHash);
   };
   class PlatformAPI {
      #breakpoints = null;
      #globalWatchers = [];
      #mediaQueries = [];
      #data = {
         orientation: null,
         device: null,
         os: 'unknown',
         browser: {
            type: 'unknown',
            version: 'unknown'
         },
         touch: null,
         language: null,
      };
      #orientationQuery = null;
      #asu(fn, delay) {
         let timer = null;
         return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
         };
      }

      #debounce = this.#asu(() => {
         for (const cb of this.#globalWatchers) cb(this.#data);
      }, 300);

      constructor(breakpoints) {
         this.#breakpoints = breakpoints;

         this.#data.orientation = this.#getOrientation();
         for (const [name, query] of Object.entries(breakpoints)) {
            const mq = window.matchMedia(query);
            const handler = e => this.#handleMediaChange(name, e.matches);

            mq.addEventListener('change', handler);
            this.#mediaQueries.push({ mq, handler, name });

            if (mq.matches) this.#data.device = name;
         };
         this.#init();
      };

      #init() {
         this.#setupOrientationListener();
         const ua = navigator.userAgent;
         // OS detection
         if (/windows/i.test(ua)) this.#data.os = "Windows";
         else if (/android/i.test(ua)) this.#data.os = "Android";
         else if (/linux/i.test(ua)) this.#data.os = "Linux";
         else if (/iphone|ipad|ipod/i.test(ua)) this.#data.os = "iOS";
         else if (/macintosh|mac os x/i.test(ua)) this.#data.os = "MacOS";

         if (/firefox/i.test(ua)) {
            this.#data.browser.type = "Firefox";
            this.#data.browser.version = ua.match(/firefox\/([\d.]+)/i)?.[1] || "";
         } else if (/edg/i.test(ua)) {
            this.#data.browser.type = "Edge";
            this.#data.browser.version = ua.match(/edg\/([\d.]+)/i)?.[1] || "";
         } else if (/chrome|crios/i.test(ua)) {
            this.#data.browser.type = "Chrome";
            this.#data.browser.version = ua.match(/(?:chrome|crios)\/([\d.]+)/i)?.[1] || "";
         } else if (/safari/i.test(ua)) {
            this.#data.browser.type = "Safari";
            this.#data.browser.version = ua.match(/version\/([\d.]+)/i)?.[1] || "";
         } else if (/opera|opr/i.test(ua)) {
            this.#data.browser.type = "Opera";
            this.#data.browser.version = ua.match(/(?:opera|opr)\/([\d.]+)/i)?.[1] || "";
         } else if (/msie|trident/i.test(ua)) {
            this.#data.browser.type = "IE";
            this.#data.browser.version = ua.match(/(?:msie |rv:)([\d.]+)/i)?.[1] || "";
         }

         this.#data.touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
         this.#data.language = navigator.language || navigator.userLanguage;
      };

      #getOrientation() {
         return window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape';
      };

      #handleMediaChange(name, matched) {
         if (matched && this.#data.device !== name) {
            this.#data.device = name;
            this.#debounce();
         }
      };

      #setupOrientationListener() {
         const orientationQuery = window.matchMedia('(orientation: portrait)');
         const handler = e => {
            const newOrientation = e.matches ? 'portrait' : 'landscape';
            if (newOrientation !== this.#data.orientation) {
               this.#data.orientation = newOrientation;
               this.#debounce();
            }
         };
         orientationQuery.addEventListener('change', handler);
         this.#orientationQuery = { mq: orientationQuery, handler };
      };

      watcher(mediaOrCb) {
         if (typeof mediaOrCb === 'function') {
            this.#globalWatchers.push(mediaOrCb);
            // ✅ Jalankan callback langsung saat inisialisasi
            mediaOrCb(this.#data);
         }
      };

      destroy() {
         for (const { mq, handler } of this.#mediaQueries) {
            mq.removeEventListener('change', handler);
         }
         if (this.#orientationQuery) {
            this.#orientationQuery.mq.removeEventListener('change', this.#orientationQuery.handler);
         }
         this.#globalWatchers = [];
      };
   }

   const platfor_std = { mobile: '(max-width: 767px)', tablet: '(min-width: 768px) and (max-width: 1023px)', desktop: '(min-width: 1024px)' }
   if (typeof cfg.platform === 'boolean') {
      cfg.platform && (n.platform = new PlatformAPI(platfor_std));
   } else if (n.helper.type(cfg.platform, 'object')) {
      for (const key in cfg.platform) {
         if (!platfor_std[key]) continue;
         if (typeof cfg.platform[key] !== 'string') continue;
         platfor_std[key] = cfg.platform[key]
      }
      n.platform = new PlatformAPI(platfor_std);
   } else {
      log.error(`[platform] init`, `configuration is invalid, use type 'boolean' or 'object' instead of '${n.helper.type(cfg.platform)}'`);
   };

   if (n.platform) {
      await n.ready();
      n.platform.watcher(media => {
         d.body.classList.toggle('mobile', media.device === 'mobile');
         d.body.classList.toggle('tablet', media.device === 'tablet');
         d.body.classList.toggle('desktop', media.device === 'desktop');
         d.body.classList.toggle('landscape', media.orientation === 'landscape');
         d.body.classList.toggle('portrait', media.orientation === 'portrait');
      });
   };
   cfg.router && router();
}();