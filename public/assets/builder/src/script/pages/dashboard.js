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