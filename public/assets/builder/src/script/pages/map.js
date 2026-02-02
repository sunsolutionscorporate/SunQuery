app.view({
   map: function (sss) {
      const panel = n.createElement('div', {
         class: 'panel',
         html: `<div class="head">
                  <div>
                     <h1 class="title">Map Data</h1>
                     <div class="subtitle">Kelola Data Administrasi Wilayah</div>
                  </div>
                  <div class="action-group">
                     <button class="btn-icon" fad="search" type="button">
                        <i class="ph ph-magnifying-glass"></i>
                     </button>
                     <button class="btn-icon" fad="filter" type="button">
                        <i class="ph ph-sliders"></i>
                     </button>
                     <button class="btn-icon" fad="add" type="button">
                     <i class="ph ph-plus-square"></i>
                     </button>
                     <button class="btn-icon" fad="view" type="button">
                        <i class="ph ph-polygon"></i>
                     </button>
                  </div>
               </div>
               <div class="data-map" id="map"></div>`
      });

      const modal_form = function (source, options) {
         n.modal({
            header: {
               title: options?.title || 'No Title',
               close: true,
            },
            dismiss: {
               esc: true,
               backdrop: true,
            },
            source: source, // elemen pemicu (opsional)
            // content: "contoh", // url | string | html | element
            content: options.content,
            size: "md", // sm | md | lg | xl (dinormalisasi)
         });
      };

      const data = {
         type: "FeatureCollection",
         features: [
            {
               type: "Feature", properties: { pemilik: "SUDAR", shm: "123456", nop: "18.02.0812" },
               geometry: { type: "Polygon", coordinates: [[[105.809615, -4.662925], [105.810418, -4.663354], [105.810013, -4.664155], [105.809214, -4.663741], [105.809615, -4.662925]]] }
            },
            {
               type: "Feature", properties: { pemilik: "MISNAN", shm: "1012475", nop: "18.02.008.3" }, geometry: { type: "Polygon", coordinates: [[[105.809533, -4.665054], [105.809128, -4.665842], [105.809935, -4.666283], [105.810351, -4.665463], [105.809533, -4.665054]]] }
            },
            {
               type: "Feature", properties: { pemilik: "MISNAN", shm: "1012475", nop: "18.02.008.4" }, geometry: { type: "Polygon", coordinates: [[[105.812003, -4.666205], [105.812777, -4.666598], [105.813189, -4.665808], [105.812416, -4.665423], [105.812003, -4.666205]]] }
            },
            {
               type: "Feature", properties: { pemilik: "MISNAN", shm: "1012475", nop: "18.02.008.6" }, geometry: { type: "Polygon", coordinates: [[[105.809828, -4.662926], [105.808937, -4.662433], [105.809224, -4.661953], [105.810107, -4.66241], [105.809828, -4.662926]]] }
            },
            {
               type: "Feature", properties: { type: "batas_desa" }, geometry: { type: "Polygon", coordinates: [[[105.79731, -4.643172], [105.803661, -4.654286], [105.814991, -4.651551], [105.816793, -4.664375], [105.815334, -4.669675], [105.812416, -4.673266], [105.800228, -4.671727], [105.793962, -4.664118], [105.79731, -4.643172]]] }
            },
            {
               type: "Feature",
               properties: { nama: "Balai Kampung", jenis: "Perkantoran" },
               geometry: { type: "Point", coordinates: [105.808586, -4.659951] }
            },
            {
               type: "Feature",
               properties: { nama: "Poskesdes", jenis: "Kesehatan" },
               geometry: { type: "Point", coordinates: [105.808681, -4.660217] }
            },
            {
               type: "Feature",
               properties: { nama: "Gapoktan", jenis: "Perkantoran" },
               geometry: { type: "Point", coordinates: [105.808237, -4.660996] }
            },
            {
               type: "Feature",
               properties: { nama: "SDN 1 Cabang", jenis: "Pendidikan" },
               geometry: { type: "Point", coordinates: [105.80566, -4.665657] }
            },
         ]
      };



      return View.dispatch(panel, {
         mount(uri) {
            const map = L.map('map', {
               zoomControl: false
            }).setView([-4.665833, 105.805833], 15);

            // === satelit
            L.tileLayer(
               "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
               { maxZoom: 20, attribution: 'wahyu_widodo', maxNativeZoom: 18 }
            ).addTo(map);

            // ================= LAYERS =================
            const bidangLayer = new L.FeatureGroup().addTo(map);
            const jalanLayer = new L.FeatureGroup().addTo(map);
            const kanalLayer = new L.FeatureGroup().addTo(map);
            const markerLayer = new L.FeatureGroup().addTo(map);
            const batasLayer = new L.FeatureGroup().addTo(map);

            L.geoJSON(data, {
               onEachFeature: (feature, layer) => {
                  if (layer instanceof L.Polygon && !(layer instanceof L.Rectangle)) {
                     if (feature.properties?.type !== 'batas_desa') {
                        layer.bindPopup(app.Modal.map.popup.bidang(feature));
                        bidangLayer.addLayer(layer);
                     } else {
                        batasLayer.addLayer(layer);
                     }
                  };
                  // JALAN / KANAL
                  if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
                     if (feature.properties?.jenis === "jalan") jalanLayer.addLayer(layer);
                     if (feature.properties?.jenis === "kanal") kanalLayer.addLayer(layer);
                  };
                  if (layer instanceof L.Marker) {
                     layer.bindPopup(app.Modal.map.popup.marker(feature));
                     markerLayer.addLayer(layer);
                  };
               },
               style: feature => {

                  if (feature.properties?.jenis === "jalan")
                     return { color: "red", weight: 4 };

                  if (feature.properties?.jenis === "kanal")
                     return { color: "blue", weight: 4 };

                  if (feature.properties?.type === "batas_desa") {
                     return {
                        color: '#ff9100ff',
                        weight: 2,
                        dashArray: '8,6',
                        fill: false
                     };
                  }
                  return {
                     color: '#39b400ff',
                     weight: 1,
                     fillOpacity: .2
                  };
               }
            });//.addTo(map);



            // container edit tunggal
            const editableLayers = new L.FeatureGroup([
               bidangLayer,
               jalanLayer,
               kanalLayer,
               markerLayer,
               batasLayer
            ]).addTo(map);


            // ================= DRAW CONTROL =================
            const drawControl = new L.Control.Draw({
               edit: {
                  featureGroup: editableLayers
               },
               draw: {
                  polyline: false,
                  polygon: false,
                  rectangle: false,
                  circle: false,
                  marker: false,
                  circlemarker: false
               }
            });
            // map.addControl(drawControl);

            // Buat tombol custom: Bidang Tanah
            const drawBidang = new L.Draw.Polygon(map, {
               showArea: true,
               shapeOptions: {
                  color: '#ffc400ff',
                  fillOpacity: 0.2,
                  weight: 1,
               }
            });
            // Buat tombol custom: jalan
            const drawJalan = new L.Draw.Polyline(map, {
               shapeOptions: { color: 'red', weight: 4 },
               repeatMode: false
            });

            // Buat tombol custom: kanal
            const drawKanal = new L.Draw.Polyline(map, {
               shapeOptions: { color: 'blue', weight: 4 },
               repeatMode: false
            });

            // Buat tombol custom: Marker / Tanda
            const drawMarker = new L.Draw.Marker(map, {
               repeatMode: false,
            });

            // Batas Desa (polygon dashed)
            const drawBatas = new L.Draw.Polygon(map, {
               shapeOptions: {
                  color: '#ff9900',
                  weight: 3,
                  dashArray: '8,6',
                  fill: false
               }
            });



            n('button[fad="add"]').popup({
               menu: [
                  {
                     label: 'Tambah Bidang',
                     action: () => drawBidang.enable(),
                  },
                  {
                     label: 'Buat Tanda',
                     action: () => {
                        drawMarker.enable();
                     },
                  },
                  {
                     label: 'Tambah Jalan',
                     action: () => {
                        drawJalan.enable();
                     },
                  },
                  {
                     label: 'Tambah Irigasi',
                     action: () => {
                        drawKanal.enable();
                     },
                  },
                  {
                     label: 'Batas Desa',
                     action: () => {
                        drawBatas.enable();
                     },
                  },
               ],
            });

            // event saat polygon dibuat
            map.on(L.Draw.Event.CREATED, function (e) {
               const layer = e.layer;
               // ===== BATAS DESA
               if (layer instanceof L.Polygon && layer.options.dashArray) {
                  layer.feature = {
                     type: "Feature",
                     properties: {
                        jenis: "batas_desa",
                        nama: "Cabang " + (batasLayer.getLayers().length + 1)
                     }
                  };
                  // layer.bindPopup(`
                  //    <b>Batas Desa</b><br>
                  //    ${layer.feature.properties.nama}
                  //    `);

                  batasLayer.addLayer(layer);

                  log("GeoJSON:", editableLayers.toGeoJSON());
                  return;
               }

               // ===== BIDANG (Polygon)
               if (layer instanceof L.Polygon && !(layer instanceof L.Rectangle)) {
                  modal_form(n('#map').get(0), {
                     layer, editableLayers,
                     content: app.Modal.map.form.bidang({
                        layer, editableLayers,
                        draw: bidangLayer
                     }),
                     title: 'Form Bidang Tanah'
                  });
                  return;
               };

               // ===== JALAN / KANAL (Polyline)
               if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {

                  const warna = layer.options.color;

                  if (warna === 'red') {
                     layer.feature = {
                        type: "Feature",
                        properties: {
                           jenis: "jalan",
                           nama: prompt("Nama Jalan")
                        }
                     };

                     layer.bindPopup(`Jalan: ${layer.feature.properties.nama}`);
                     jalanLayer.addLayer(layer);
                  }

                  if (warna === 'blue') {
                     layer.feature = {
                        type: "Feature",
                        properties: {
                           jenis: "kanal",
                           nama: prompt("Nama Kanal")
                        }
                     };

                     layer.bindPopup(`Kanal: ${layer.feature.properties.nama}`);
                     kanalLayer.addLayer(layer);
                  }
               };

               // ===== MARKER
               if (layer instanceof L.Marker) {

                  const nama = prompt("Nama Lokasi:");
                  const jenis = prompt("Jenis (Kantor / Masjid / Patok / dll):");

                  layer.feature = {
                     type: "Feature",
                     properties: {
                        nama,
                        jenis
                     }
                  };

                  layer.bindPopup(`
                     <b>${nama}</b><br>
                     Jenis: ${jenis}
                     `);

                  markerLayer.addLayer(layer);
               }

               console.log("GeoJSON sekarang:", JSON.stringify(editableLayers.toGeoJSON()));
            });
         },
      });
   },
});