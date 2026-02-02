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

