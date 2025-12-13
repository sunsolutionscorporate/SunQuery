// @plugins-form
function number() {
   const input = this;
   const min = isNaN(parseFloat(input.getAttribute('min'))) ? undefined : parseFloat(input.getAttribute('min'));
   const max = isNaN(parseFloat(input.getAttribute('max'))) ? undefined : parseFloat(input.getAttribute('max'));
   const step = parseFloat(input.getAttribute('step') || 1);
   const formatter = n.helper.get_attr_element(input, 'formatter');
   const defaultValue = this.defaultValue;
   const placeholder = input.getAttribute('placeholder');
   const wrap = n.createElement('div', { class: 'input' });
   const self = n.createForm('text', { placeholder: placeholder, value: defaultValue && (formatter ? n.helper.formatNumber(defaultValue, "auto") : defaultValue) });
   const act = n.createElement('span', { class: 'input-number-action', html: `<i class="up ph ph-caret-up"></i><i class="down ph ph-caret-down"></i>` });

   input.insertAdjacentElement('beforebegin', wrap);
   wrap.prepend(self, act, input);
   if (n.helper.get_attr_element(input, 'readonly')) self.setAttribute('readonly', '');
   if (n.helper.get_attr_element(input, 'disabled')) self.setAttribute('disabled', '');
   input.setAttribute('type', 'text');
   input.setAttribute('shadow', true);
   input.hidden = true;
   input.removeAttribute('placeholder');
   input.removeAttribute('step');
   input.removeAttribute('min');
   input.removeAttribute('max');
   input.removeAttribute('formatter');

   Object.defineProperty(input, 'stepUp', {
      value: function StepUp() {
         const raw = dividerValue(this.value, step);
         this.value = raw;
         n(this).trigger('change');
         self.value = sanitizeNumberInput(raw, min, max);
      }
   });
   Object.defineProperty(input, 'stepDown', {
      value: function StepDown() {
         const raw = dividerValue(this.value, -step);
         this.value = raw;
         n(this).trigger('change');
         self.value = sanitizeNumberInput(raw, min, max);
      }
   });
   // piranti

   function dividerValue(value, step) {
      const base = isNaN(parseFloat(value)) ? 0 : parseFloat(value);
      const next = base + step;
      // kembalikan dengan titik sebagai pemisah decimal internal (sanitize akan meng-handle)
      return String(next);
   }

   function formatNumber(num) {
      return n.helper.formatNumber(num, 'auto').toString();
   }

   function sanitizeNumberInput(rawValue, min, max) {
      if (!formatter) {
         let numeric = Number(rawValue);
         if (typeof max !== 'undefined' && numeric > max) return max.toString();
         if (typeof min !== 'undefined' && numeric < min) return min.toString();
         return rawValue;
      }
      // allow temporary states while typing
      if (rawValue === '-' || rawValue === '.' || rawValue === ',' || rawValue === '-,' || rawValue === '-.') return rawValue;

      let cleaned = String(rawValue || '');
      // keep only digits, minus, dot, comma
      cleaned = cleaned.replace(/[^\d\-,.]/g, '');

      // ensure minus only at start
      if ((cleaned.match(/-/g) || []).length > 1 || (cleaned.includes('-') && cleaned.indexOf('-') > 0)) {
         cleaned = cleaned.replace(/-/g, '');
      }

      // normalize decimal separators: decide which char is decimal (last occurring)
      const lastDot = cleaned.lastIndexOf('.');
      const lastComma = cleaned.lastIndexOf(',');
      if (lastDot === -1 && lastComma === -1) {
         // no decimal separators
      } else {
         let decimalChar = null;
         if (lastDot > lastComma) decimalChar = '.';
         else decimalChar = ',';
         // remove all occurrences of the other char, keep decimalChar only for last occurrence
         const other = decimalChar === '.' ? /,/g : /\./g;
         cleaned = cleaned.replace(other, '');
         // if multiple decimalChar, collapse to single (keep last)
         const parts = cleaned.split(decimalChar);
         if (parts.length > 1) {
            const intPart = parts.shift();
            const frac = parts.join('');
            cleaned = intPart + '.' + frac; // use '.' as internal decimal
         } else {
            // single decimalChar -> replace with internal '.'
            cleaned = cleaned.replace(decimalChar, '.');
         }
      }

      // if user typed trailing dot like "12." keep it as "12."
      if (cleaned.endsWith('.')) {
         const intPart = cleaned.slice(0, -1);
         const n = parseFloat(intPart);
         const formattedInt = isNaN(n) ? (intPart || '') : formatNumber(Math.trunc(n));
         return formattedInt + '.';
      }

      // empty or lone minus
      if (cleaned === '' || cleaned === '-') return cleaned;

      const numeric = parseFloat(cleaned);
      if (isNaN(numeric)) return cleaned;

      if (typeof max !== 'undefined' && numeric > max) return formatNumber(max);
      if (typeof min !== 'undefined' && numeric < min) return formatNumber(min);

      return formatNumber(numeric);
   }
   /**
    * hapus karakter '.' dan ubah karakter ',' menjadi '.'
    * @param {*} str 
    * @returns 
    */
   function normalizeNumberString(str) {
      str = String(str || '').replace(/[^\d.,]/g, ''); // buang karakter aneh
      return str.replace(/\./g, '').replace(',', '.');
   }

   self.addEventListener('input', function () {
      const raw = this.value;
      const normal = normalizeNumberString(raw);

      const parts = raw.split(',');
      if (parts.length > 2) {
         // Gabungkan hanya bagian sebelum koma kedua
         input.value = normal.replace(/\,/g, '');
         n(input).trigger('change');
         this.value = parts.slice(0, 2).join(',');
         return
      };
      const hadTrailingComma = raw.endsWith(',');
      const hadTrailingDot = raw.endsWith('.');
      const usedComma = raw.indexOf(',') !== -1;
      let sanitized = sanitizeNumberInput(normal, min, max);

      if (usedComma && !sanitized.includes(',')) {
         const lastDot = sanitized.lastIndexOf('.');
         if (lastDot !== -1) sanitized = sanitized.slice(0, lastDot) + ',' + sanitized.slice(lastDot + 1);
      }
      if (hadTrailingComma && !sanitized.endsWith(',')) sanitized = sanitized + ',';
      if (hadTrailingDot && !sanitized.endsWith('.')) sanitized = sanitized + '.';

      input.value = normalizeNumberString(sanitized);
      n(input).trigger('change');
      this.value = sanitized;
   });
   self.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowUp') {
         ev.preventDefault();
         input.stepUp();
      } else if (ev.key === 'ArrowDown') {
         ev.preventDefault();
         input.stepDown();
      }
   });
   act.addEventListener('click', (ev) => {
      if (ev.target.classList.contains('up')) {
         input.stepUp();
      } else if (ev.target.classList.contains('down')) {
         input.stepDown();
      }
   });
   input.addEventListener('change', () => self.value = input.value && (formatter ? n.helper.formatNumber(input.value, "auto") : input.value));
}