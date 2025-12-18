// @method-static

function modal(options) {
   options = {
      header: null,
      dismiss: {
         esc: true,
         backdrop: true
      },
      ...options
   };

   const
      removeDismiss = (str) => str.replace(/\bdismiss(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'<>]+))?/ig, "").replace(/\s+/g, " ").trim(),
      action_close = function (modal, backdrop) {
         n(modal).animate({
            transform: ['translateY(0%)', 'translateY(-5%)'],
            opacity: [1, 0]
         }, 300).done(() => {
            this.release();
            n(backdrop).animate({ opacity: [1, 0] }, 100).done(() => backdrop.remove())
         });
      },
      render = function (attr) {
         attr.content = n.createElement('div', { class: 'body', html: attr.content });
         attr.content.querySelectorAll('.body').forEach(child => child.classList.remove('body'));

         n.layerManager.define("modal", {
            source: attr?.source,
            overlay: {
               backdrop: true,
               matchWidth: false,
               attached: false,
               content: attr.content
            },
            connected: function (ev) {
               const overlay = ev.context;
               const backdrop = overlay.parentElement;
               if (ev.type === 'init') {
                  overlay.classList.add("modal");
                  overlay.classList.add(n.helper.normalizeSize(attr?.size));
                  attr.header && overlay.insertAdjacentElement('afterbegin', attr.header);
                  backdrop.addEventListener('click', ({ target }) => {
                     if (target.matches('.backdrop')) {
                        n(overlay).animate([{ transform: "scale(1)" }, { transform: "scale(1.02)" }, { transform: "scale(0.97)" }, { transform: "scale(1)" }], { duration: 400, easing: "ease-in-out" });
                        return;
                     };
                     if (target.closest('[dismiss="modal"]')) {
                        action_close.call(this, overlay, backdrop)
                     }
                  })
               };
               if (ev.type === "escape") {
                  action_close.call(this, overlay, backdrop)
               };
            }
         });
      }

   if (options?.header) {
      let title = options?.header?.title;
      let close = options?.header?.close;
      if (typeof title === 'string') {
         title = removeDismiss(title)?.trim();
         title = `<span class="modal-title">${title}</span>`
      } else {
         title = undefined;
      };

      if (title) {
         if (close != false) {
            title += `<div class="toolbar"><button class="btn-icon btn-danger" dismiss="modal"><i class="ph ph-x"></i></buton></div>`;
         }
         options.header = n.createElement('div', {
            class: 'header',
            html: title
         });
         title = options.header.querySelector('.modal-title');
         title.removeAttribute('dismiss');
      }

   }

   let content = options?.content;
   if (n.helper.isURL(content)) {
      n.ajax({
         url: content,
         success: function (data) {
            content = data;
            render({ ...options, content });
         },
         error: function (err) {
            console.error(`[🖥️Modal] Ajax Request : ${err}`);
         }
      });
   } else {
      render(options);
   }



}