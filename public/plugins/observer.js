// @method-static
function observer(target, options = {}) {
   target = n.helper.type(target, 'string') ? d.querySelectorAll(target) : n.helper.type(target, 'html') ? [target] : n.helper.type(target, 'sunQuery') ? target.get() : null;

   // log(target, options)
   // return
   target.forEach(el => {
      if (!(el instanceof Element)) return;

      const existing = n.helper.expando.get(el, 'observer');
      if (existing) {
         existing.disconnect();
         n.helper.expando.remove(el, 'observer');
      };
      // Konfigurasi observer
      const config = {
         attributes: !!options.attributes,
         childList: !!options.childList,
         subtree: !!options.subtree,
         attributeOldValue: options.attributes ? true : false
      };
      // Jika attributes berupa array → gunakan attributeFilter
      if (Array.isArray(options.attributes)) {
         config.attributes = true;
         config.attributeFilter = options.attributes;
      };
      // Buat observer baru
      const obs = new MutationObserver(mutations => {
         mutations.forEach(m => {
            const detail = {
               target: m.target,
               type: m.type,
               mutation: m
            };

            // 🔸 Perubahan atribut
            if (m.type === "attributes") {
               detail.attrName = m.attributeName;
               detail.oldValue = m.oldValue;
               detail.newValue = m.target.getAttribute(m.attributeName); // nilai baru
               // n(el).trigger("changeAttr", detail);
               EventBase.trigger(el, "changeAttr", detail);
            }

            // 🔸 Penambahan atau penghapusan elemen
            if (m.type === "childList") {
               if (m.addedNodes.length) {
                  detail.added = Array.from(m.addedNodes).filter(n => n.nodeType === 1);
                  if (detail.added.length) {
                     // n(el).trigger("addElement", detail);
                     EventBase.trigger(el, "addElement", detail);
                  }
               }
               if (m.removedNodes.length) {
                  detail.removed = Array.from(m.removedNodes).filter(n => n.nodeType === 1);
                  if (detail.removed.length) {
                     // n(el).trigger("remElement", detail);
                     EventBase.trigger(el, "remElement", detail);
                  }
               }
            }
         });
      });

      // obs.observe(el, config);
      obs.observe(el, { childList: true, subtree: true, attributes: true });
      n.helper.expando.set(el, 'observer', obs);
   })
};

