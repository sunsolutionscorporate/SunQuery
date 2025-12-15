// @method-helper
function formatHash(url) {
   if (!url) return '#/';
   // hapus semua karakter # di depan
   let clean = url.replace(/^#*/, "");
   // pastikan diawali dengan /
   if (!clean.startsWith("/")) {
      clean = "/" + clean;
   }
   return "#" + clean;
};

function formatNumber(value, decimals = 0) {
   // pastikan angka valid
   const num = Number(value);
   if (isNaN(num)) return '0';
   // jika decimals tidak didefinisikan, tampilkan apa adanya
   let fixed = (typeof decimals === 'number')
      ? num.toFixed(decimals)
      : String(num);
   // ubah titik menjadi koma untuk desimal
   let [intPart, decPart] = fixed.split('.');
   // format bagian ribuan dengan titik
   intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
   // gabungkan lagi
   const val = decPart ? `${intPart},${decPart}` : intPart;
   return {
      [Symbol.toPrimitive]() { return val; },
      toString() { return val.toString(); },
      toNumber() { return Number(num); },
      valueOf() { return val; },
      origin() { return num.toString(); }
   };
};

function boxify(val) {
   /**
    * Mengubah array nilai (seperti CSS shorthand) menjadi objek sisi-sisi kotak.
    *
    * Fungsi ini mirip dengan cara CSS menangani shorthand untuk margin/padding.
    * Input berupa array angka (atau nilai lain), dan output berupa objek:
    *   { top, right, bottom, left }
    *
    * Pola konversi mengikuti urutan CSS:
    *   - 1 nilai  → semua sisi sama
    *   - 2 nilai  → [vertical, horizontal]
    *   - 3 nilai  → [top, horizontal, bottom]
    *   - 4 nilai  → [top, right, bottom, left]
    *
    * Contoh:
    *   n.helper.boxify([10])           → {top:10,right:10,bottom:10,left:10}
    *   n.helper.boxify([10,20])        → {top:10,right:20,bottom:10,left:20}
    *   n.helper.boxify([10,20,30])     → {top:10,right:20,bottom:30,left:20}
    *   n.helper.boxify([10,20,30,40])  → {top:10,right:20,bottom:30,left:40}
    *
    * Jika input bukan array valid, hasilnya semua sisi bernilai 0.
    */
   if (!Array.isArray(val)) return { top: 0, right: 0, bottom: 0, left: 0 };

   switch (val.length) {
      case 1:
         return { top: val[0], right: val[0], bottom: val[0], left: val[0] };
      case 2:
         return { top: val[0], right: val[1], bottom: val[0], left: val[1] };
      case 3:
         return { top: val[0], right: val[1], bottom: val[2], left: val[1] };
      case 4:
         return { top: val[0], right: val[1], bottom: val[2], left: val[3] };
      default:
         return { top: 0, right: 0, bottom: 0, left: 0 };
   }
};

function parseColor(value) {
   if (value == null) return null;

   // 1️⃣ Jika array: [R, G, B] atau [R, G, B, A]
   if (Array.isArray(value)) {
      const [r, g = 0, b = 0, a = 1] = value;
      if ([r, g, b].every(v => typeof v === 'number' && v >= 0 && v <= 255) &&
         typeof a === 'number' && a >= 0 && a <= 1) {
         return [r, g, b, a];
      };
   }

   // 2️⃣ Jika numeric tunggal (contoh: 0 → hitam)
   if (typeof value === 'number' && value >= 0) {
      const c = Math.min(255, value);
      return [c, c, c, 1];
   }

   // 3️⃣ Jika string
   if (typeof value === 'string') {
      const val = value.trim().toLowerCase();

      // 🔸 HEX (#RGB, #RRGGBB, #RGBA, #RRGGBBAA)
      const hexMatch = val.match(/^#([a-f0-9]{3,4}|[a-f0-9]{6}|[a-f0-9]{8})$/i);
      if (hexMatch) {
         let hex = hexMatch[1];
         if (hex.length === 3 || hex.length === 4) {
            hex = hex.split('').map(c => c + c).join('');
         }
         const r = parseInt(hex.slice(0, 2), 16);
         const g = parseInt(hex.slice(2, 4), 16);
         const b = parseInt(hex.slice(4, 6), 16);
         const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
         return [r, g, b, a];
      }

      // 🔸 rgb()/rgba()
      const rgbMatch = val.match(/^rgba?\(\s*([^)]+)\)$/);
      if (rgbMatch) {
         const parts = rgbMatch[1].split(',').map(v => v.trim());
         if (parts.length >= 3) {
            const r = parseInt(parts[0]);
            const g = parseInt(parts[1]);
            const b = parseInt(parts[2]);
            const a = parts[3] !== undefined ? parseFloat(parts[3]) : 1;
            if ([r, g, b].every(v => !isNaN(v) && v >= 0 && v <= 255) && a >= 0 && a <= 1) {
               return [r, g, b, a];
            }
         }
      }

      // 🔸 Nama warna CSS (uji pakai canvas agar hasil pasti)
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.fillStyle = val;
      const computed = ctx.fillStyle; // akan jadi format standar "rgb(...)" atau "rgba(...)"
      if (computed && computed.startsWith('rgb')) {
         return n.helper.parseColor(computed); // rekursi ke fungsi yang sama
      }
   }

   // ❌ Tidak cocok format apapun
   return null;
}

function isImageType(mime) {
   return /^image\/[a-z0-9.+-]+$/i.test(mime);
}
