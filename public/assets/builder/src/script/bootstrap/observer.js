function observer(selector, options) {
   const { onAdd = () => { }, onRemove = () => { } } = options;
   const obs = new MutationObserver(mutations => {
      mutations.forEach(m => {
         m.addedNodes.forEach(n => {
            if (n.nodeType !== 1) return;

            if (n.matches?.(selector)) onAdd?.(n);
            n.querySelectorAll?.(selector).forEach(onAdd);
         });

         m.removedNodes.forEach(n => {
            if (n.nodeType !== 1) return;

            if (n.matches?.(selector)) onRemove?.(n);
            n.querySelectorAll?.(selector).forEach(onRemove);
         });

      });
   });
   obs.observe(document.body, { childList: true, subtree: true });
   // initial
   document.querySelectorAll(selector).forEach(onAdd);
   return obs;
}

// pakai:

