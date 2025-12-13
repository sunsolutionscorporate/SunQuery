// @method-instance
function select(attr) {
   return this.forEach(select => {
      n.helper.expando.set(select, 'attribute', { ...attr, cache: new Map(), lastRequest: null });
   }), this;
}

// @plugins-form
function select() {
   const input = this;
   const attr = n.helper.expando.get(input, 'attribute') || { cache: new Map(), lastRequest: null };
   const ajax = n.helper.isURL(attr?.ajax?.url) ? (({ callback, processResults, ...rest }) => ({ config: rest, callback, processResults }))(attr.ajax) : false;
   const params = { limit: ajax?.config?.limit || 20, offset: ajax?.config?.offset || 0, search: '', page: 1, total_pages: 1, state: false };
   // wrapper utama (tampil di UI)
   const self = n.createElement('div', { class: 'input', html: `<i class="ph ph-caret-down"></i>`, tabindex: 0 });
   const container = n.createElement("div", { class: "select-container" });

   attr.placeholder = [...input.options].find(opt => !opt.value?.trim())?.text;
   // helpers

   const buildCacheKey = () => `${params.search}::${params.offset}`;
   const get_input_val = function () {
      const opt = input.options[input.selectedIndex];
      return { value: opt.value, text: opt.text }
   };
   const set_input_val = function (val, text) {
      let opt = Array.from(input.options).find(o => o.value == val.toString());
      if (opt) {
         // jika option ada ,namun text tidak sama maka lakukan upate text pada option select
         ajax && opt.text !== text && (opt.textContent = text)
      } else {
         // jika option belum ada pada select, maka buat option baru
         opt = new Option(text, val);
         opt.selected = true;
         input.add(opt);
      };
      opt.selected = true;
      set_label();
   };
   const set_label = function () {
      let label = self.querySelector('.input-value');
      if (!label) {
         label = n.createElement('div', { class: 'input-value' });
         self.prepend(label);
      }
      const { value, text } = get_input_val();
      label.textContent = text;
   };
   const get_results = async function () {
      const cahce_key = buildCacheKey();
      if (attr.cache.has(cahce_key)) {
         const cached = attr.cache.get(cahce_key);
         // restore pagination meta agar scroll handler bekerja pada hasil cached
         if (cached?.meta) {
            params.total_pages = cached.meta.total_pages || params.total_pages;
            params.page = cached.meta.page || params.page;
         }
         // cached may store either { items, meta } or plain array (backwards compat)
         return cached.items || cached;
      };
      const get_ajax = async function () {
         attr.lastRequest && attr.lastRequest.abort();
         const ajax_config = {
            ...ajax.config, data: {
               ...typeof ajax.config?.data === 'function' ? ajax.config.data() : ajax.config?.data,
               limit: params.limit,
               offset: params.offset,
               search: params.search || ''
            }
         };

         attr.lastRequest = n.ajax(ajax_config);
         try {
            // await new Promise(res => { })
            const response = await new Promise((resolve, reject) => attr.lastRequest.done(resolve).fail(reject));
            let items = [];
            if (ajax.processResults && typeof ajax.processResults === 'function') {
               if (Array.isArray(response?.data)) items = response.data.map(r => ajax.processResults.call(r, r));
               else if (n.helper.type(response?.data, 'object')) items = [ajax.processResults.call(response.data, response.data)];
            } else if (Array.isArray(response?.data)) {
               items = response.data;
            } else if (Array.isArray(response)) {
               items = response;
            };
            params.total_pages = response?.meta?.total || 1;
            params.page = response?.meta?.page || 1;
            // simpan items + meta ke cache agar scroll dapat melanjutkan dari cache
            attr.cache.set(cahce_key, { items, meta: { total_pages: params.total_pages, page: params.page } });
            return items;
         } catch (err) {
            attr.cache.set(cahce_key, { items: [], meta: { total_pages: params.total_pages, page: params.page } });
            console.error(err);
            return [];
         }
      };
      const get_option = async function () {
         // ambil data dari <option> native, filter berdasarkan params.search,
         // terapkan paging (offset/limit), set meta dan simpan ke cache
         try {
            const all = Array.from(input.options)
               .filter(o => o.value !== "")
               .map(o => ({ value: o.value, text: o.textContent }));
            const term = String(params.search || "").trim().toLowerCase();
            const filtered = term
               ? all.filter(o => String(o.text).toLowerCase().includes(term) || String(o.value).toLowerCase().includes(term))
               : all;

            const total = filtered.length;
            params.total_pages = Math.max(1, Math.ceil(total / params.limit));
            params.page = Math.floor(params.offset / params.limit) + 1;

            const items = filtered.slice(params.offset, params.offset + params.limit);

            // simpan ke cache dengan struktur { items, meta }
            attr.cache.set(cahce_key, { items, meta: { total_pages: params.total_pages, page: params.page } });
            return items;
         } catch (err) {
            // fallback: kosong
            attr.cache.set(cahce_key, { items: [], meta: { total_pages: params.total_pages, page: params.page } });
            console.error(err);
            return [];
         }
      };

      if (ajax) {
         return await get_ajax();
      } else {
         return await get_option();
      }
   };
   const makeItem = function (item) {
      const li = n.createElement("li", { data: { value: item.value }, tabindex: 0 });
      if (!params.search) {
         li.innerHTML = item.text;
         return li;
      }
      const t = String(params.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      li.innerHTML = String(item.text).replace(new RegExp(t, 'ig'), (m) => `<mark>${m}</mark>`);
      return li;
   };
   const on_release = function () {
      n(this).animate({ opacity: [1, 0] }, 250).done(() => {
         this.release();
         n(self).css('opacity', '1');
      });
   };
   const popup_show = function () {
      let context = null;
      let activeIndex = -1;
      container.innerHTML = '';
      const box_search = n.createElement('div', { class: 'select-box-search', html: `<i class="ph ph-magnifying-glass"></i>` });
      const box_content = n.createElement('div', { class: 'select-box-content' });
      const input_search = n.createForm('text', { placeholder: attr.placeholder || 'search...' });
      const box_results = n.createElement('div', { class: 'select-results' });
      const box_spinner_scroll = n.createElement('div', { class: 'select-spinner-scroll', html: `<span>loading...</span>` });
      const box_spinner_load = n.createElement('div', { class: 'select-spinner-load', html: `<span>loading...</span>` });
      box_search.append(input_search)
      container.append(box_search, box_content);

      box_content.append(box_results, box_spinner_scroll);
      function highlight_item(li) {
         const cur = get_input_val();
         if (li.getAttribute('data-value') === cur.value && li.textContent.trim() === cur.text.trim()) {
            return li;
         }
         return null;
      };

      function select_handler(ev) {
         const li = ev.target.closest('li:not(.empty)');
         if (!li) return;
         set_input_val(li.getAttribute("data-value"), li.textContent);
         on_release.call(context);
         n(input).trigger("change");
         self.focus();
      };
      async function scroll_handler(ev) {
         if (box_results.scrollTop + box_results.clientHeight >= box_results.scrollHeight && params.page < params.total_pages && !params.state) {
            params.offset += params.limit;
            n(box_spinner_scroll).show();
            await render(false);
            n(box_spinner_scroll).animate({ opacity: [1, 0] }, 300).done(function () {
               this.hide()

            });
         }
      };
      const searchHandler = n.debounce(() => {
         params.search = input_search.value.trim();
         render(true);
      }, 500);
      function marking_item(dir = 0) {
         const items = Array.from(box_results.querySelectorAll('li:not(.empty)'));
         if (!items.length) return;
         if (dir === 1) {
            activeIndex = Math.min(activeIndex + 1, items.length - 1);
            if (items[activeIndex].matches('.selected')) {
               activeIndex += 1;
            }
         } else if (dir === -1) {
            activeIndex = Math.max(activeIndex - 1, 0);
            if (items[activeIndex].matches('.selected')) {
               activeIndex -= 1;
            }
         } else if (dir === 0) activeIndex = 0;
         items.forEach((it, i) => it.classList.toggle('active', i === activeIndex));
         const current = items[activeIndex];
         if (current) current.scrollIntoView({ block: 'nearest' });
      };
      function key_handler(ev) {
         const key = ev.key;
         // Deteksi karakter yang bisa diketik (huruf, angka, simbol)
         const tag = ev.target.tagName.toLowerCase();
         if (tag === 'input' && ev.target === input_search) {
            const isPrintable = key === 'Backspace' || (key.length === 1 && !ev.ctrlKey && !ev.metaKey && !ev.altKey);
            if (isPrintable) {
               searchHandler();
            } else {
               if (key === 'ArrowDown') {
                  ev.preventDefault();
                  marking_item(1);
               } else if (key === 'ArrowUp') {
                  ev.preventDefault();
                  marking_item(-1);
               } else if (key === 'Enter') {
                  ev.preventDefault();
                  const cur = box_results.querySelector('li.active') || box_results.querySelector('li:not(.empty)');
                  select_handler({ target: cur });
               }
            }
         }
      };

      function clean_up() {
         box_results.removeEventListener('click', select_handler);
         box_results.removeEventListener('scroll', scroll_handler);
         d.removeEventListener('keydown', key_handler);
      };
      async function render(reset = true) {
         if (reset) {
            params.offset = 0;
            box_results.innerHTML = '';
            activeIndex = -1;
            box_results.append(box_spinner_load)
         };
         params.state = true;
         n(input_search).attr('disabled', true);
         const results = await get_results();
         if (reset) box_spinner_load.remove();
         n(input_search).removeAttr('disabled');
         input_search.focus();
         params.state = false;
         if (!results || results.length === 0) {
            if (reset) box_results.innerHTML = `<li class="empty">no results found</li>`;
            return;
         }
         if (!results || results.length === 0) return;
         for (const key of results) {
            const li = makeItem(key);
            if (highlight_item(li)) li.classList.add('selected');
            box_results.appendChild(li);
         };
         return results;
      };
      // event-listener
      box_results.addEventListener('click', select_handler);
      box_results.addEventListener('scroll', scroll_handler);
      container.addEventListener('afterRemove', clean_up);
      d.addEventListener('keydown', key_handler);
      // manager layer
      n.layerManager.define("select2", {
         source: self,
         causeExit: ["onblur", "onfocus"],
         overlay: {
            backdrop: false,
            matchWidth: true,
            attached: true,
            content: container,
            offsetY: -35,
         },
         connected: async function (ev) {
            const target = ev.target;
            if (ev.type === "init") {
               context = ev.context;
               n(context).animate({ opacity: [0, 1] }, 400);
               params.search = '';
               params.limit = ajax?.config?.limit || 20;
               params.offset = ajax?.config?.offset || 0;
               params.page = 1;
               params.total_pages = 1;
               params.state = false;
               n(box_spinner_scroll).hide();
               n(self).css('opacity', '0');
               await render();
               const items = box_results.querySelectorAll(`li`);
               for (const item of items) {
                  if (highlight_item(item)) item.scrollIntoView();
               };
            } else if (ev.type === "click" || ev.type === "escape") {
               on_release.call(this);
               self.focus();
            } else if (ev.type === 'onblur') {
               if (!self.contains(target)) on_release.call(this);
            } else if (ev.type == "onfocus") {
               // 
            }
         }
      });
   };

   // Initialize
   input.insertAdjacentElement('beforebegin', self);
   self.append(input);
   if (n.helper.get_attr_element(input, 'readonly')) self.setAttribute('readonly', '')
   if (n.helper.get_attr_element(input, 'disabled')) self.setAttribute('disabled', '')
   input.setAttribute('shadow', true);
   input.hidden = true;
   set_label();

   input.addEventListener('change', async ev => {
      // log('SELECT CHANGE', ev?.detail?.value);

      if (ev?.detail?.value) {
         if (ajax) {
            if (!typeof ajax?.callback === 'function') return;
            if (typeof ajax?.processResults === 'function') {
               const filt_asg = ajax.callback({ term: ev.detail.value });
               const ajax_config = {
                  ...ajax.config,
                  data: filt_asg,
               };
               delete ajax_config.callback;
               delete ajax_config.processResults;
               n.ajax(ajax_config).done(res => {
                  let data;
                  if (n.helper.type(res?.data, 'array')) {
                     for (const key of res.data) data = ajax.processResults.call(key, key);
                  } else if (n.helper.type(res?.data, 'object')) {
                     data = ajax.processResults.call(res?.data, res?.data)
                  };
                  if (data) set_input_val(data.value, data.text);
               }).fail(err => {
                  console.error(err)
               })
            }
         } else {
            set_input_val(ev.detail.value);
         }
      };
   });
   self.addEventListener('click', () => popup_show());
   self.addEventListener('keydown', (ev) => (ev.key === 'Enter' || ev.key === 'ArrowDown') && popup_show());
   const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
         if (mutation.type === 'attributes') {
            if (n.helper.get_attr_element(mutation.target, 'readonly')) {
               self.setAttribute('readonly', '')
            } else {
               self.removeAttribute('readonly')
            }
            if (n.helper.get_attr_element(mutation.target, 'disabled')) {
               self.setAttribute('disabled', '')
            } else {
               self.removeAttribute('disabled')
            }
         }
      }
   });
   observer.observe(input, { attributes: true, attributeFilter: ['readonly', 'disabled'] });
}