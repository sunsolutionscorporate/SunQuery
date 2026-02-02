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