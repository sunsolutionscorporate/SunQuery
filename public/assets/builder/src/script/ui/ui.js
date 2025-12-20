const UI = function () {

};

UI.prototype.component = new function () {
   this.section = function () {
      const section = n.createElement('section');

      Object.defineProperty(section, 'addHead', {
         value: function (element) {
            let head = this.querySelector('.head');
            if (!head) {
               head = n.createElement('div', { class: 'head' });
               this.append(head);
               attach(head, element);
            }
            return this;
         }
      });

      Object.defineProperty(section, 'addContent', {
         value: function (element) {
            let body = this.querySelector('.body');
            if (!body) {
               body = n.createElement('div', { class: 'body' });
               this.append(body);
            };
            attach(body, element);
            return this;
         }
      });

      Object.defineProperty(section, 'toArray', {
         value: function () {
            return [this];
         }
      });

      return section;
   };
   this.card = function () {
      const card = n.createElement('div', { class: 'card' });

      Object.defineProperty(card, 'addHead', {
         value: function (element) {
            let head = this.querySelector('.head');
            if (!head) {
               head = n.createElement('h3', { class: 'head' });
               this.append(head);
            }
            attach(head, element);
            return this;
         }
      });

      Object.defineProperty(card, 'addContent', {
         value: function (element) {
            let body = this.querySelector('.body');
            if (!body) {
               body = n.createElement('div', { class: 'body' });
               this.append(body);
            }
            attach(body, element);
            return this;
         }
      });

      Object.defineProperty(card, 'toArray', {
         value: function () {
            return [this];
         }
      });

      return card;
   };
   this.chart = function (config) {
      if (!config?.type) {
         throw new Error("[chart] 'type' must be valid");
      }
      if (!config?.data) {
         throw new Error("[chart] 'data' must be valid");
      }
      const chart = n.createElement('canvas');

      new Chart(chart, {
         type: config.type,
         data: config.data,
         options: config?.options || {},
      });

      Object.defineProperty(chart, 'toArray', {
         value: function () {
            return [this];
         }
      });

      return chart;
   };

   this.form = function () {

   };
}