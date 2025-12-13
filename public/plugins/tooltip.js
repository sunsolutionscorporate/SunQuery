// @method-static
function tooltip(options) {
   if (n.helper.type(options?.target, 'string')) {
      // jika target adalah string, maka ambil elemen dengan selector yang sesuai
      options.target = d.querySelector(options?.target);
   } else if (n.helper.type(options?.target, 'html')) {
      options.target = options.target;
   } else if (n.helper.type(options?.target, 'sunQuery')) {
      options.target = options.target[0];
   } else {
      console.error(`[tooltip] target must be a string, html or sunQuery`);
      return;
   };
   if (!options?.content) {
      console.error(`[tooltip] content must be a string, html, stringHtml, url, or sunQuery`);
      return;
   }
   if (options?.identity) {
      if (options.target.parentElement.querySelector('[data-identity="' + options.identity + '"]')) {
         return;
      }
   }
   const identity = options?.identity || '';
   let content = options.content;
   let request;
   const visible = n.helper.getVisibleRect(options.target);
   if (!visible) {
      console.error(`[tooltip] target must be visible`);
      return;
   };

   const tooltip = n.createElement('div', { class: 'tooltip' });
   function onRelease(time = 0) {
      if (time) {
         n(tooltip).animate({ opacity: [1, 0] }, 300).done(() => tooltip.remove());
      } else {
         tooltip.remove();
      }
      if (request) {
         request.abort();
      };
   }

   async function render() {
      if (n.helper.isURL(content)) {
         request = n.ajax({ url: content });
         content = await request;
      };
      if (identity) {
         tooltip.setAttribute('data-identity', identity);
      }
      options.target.insertAdjacentElement('afterend', tooltip);


      if (n.helper.type(content, 'stringHtml')) {
         content = n.helper.toHTML(content);
      }
      if (n.helper.type(content, 'sunQuery')) {
         content = content.get();
      };

      if (n.helper.type(content, 'array')) {
         content.forEach(el => tooltip.append(el));
      } else if (n.helper.type(content, 'string')) {
         tooltip.innerHTML = content;
      } else {
         console.error(`[tooltip] content not supported`);
      };

      const rect = n.helper.getVisibleRect(tooltip);
      tooltip.style.position = 'fixed';
      tooltip.style.left = `${visible.right - rect.width - 5}px`;
      tooltip.style.top = `${visible.y}px`;
      tooltip.style.zIndex = '1';//n.face.index();

      n(tooltip).addClass('pos-top');
      tooltip.style.top = `${visible.y - rect.height - 7}px`;

      await new Promise(res => setTimeout(() => res(), options?.timer || 1000));
      onRelease(300);
   };
   render();
   return {
      release: tm => onRelease(tm),
   };
}