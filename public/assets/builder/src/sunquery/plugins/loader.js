// @method-static

function loader_old(options) {
   // sunQuery,html,string
   options = { ...n.loader._global_config, ...options };
   let target;
   if (n.helper.type(options?.target, 'string')) {
      target = d.querySelector(options?.target);
   } else if (n.helper.type(options?.target, 'html')) {
      target = options?.target;
   } else if (n.helper.type(options?.target, 'sunQuery')) {
      target = options?.target[0];
   } else {
      console.error(`[loader] target '${options?.target}' not found on page`);
      return;
   }
   const id = n.helper.generateUniqueId(5);
   const wrap = n.createElement('div', { class: 'loader', id: id });
   const spin = n.createElement('div', { class: 'spinner' });
   const title = n.createElement('div', { class: 'title', content: options?.title || '' });
   spin.append(title);
   const ind = n.createElement('h2', { text: options?.text || 'loading...' })
   wrap.append(spin, ind);
   n(target).append(wrap);
   n(wrap).css("z-index", n.face.index());
   return wrap;
};
function loader(options) {
   // sunQuery,html,string
   options = { ...n.loader._global_config, ...options };
   let target;
   if (n.helper.type(options?.target, 'string')) {
      target = d.querySelector(options?.target);
   } else if (n.helper.type(options?.target, 'html')) {
      target = options?.target;
   } else if (n.helper.type(options?.target, 'sunQuery')) {
      target = options?.target[0];
   } else {
      console.error(`[loader] target '${options?.target}' not found on page`);
      return;
   }
   const id = n.helper.generateUniqueId(5);
   const wrap = n.createElement('div', { class: 'loader', id: id });
   const logo = options?.logo ?
      n.createElement('img', { alt: 'logo', src: options.logo }) :
      n.createElement('span', { text: 'loading...' });
   const dot = n.createElement('div', { class: 'loader-dots', html: `<span></span><span></span><span></span>` });

   wrap.append(logo, dot);
   n(target).append(wrap);
   n(wrap).css("z-index", n.face.index());
   return wrap;
};
n.loader.setup = function (config) { n.loader._global_config = config || {}; };

// @method-instance

function loader(options) {
   return this.forEach(el => n.loader({ target: el, ...options })), this;
};
function stopLoader() {
   this.forEach(el => {
      el.querySelectorAll('.loader').forEach(loader => n(loader).animate({ opacity: [1, 0] }, 500).done(() => loader.remove()));
   })
};