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