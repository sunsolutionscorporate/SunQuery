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