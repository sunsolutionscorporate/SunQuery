
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