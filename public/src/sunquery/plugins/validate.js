// @method-global
const validation = new function ValidationAPI() {
   this.methods = {
      required: {
         fn: (value) => value.trim() !== '',
         msg: 'Field ini wajib diisi'
      },
   };
   const isHiddenDeep = function (el) {
      if (!el || !(el instanceof HTMLElement)) return true;

      while (el) {
         const style = window.getComputedStyle(el);

         const hiddenByCSS =
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            style.opacity === '0';

         const hiddenByAttr = el.hasAttribute('hidden');

         if (hiddenByCSS || hiddenByAttr) {
            return true;
         }

         el = el.parentElement;
      }

      return false;
   };
   this.validate_field = function (input) {
      const rules = input.getAttribute('rule')?.split(/[| ]+/).map(r => r.trim()).filter(Boolean);
      if (!rules) {
         // hapus flag error jika terdapat element yg tidak memiliki rule
         if (n(input).attr('shadow')) {
            this.showError(input.parentElement, '');
         } else {
            this.showError(input, '');
         }
         return
      };
      // log(input)
      const value = input.value.trim();
      let error = '';
      let target = input;
      for (const rule of rules) {
         const method = this.methods[rule];
         if (method && !method.fn(value, input)) {
            error = input.dataset[`msg${rule.charAt(0).toUpperCase() + rule.slice(1)}`] || method.msg;
            break;
         }
      }


      if (n(input).attr('shadow')) {
         target = input.parentElement;
      }


      if (n.helper.get_attr_element(input, 'disabled') ||
         n.helper.get_attr_element(input, 'readOnly')) {
         this.showError(target, '');
         return true;
      }

      // jika element tersembunyi, maka abaikan error validate
      if (isHiddenDeep(target)) {
         this.showError(target, '');
         return true;
      }
      this.showError(target, error);
      return !error;
   };
   function clearError(input, time = 0) {
      const err = n.helper.expando.get(input, 'error');
      if (err) {
         err.release(time);
         n.helper.expando.remove(input, 'error');
      }
   };
   this.showError = function (input, msg) {
      if (msg) {
         clearError(input);
         input.classList.add('error');
         n.helper.expando.set(input, 'error', q.tooltip({
            timer: 1500,
            target: input,
            // identity: 'form_error',
            content: `<p class="err-msg">${msg}</p>`,
         }));

      } else {
         clearError(input, 300)
         input.classList.remove('error');
      }
   };
   this.validate_form = function (form) {
      let valid = true;
      let firstError = null; // simpan input error pertama
      form.querySelectorAll('[rule]').forEach(input => {
         const isFieldValid = this.validate_field(input);
         if (!isFieldValid) {
            valid = false;
            if (!firstError) firstError = input; // tangkap error pertama
         }
      });
      // jika ada error pertama, scroll ke sana
      if (firstError) {
         setTimeout(() => {
            // jika input tersembunyi karena shadow, gunakan parent
            const target = n(firstError).attr('shadow')
               ? firstError.parentElement
               : firstError;

            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            target.focus?.();
         }, 100); // beri delay kecil agar error message sudah ter-render
      }

      return valid;
   };
};

// @method-static
function validate(options) {
   const form = options?.target;
   if (!(form instanceof HTMLFormElement)) {
      console.error(`[validator] target harus berupa elemen 'form'`);
      return false;
   };
   function fungsi(ev) {
      ev.preventDefault();
      const isValid = validation.validate_form(form);
      if (!isValid) return false;
      if (typeof options?.submit === 'function') {
         options.submit(ev);
      } else {
         form.submit();
      }
   };
   // event submit
   form.addEventListener('submit', fungsi);
   form.addEventListener('input', ({ target }) => validation.validate_field(target));
   form.addEventListener('change', ({ target }) => validation.validate_field(target));
   form.addEventListener('blur', ({ target }) => validation.validate_field(target));
   return form; // return agar bisa chaining kalau perlu;
};
n.validate.addMethod = function (name, fn, msg) { validation.methods[name] = { fn, msg } };
n.validate.addMethod('nik', (value) => {
   return /^\d*$/.test(value) && (value === '' || value.length === 16);
}, 'Harus 0 atau bilangan 16 digit');

n.validate.addMethod('number', (value) => {
   return /^\d+$/.test(value);
}, 'Hanya karakter angka');

n.validate.addMethod('rupiah', (value) => {
   return /^[0-9.,]+$/.test(value);
}, 'Hanya boleh berisi karakter numerik dan titik/koma');
// @method-instance
function validate(options) { return this.forEach(el => q.validate({ ...options, target: el })), this };

