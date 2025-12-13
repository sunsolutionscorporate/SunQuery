// @method-static


function Date(...args) {
   n.Date.days;
   n.Date.months;
   const OFFSET = 7 * 60 * 60 * 1000; // +7 jam
   const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
   const isLeap = y => (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
   let inputFormat = 'unknown';
   function normalize(y, m, d, h, min, s) {
      while (m > 12) { m -= 12; y++; }
      while (m < 1) { m += 12; y--; }
      let mdays = monthDays.slice();
      if (isLeap(y)) mdays[1] = 29;
      while (d > mdays[m - 1]) { d -= mdays[m - 1]; m++; if (m > 12) { m = 1; y++; if (isLeap(y)) mdays[1] = 29; else mdays[1] = 28; } }
      while (d < 1) { m--; if (m < 1) { m = 12; y--; if (isLeap(y)) mdays[1] = 29; else mdays[1] = 28; } d += mdays[m - 1]; }
      return [y, m, d, h, min, s];
   };

   function detec_str_format(s) {
      // === 3) Format umum: tanggal saja atau tanggal + waktu ===
      // Pola: 3 kelompok angka tanggal + opsional waktu
      const dateTimeMatch = s.match(
         /^(\d{1,4})(\D+)(\d{1,2})(\D+)(\d{1,4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/
      );
      // if (!dateTimeMatch) throw new Error("Format tanggal tidak dikenali");
      if (!dateTimeMatch) return;
      const [, a, sep1, b, sep2, c, h, m, sec] = dateTimeMatch;
      // === 4) Tentukan urutan ===
      let baseFormat = null;

      if (a.length === 4 && b.length <= 2 && c.length <= 2) {
         baseFormat = `YY${sep1}m${sep2}d`;
      } else if (c.length === 4 && a.length <= 2 && b.length <= 2) {
         baseFormat = `d${sep1}m${sep2}YY`;
      } else {
         // throw new Error("Format tanggal tidak dikenali atau tidak didukung");
         return;
      }
      // === 5) Tambahkan waktu jika ada ===
      if (h !== undefined && m !== undefined) {
         if (sec !== undefined) {
            return { d: a, m: b, y: c, h: h || 0, min: m || 0, s: sec || 0, format: `${baseFormat} h:ms:s` };
         } else {
            return { d: a, m: b, y: c, h: h || 0, min: m || 0, s: sec || 0, format: `${baseFormat} h:ms` };
         }
      }
      return {
         d: a, m: b, y: c, h: h || 0, min: m || 0, s: sec || 0, format: baseFormat
      };
   }

   // --- Penambahan parsing argumen ---
   function parseArgs(args) {
      if (args.length === 0) {
         // Tanpa argumen, gunakan waktu sekarang
         inputFormat = 'timestamp';
         return fromTimestamp(Date.now());
      }
      let arg = args[0];
      // Timestamp (number)
      if (args.length === 1 && typeof args[0] === 'number' && !isNaN(arg)) {
         inputFormat = 'timestamp';
         return arg;
      }
      // String: "dd-mm-yyyy" atau "yyyy-mm-dd" atau "dd/mm/yyyy" atau ISO
      if (typeof arg === 'string') {
         // TimeStamp
         if (/^\d{10,13}$/.test(arg)) {
            inputFormat = 'timestamp';
            return Number(arg)
         }
         // Coba ISO
         // Manual ISO parsing (tanpa Date())
         let isoMatch = arg.match(
            /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/
         );
         if (isoMatch) {
            let [, y, m, d, h = 0, min = 0, s = 0] = isoMatch;
            inputFormat = 'iso';
            return normalize(
               Number(y),
               Number(m),
               Number(d),
               Number(h),
               Number(min),
               Number(s)
            );
         };
         const str = detec_str_format(arg);
         if (str) {
            inputFormat = str.format;
            return normalize(Number(str.y), Number(str.m), Number(str.d), Number(str.h), Number(str.min), Number(str.s));
         }
         // Format "dd-mm-yyyy" atau "dd/mm/yyyy"
         // let match = arg.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
         // if (match) {
         //   let [, d, m, y, h = 0, min = 0, s = 0] = match;
         //   y = y.length === 2 ? '20' + y : y;
         //   return normalize(Number(y), Number(m), Number(d), Number(h), Number(min), Number(s));
         // }
         // // Format "yyyy-mm-dd"
         // match = arg.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
         // if (match) {
         //   let [, y, m, d, h = 0, min = 0, s = 0] = match;
         //   return normalize(Number(y), Number(m), Number(d), Number(h), Number(min), Number(s));
         // }
      }

      // Array: [y, m, d, h, min, s]
      if (Array.isArray(arg)) {
         return normalize(
            arg[0] || 1970,
            arg[1] || 1,
            arg[2] || 0,
            arg[3] || 0,
            arg[4] || 0,
            arg[5] || 0
         );
      }
      // Multiple argumen: y, m, d, h, min, s
      if (args.length >= 3) {
         return normalize(
            args[0] || 1970,
            args[1] || 1,
            args[2] || 0,
            args[3] || 0,
            args[4] || 0,
            args[5] || 0
         );
      }
      // Fallback: waktu sekarang
      error = true;
      // return fromTimestamp(Date.now());
   }

   function toTimestamp(y, m, d, h, min, s) {
      let days = 0;
      for (let yr = 1970; yr < y; yr++) days += isLeap(yr) ? 366 : 365;
      const mdays = monthDays.slice(0, m - 1).reduce((a, b) => a + b, 0);
      days += mdays + (d - 1);
      if (isLeap(y) && m > 2) days += 1;
      return days * 24 * 60 * 60 * 1000 + h * 60 * 60 * 1000 + min * 60 * 1000 + s * 1000 - OFFSET;
   }
   function fromTimestamp(ts) {
      ts += OFFSET;
      let days = Math.floor(ts / (24 * 60 * 60 * 1000));
      let rem = ts % (24 * 60 * 60 * 1000);

      let h = Math.floor(rem / (60 * 60 * 1000));
      rem %= 60 * 60 * 1000;
      let min = Math.floor(rem / (60 * 1000));
      rem %= 60 * 1000;
      let s = Math.floor(rem / 1000);

      let year = 1970;
      while (true) {
         const dy = isLeap(year) ? 366 : 365;
         if (days >= dy) { days -= dy; year++ } else break;
      }
      const mdays = monthDays.slice();
      if (isLeap(year)) mdays[1] = 29;
      let month = 0;
      while (days >= mdays[month]) { days -= mdays[month]; month++; }
      let dd = days + 1;
      return { y: year, m: month + 1, d: dd, h, min, s };
   };

   let value = { y: 1970, m: 1, d: 1, h: 0, min: 0, s: 0 };
   let stamp = 0;
   let error = false;

   // --- Gunakan parseArgs baru ---
   try {
      // log(args)
      value = parseArgs(args);
      if (n.helper.type(value, 'array')) {
         stamp = toTimestamp(...value);
      } else if (n.helper.type(value, 'object')) {
         stamp = toTimestamp(value.y, value.m, value.d, value.h, value.min, value.s);
      } else if (n.helper.type(value, 'number')) {
         stamp = value;
      }
      // log(value, args)
      value = fromTimestamp(stamp);
   } catch (e) {
      console.error(`[Date]`, e)
   }

   function updateFromValue() {
      if (error) return;
      [value.y, value.m, value.d, value.h, value.min, value.s] = normalize(value.y, value.m, value.d, value.h, value.min, value.s);
      stamp = toTimestamp(value.y, value.m, value.d, value.h, value.min, value.s);
      value = fromTimestamp(stamp);
   }
   function updateFromStamp() {
      if (error) return;
      value = fromTimestamp(stamp);
   }
   const validate = res => error ? '' : res;

   return {
      [Symbol.toPrimitive]() { return validate(stamp); },
      toString() { return validate(this.getFormat()); },
      valueOf() { return validate(stamp); },
      getDay() {
         let y = value.y, m = value.m, d = value.d;
         if (m < 3) { m += 12; y--; }
         let h = (d + Math.floor((13 * (m + 1)) / 5) + y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400)) % 7;
         return validate((h + 6) % 7);
      },
      getDayName() { return validate(n.Date.days[this.getDay()]); },
      getDate() { return validate(value.d); },
      getMonth() { return validate(value.m); }, // tetap 1-based
      getMonthName() { return validate(n.Date.months[value.m - 1]); },
      getYear() { return validate(value.y); },
      getHours() { return validate(value.h); },
      getMinutes() { return validate(value.min); },
      getSeconds() { return validate(value.s); },
      getFormat(fmt = 'DD, d-M-YY h:ms:s') {
         if (isNaN(stamp) || error) return '';
         const map = {
            'DD': this.getDayName(),
            'D': this.getDay() ? this.getDayName().slice(0, 3) : this.getDayName().slice(0, 4),
            'd': String(this.getDate()).padStart(2, '0'),
            'MM': this.getMonthName(),
            'M': this.getMonthName().slice(0, 3),
            'm': String(this.getMonth()).padStart(2, '0'),
            'YY': String(this.getYear()).padStart(4, '0'),
            'yy': String(this.getYear()).padStart(4, '0'),
            'Y': String(this.getYear()).slice(-2),
            'y': String(this.getYear()).slice(-2),
            'h': String(this.getHours()).padStart(2, '0'),
            'ms': String(this.getMinutes()).padStart(2, '0'),
            's': String(this.getSeconds()).padStart(2, '0'),
         };
         const tokens = Object.keys(map).sort((a, b) => b.length - a.length);
         const regex = new RegExp(tokens.join('|'), 'g');
         return fmt.replace(regex, t => map[t]);
      },
      getInputFormat() { return inputFormat; },
      setDate(val) { value.d = val; updateFromValue(); },
      setMonth(val) { value.m = val; updateFromValue(); },
      setYear(val) { value.y = val; updateFromValue(); },
      setHours(val) { value.h = val; updateFromValue(); },
      setMinutes(val) { value.min = val; updateFromValue(); },
      setSeconds(val) { value.s = val; updateFromValue(); },
      addDays(n) { stamp += n * 24 * 60 * 60 * 1000; updateFromStamp(); },
      addMonths(n) { value.m += n; updateFromValue(); },
      addYears(n) { value.y += n; updateFromValue(); },
      toLocaleString() { return validate(this.toString()); },
      getTime() { return validate(stamp); },
      setTime(ts) { stamp = ts; updateFromStamp(); },
      getAge(x = '') {
         // Ambil tanggal lahir dari instance
         // log(this.toString())
         const now = n.Date();
         let age = now.getYear() - this.getYear();
         const mDiff = now.getMonth() - this.getMonth();
         const dDiff = now.getDate() - this.getDate();
         if (mDiff < 0 || (mDiff === 0 && dDiff < 0)) age--;

         return validate(age + ' ' + x);
      },
      // Mengembalikan objek detail: usia (tahun, bulan, hari), tanggal lahir, timestamp, dan format string.
      getBirthInfo(format = 'DD, d MM yy') {
         const now = n.Date();
         let years = now.getYear() - this.getYear();
         let months = now.getMonth() - this.getMonth();
         let days = now.getDate() - this.getDate();
         if (days < 0) {
            months--;
            days += n.Date(now.getYear(), now.getMonth(), 0).getDate();
         }
         if (months < 0) {
            years--;
            months += 12;
         }
         return {
            age: years,
            years,
            months,
            days,
            date: this.getFormat(format),
            timestamp: this.getTime()
         };
      },
      // ...existing code...
      add(obj = {}) {
         if (obj.years) this.addYears(obj.years);
         if (obj.months) this.addMonths(obj.months);
         if (obj.days) this.addDays(obj.days);
         if (obj.hours) this.setHours(this.getHours() + obj.hours);
         if (obj.minutes) this.setMinutes(this.getMinutes() + obj.minutes);
         if (obj.seconds) this.setSeconds(this.getSeconds() + obj.seconds);
         return this;
      },
      substract(obj = {}) {
         if (obj.years) this.addYears(-obj.years);
         if (obj.months) this.addMonths(-obj.months);
         if (obj.days) this.addDays(-obj.days);
         if (obj.hours) this.setHours(this.getHours() - obj.hours);
         if (obj.minutes) this.setMinutes(this.getMinutes() - obj.minutes);
         if (obj.seconds) this.setSeconds(this.getSeconds() - obj.seconds);
         return this;
      },
      toObject() {
         return {
            year: this.getYear(),
            month: this.getMonth(),
            date: this.getDate(),
            hours: this.getHours(),
            minutes: this.getMinutes(),
            seconds: this.getSeconds(),
            timestamp: this.getTime()
         };
      },
      diff(other, unit = 'days') {
         const t1 = this.getTime();
         const t2 = n.Date(other).getTime();
         const diffMs = t1 - t2;
         if (unit === 'days') return Math.floor(diffMs / (24 * 60 * 60 * 1000));
         if (unit === 'months') {
            return (this.getYear() - n.Date(other).getYear()) * 12 + (this.getMonth() - n.Date(other).getMonth());
         }
         if (unit === 'years') return this.getYear() - n.Date(other).getYear();
         if (unit === 'seconds') return Math.floor(diffMs / 1000);
         if (unit === 'minutes') return Math.floor(diffMs / (60 * 1000));
         if (unit === 'hours') return Math.floor(diffMs / (60 * 60 * 1000));
         return diffMs;
      },
      diffDays(other) {
         return this.diff(other, 'days');
      },
      diffMonths(other) {
         return this.diff(other, 'months');
      },
      diffYears(other) {
         return this.diff(other, 'years');
      },
      getError() { return error },
      // ...existing code...
   };
}

n.Date.days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
n.Date.months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];