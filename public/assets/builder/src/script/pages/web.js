app.view({
   web: function (sss) {
      // log(buildURL('/assets/images/logo.png'))
      const isi = [
         {
            head: 'distribusi penduduk',
            type: 'doughnut',
            data: {
               labels: ["0-17 tahun", "18-35 tahun", "36-55 tahun", "56+ tahun"],
               datasets: [{
                  label: "Jumlah Penduduk",
                  data: [3125, 4375, 3125, 1875],
                  backgroundColor: ["#6366f1", "#10b981", "#f59e0b", "#ef4444"],
                  borderWidth: 0,
               },],
            },
            options: {
               responsive: true,
               maintainAspectRatio: false,
               plugins: {
                  legend: {
                     position: "bottom",
                     labels: {
                        color: "#a3a8ad",
                        padding: 20,
                        usePointStyle: true,
                     },
                  },
               },
               scales: {
                  y: {
                     beginAtZero: true,
                     grid: {
                        color: "rgba(255,255,255,0.1)",
                     },
                     ticks: {
                        color: "#a3a8ad",
                     },
                  },
                  x: {
                     grid: {
                        color: "rgba(255,255,255,0.1)",
                     },
                     ticks: {
                        color: "#a3a8ad",
                     },
                  },
               },
            },
         },
         {
            head: 'Anggaran Desa',
            type: 'bar',
            data: {
               labels: ["Pemasukan", "Pengeluaran"],
               datasets: [{
                  label: "Anggaran (Rp Juta)",
                  data: [2500, 2250],
                  backgroundColor: ["#10b981", "#ef4444"],
                  borderWidth: 0,
               },],
            },
            options: {
               responsive: true,
               maintainAspectRatio: false,
               plugins: {
                  legend: {
                     display: false,
                  },
               },
               scales: {
                  y: {
                     beginAtZero: true,
                     grid: {
                        color: "rgba(255,255,255,0.1)",
                     },
                     ticks: {
                        color: "#a3a8ad",
                     },
                  },
                  x: {
                     grid: {
                        color: "rgba(255,255,255,0.1)",
                     },
                     ticks: {
                        color: "#a3a8ad",
                     },
                  },
               },
            },
         },
         {
            head: 'Pajak PBB',
            type: 'line',
            data: {
               labels: ["2020", "2021", "2022", "2023", "2024"],
               datasets: [{
                  label: "Pajak PBB (Rp Juta)",
                  data: [50, 55, 60, 58, 62],
                  borderColor: "#9b59b6",
                  fill: false,
               },],
            },
            options: {
               responsive: true,
               maintainAspectRatio: false,
               plugins: {
                  legend: {
                     display: false,
                  },
               },
               scales: {
                  y: {
                     beginAtZero: true,
                     grid: {
                        color: "rgba(255,255,255,0.1)",
                     },
                     ticks: {
                        color: "#a3a8ad",
                     },
                  },
                  x: {
                     grid: {
                        color: "rgba(255,255,255,0.1)",
                     },
                     ticks: {
                        color: "#a3a8ad",
                     },
                  },
               },
            },
         },
         {
            head: 'Aparatur Desa',
            type: 'bar',
            data: {
               labels: ["Kepala Desa", "Sekretaris", "Kaur", "Kadus", "BPD"],
               datasets: [{
                  label: "Jumlah Aparatur",
                  data: [1, 1, 3, 5, 7],
                  backgroundColor: "#34495e",
               },],
            },
            options: {
               responsive: true,
               maintainAspectRatio: false,
               plugins: {
                  legend: {
                     display: false,
                  },
               },
               scales: {
                  y: {
                     beginAtZero: true,
                     grid: {
                        color: "rgba(255,255,255,0.1)",
                     },
                     ticks: {
                        color: "#a3a8ad",
                     },
                  },
                  x: {
                     grid: {
                        color: "rgba(255,255,255,0.1)",
                     },
                     ticks: {
                        color: "#a3a8ad",
                     },
                  },
               },
            },
         },
      ];
      const section = n.app.UI.component.section();
      section.addHead(`<h1 class="center">Data & Statistik Desa</h1>`);
      isi.forEach(item => {
         const chart = n.app.UI.component.chart({
            type: item.type,
            data: item.data,
            options: item.options
         });
         const card = n.app.UI.component.card()
            .addHead(item.head)
            .addContent(chart)
         section.addContent(card);
      });

      return section;
   },
});