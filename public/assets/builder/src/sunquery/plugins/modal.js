// @method-static

function modal(options) {
   const
      attr = {
         title: typeof options?.title === 'string' && options.title,
         bar: null,
      },
      action_close = function (modal, backdrop) {
         n(modal).animate({
            transform: ['translateY(0%)', 'translateY(-5%)'],
            opacity: [1, 0]
         }, 300).done(() => {
            this.release();
            n(backdrop).animate({ opacity: [1, 0] }, 100).done(() => backdrop.remove())
         });
      };
   if (attr.title) {
      attr.bar = n.createElement('div', {
         class: 'overlay-bar',
         html: `<span>${attr.title}</span>`
      })
   };

   n.layerManager.define("modal", {
      source: options?.source,
      overlay: {
         backdrop: true,
         matchWidth: false,
         attached: false,
         content: options?.content
      },
      connected: function (ev) {
         const overlay = ev.context;
         const backdrop = overlay.parentElement;
         if (ev.type === 'init') {
            overlay.classList.add("modal");
            overlay.classList.add(n.helper.normalizeSize(options?.size));
            attr.bar && overlay.insertAdjacentElement('afterbegin', attr.bar);
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