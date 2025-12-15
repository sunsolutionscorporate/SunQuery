// @plugins-form

function datetime() {
   const input = this;
   const format = function () {
      const fmt = n.Date(input.value).getInputFormat();
      return fmt.toLowerCase() === 'unknown' ? 'timestamp' : fmt;
   }();
   // Tombol trigger & wrapper input
   const wrap = n.createElement('div', { class: 'input' });
   const self = n.createForm('text', { value: n.Date(input.value).getFormat('DD, d MM YY') });
   const btn_triger = n.createElement('span', { class: 'icon', html: `<i class="ph-fill ph-calendar-dots"></i>` });
   input.insertAdjacentElement('beforebegin', wrap);
   wrap.prepend(self, btn_triger, input);
   input.setAttribute('type', 'text');
   if (n.helper.get_attr_element(input, 'readonly')) {
      wrap.setAttribute('readonly', '')
   }
   if (n.helper.get_attr_element(input, 'disabled')) {
      wrap.setAttribute('disabled', '')
   }
   const attr = n.helper.expando.get(input, 'attribute');
   attr?.rule && input.setAttribute('shadow', true);
   input.hidden = true;
   self.placeholder = input.placeholder;
   input.removeAttribute('placeholder');
   if (n.helper.get_attr_element(input, 'readonly')) {
      self.setAttribute('readonly', '')
   }
   if (n.helper.get_attr_element(input, 'disabled')) {
      self.setAttribute('disabled', '')
   };

   const popup_show = function () {
      const date = input.value ? n.Date(input.value) : n.Date();
      const cur = {
         d: date.getDate(),
         m: date.getMonth(),
         y: date.getYear(),
         stam: date.getTime(),
      };
      const now = n.Date(Date.now());

      const btn_prev = n.createElement('span', { class: 'prev', text: '◀' });
      const title_date = n.createElement('span', { class: 'title', text: 'November 2025' });
      const btn_next = n.createElement('span', { class: 'next', text: '▶' });
      const head = n.createElement('div', { class: 'calendar-head', content: n.createElement('div', { content: [btn_prev, title_date, btn_next] }) });
      const body = n.createElement('div', { class: 'calendar-body' });
      const foot = n.createElement('div', {
         class: 'calendar-foot',
         html: `<span class="">${now.getFormat('d M YY')}</span><p>create by: wahyu_widodo</p>`
      });

      const wrap_main = n.createElement('div', { class: 'calendar-wrap' });
      const wrap_month = n.createElement('div', { class: 'calendar-wrap' });
      const wrap_year = n.createElement('div', { class: 'calendar-wrap' });

      let flag = {
         day_pick: true,
         month_pick: null,
         year_pick: null,
      }, context;

      const render_calendar = function (...args) {
         let [y = date.getYear(), m = date.getMonth(), d = date.getDate()] = args;
         const prevMonth = n.Date(y, m, 0);
         const OfMonth = n.Date(y, m + 1, 0);
         const nextMonth = n.Date(y, m, 1);
         const count = (prevMonth.getDay() === 6 ? 0 : prevMonth.getDay() + 1) + OfMonth.getDate() - nextMonth.getDay();
         const show_days = () => {
            wrap_main.innerHTML = '';
            const btn_day = (text, disabled = false, today = false, selected = false) => {
               const el = n.createElement('li', { text })
               if (selected) {
                  n(el).addClass('active')
               }
               if (today) {
                  n(el).addClass('today')
               }
               if (disabled) {
                  n(el).addClass('disabled')
               }
               return el;
            };
            // membuat daftar hari
            const content_week = function () {
               const div_week = n.createElement('ul');
               n.Date.days.forEach(ar => div_week.children.length < 7 && div_week.appendChild(n.createElement("li", { text: ar.slice(0, 3) })));
               wrap_main.append(div_week);
               return div_week;
            }();
            // membuat tanggal bulan
            const content_days = function () {
               const div_days = n.createElement('ul', { class: 'days-content' });
               // tanggal bulan lalu
               for (let i = 0; i <= prevMonth.getDay(); i++) {
                  if (prevMonth.getDay() === 6) break;
                  const text = prevMonth.getDate() - prevMonth.getDay() + i;
                  const el = btn_day(text, true);
                  n(el).addClass('before');
                  div_days.appendChild(el);
               };
               // tanggal bulan ini
               for (let i = 1; i <= OfMonth.getDate(); i++) {
                  let active = false, isToday = false;
                  if (now.getDate() === i && now.getMonth() === m && now.getYear() === y) {
                     isToday = true
                  };
                  if (cur.m === m && cur.d === i && cur.y === y) {
                     active = true;
                  }
                  const el = btn_day(i, false, isToday, active);
                  div_days.appendChild(el)
               };
               // tanggal bulan depan
               for (let i = nextMonth.getDay(); i < (42 - count); i++) {
                  const text = nextMonth.getDate() - nextMonth.getDay() + i;
                  const el = btn_day(text, true);
                  n(el).addClass('after');
                  div_days.appendChild(el);
               };
               wrap_main.append(div_days);
               return div_days;
            }();
            title_date.textContent = OfMonth.getMonthName() + ' ' + OfMonth.getYear();
         };
         const show_month = function () {
            if (!flag.month_pick) return;
            wrap_month.innerHTML = '';
            const div_month = n.createElement('ul', { class: 'month-content' });
            wrap_month.append(n.createElement('ul'), div_month);
            // 
            n.Date.months.forEach((ar, idx) => {
               const el = n.createElement('li', { text: ar, data: { value: (idx + 1) } });
               div_month.appendChild(el);
            });
            title_date.textContent = OfMonth.getYear();
         };
         const show_year = function () {
            if (!flag.year_pick) return;
            wrap_year.innerHTML = '';
            const div_year = n.createElement('ul', { class: 'year-content' });
            wrap_year.append(n.createElement('ul'), div_year);
            for (let i = y - 6; i < y + 6; i++) {
               const el = n.createElement('li', { text: i, data: { value: i } });
               div_year.appendChild(el);
            };
            title_date.textContent = (y - 6) + '-' + (y + 5)
         };

         show_days();
         show_month();
         show_year();

      };
      body.append(wrap_main);
      body.append(wrap_month);
      body.append(wrap_year);
      n(wrap_main).show();
      n(wrap_month).hide();
      n(wrap_year).hide();

      const release = function () {
         n(this).animate({ opacity: [1, 0] }, 250).done(() => {
            head.remove();
            body.remove();
            foot.remove();
            this.release();
            self.focus();
         })
      };
      render_calendar();
      btn_prev.addEventListener('click', function () {
         if (flag.year_pick) {
            date.setYear(date.getYear() - 12);
         } else if (flag.month_pick) {
            date.setYear(date.getYear() - 1);
         } else {
            date.setMonth(date.getMonth() - 1);
         }
         render_calendar();
      });
      btn_next.addEventListener('click', function () {
         if (flag.year_pick) {
            date.setYear(date.getYear() + 12);
         } else if (flag.month_pick) {
            date.setYear(date.getYear() + 1);
         } else {
            date.setMonth(date.getMonth() + 1);
         }
         render_calendar();
      });
      title_date.addEventListener('click', function () {
         if (flag.day_pick) {
            // tampilan Bulan
            flag.month_pick = true;
            flag.day_pick = false;
            n(wrap_main).animate({ transform: ['scale(1)', 'scale(0.8)'] }, 250);
            n(wrap_month).show();
            n(wrap_month).animate({ opacity: [0, 1], transform: ['scale(0.5)', 'scale(1)'] }, 250).done(() => n(wrap_main).hide())
         } else if (flag.month_pick) {
            // tampilkan tahun
            flag.day_pick = false;
            flag.month_pick = false;
            flag.year_pick = true;
            n(wrap_month).animate({ transform: ['scale(1)', 'scale(0.8)'] }, 250);
            n(wrap_year).animate({ opacity: [0, 1], transform: ['scale(0.5)', 'scale(1)'] }, 250).done(() => n(wrap_month).hide())
            n(wrap_year).show();
            n(wrap_main).hide();
         }
         render_calendar();
      });

      body.addEventListener('click', function ({ target }) {
         const date_sel = target.closest('.days-content>li');
         const month_sel = target.closest('.month-content>li');
         const year_sel = target.closest('.year-content>li');
         if (date_sel) {
            if (target.matches('.before')) {
               date.setMonth(date.getMonth() - 1);
            }
            else if (target.matches('.after')) {
               date.setMonth(date.getMonth() + 1);
            };
            date.setDate(parseInt(n(target).text()));
            n(input).val(format === 'timestamp' ? date.getTime() : date.getFormat(format));
            release.call(context);
         };
         // pilih bulan
         if (month_sel) {
            date.setMonth(parseInt(target.getAttribute('data-value')));
            flag.day_pick = true;
            flag.month_pick = false;
            render_calendar();
            n(wrap_month).animate({ transform: ['scale(1)', 'scale(0.8)'], opacity: [1, 0] }, 250);
            n(wrap_main).animate({ opacity: [0, 1], transform: ['scale(0.5)', 'scale(1)'] }, 250).done(() => n(wrap_month).hide());
            n(wrap_main).show();
         }
         // pilih Tahun
         if (year_sel) {
            date.setYear(parseInt(target.getAttribute('data-value')));
            n(wrap_main).hide();
            flag.day_pick = false;
            flag.month_pick = true;
            flag.year_pick = false;

            n(wrap_year).animate({ transform: ['scale(1)', 'scale(0.8)'], opacity: [1, 0] }, 250);
            n(wrap_month).animate({ opacity: [0, 1], transform: ['scale(0.5)', 'scale(1)'] }, 250)
               .done(() => {
                  n(wrap_year).hide();
               })
            n(wrap_month).show();

            render_calendar();
         }
      });
      foot.addEventListener('click', function ({ target }) {
         if (target.matches('span')) {
            n(input).val(format === 'timestamp' ? now.getTime() : now.getFormat(format));
            release.call(context);
         }
      })


      wrap_main.addEventListener('keydown', ev => {
         try {
            const daysContainer = wrap_main.querySelector('.days-content');
            if (!daysContainer) return;
            // include all day items (allow navigating into before/after if present, but skip disabled)
            const all = Array.from(daysContainer.querySelectorAll('li'));
            if (!all.length) return;
            // current index: prefer nav-focus, then active, else 0
            let idx = all.findIndex(li => li.classList.contains('nav-focus'));
            if (idx === -1) idx = all.findIndex(li => li.classList.contains('active')) || all.findIndex(li => li.textContent == flag.last_nav && !li.classList.contains('before') && !li.classList.contains('after')) || 0;

            if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft' || ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
               ev.preventDefault();
               const step = ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowLeft' ? -1 : ev.key === 'ArrowDown' ? 7 : -7;
               idx = Math.max(0, Math.min(all.length - 1, idx + step));
               // update focus marker
               all.forEach(li => li.classList.remove('nav-focus'));
               const item = all[idx];
               item.classList.add('nav-focus');
               item.scrollIntoView({ block: 'nearest' });
               if (item.matches('.after') || item.matches('.before')) {
                  date.setMonth(date.getMonth() + (item.matches('.after') ? 1 : -1));
                  render_calendar();
                  const li = [...wrap_main.querySelectorAll('.days-content li')].filter(li => !li.classList.contains('before') && !li.classList.contains('after'));
                  for (const key of li) {
                     if (key.textContent === item.textContent) {
                        key.classList.add('nav-focus');
                        break;
                     }
                  }
               }
               return;
            }

            if (ev.key === 'Enter') {
               ev.preventDefault();
               const cur = all[idx] || all[0];
               if (!cur) return;
               // behave same as clicking a date: adjust month if before/after, set date, update input and close
               if (cur.matches('.before')) {
                  date.setMonth(date.getMonth() - 1);
               } else if (cur.matches('.after')) {
                  date.setMonth(date.getMonth() + 1);
               }
               date.setDate(parseInt(cur.textContent, 10));
               n(input).val(format === 'timestamp' ? date.getTime() : date.getFormat(format));
               // close popup using release/context as existing code
               release.call(context);
            }
         } catch (err) {
            console.error(err);
         }
      })

      // manager popup
      n.layerManager.define('date', {
         source: wrap,
         causeExit: ['onblur', 'onfocus'],
         overlay: {
            backdrop: false,
            matchWidth: false,
            attached: true,
            content: [head, body, foot],
            offsetY: 10
         },
         connected(ev) {
            context = ev.context;
            if (ev.type === 'init') {
               context.classList.add("input-calendar");
               n(context).animate({ opacity: [0, 1] }, 400);
               // const items = wrap_main.querySelector('.days-content');
               wrap_main.setAttribute('tabindex', 0);
               wrap_main.focus();
               wrap_main.querySelector('.days-content li.active').classList.add('nav-focus')
            };
            if (ev.type !== 'onfocus' && ev.type !== 'init' && !btn_triger.contains(ev.target)) {
               // Hapus elemen kalender dari DOM agar tidak menumpuk
               release.call(this)
            }
         }
      });
   };
   // 
   btn_triger.addEventListener('click', popup_show);
   self.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' || ev.key === 'ArrowDown') {
         ev.preventDefault();
         popup_show();
      }
   });
   input.addEventListener('change', () => self.value = n.Date(input.value).getFormat('DD, d MM yy'));
   self.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "");
      let out = "";
      if (value.length > 0) {
         const val = value.substring(0, 2);
         out = parseInt(val) < 31 ? val : 31;
      }
      if (value.length >= 3) {
         const val = value.substring(2, 4);
         out += parseInt(val) < 12 ? '-' + val : '-' + 12;
      }
      if (value.length >= 5) out += "-" + value.substring(4, 8);
      e.target.value = out;

      const in_value = n.Date(out);
      const error = in_value.getError();
      // log(format, in_value.getError())
      input.value = error ? '' : (format === 'timestamp' ? n.Date(out).getTime() : n.Date(out).getFormat(format));
   });

   self.addEventListener('focus', () => self.value = n.Date(input.value).getFormat('d-m-yy'))
   self.addEventListener('blur', () => self.value = n.Date(input.value).getFormat('DD, d MM yy'));
   const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
         if (mutation.type === 'attributes') {
            if (n.helper.get_attr_element(mutation.target, 'readonly')) {
               input.closest('.input').setAttribute('readonly', '')
            } else {
               input.closest('.input').removeAttribute('readonly')
            }
            if (n.helper.get_attr_element(mutation.target, 'disabled')) {
               input.closest('.input').setAttribute('disabled', '')
            } else {
               input.closest('.input').removeAttribute('disabled')
            }
         }
      }
   });
   observer.observe(input, { attributes: true, attributeFilter: ['readonly', 'disabled'] });
};