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