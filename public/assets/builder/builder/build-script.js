const fs = require('fs-extra');
const path = require('path');
const { minify } = require('terser');

const srcDir = path.join(__dirname, '..', 'src', 'script');
const outputDir = path.join(__dirname, '..', '..', 'dist');
const outputFile = path.join(outputDir, 'main.js');
const outputFileMin = path.join(outputDir, 'main.min.js');

function readFolderScripts(folder) {
   const folderPath = path.join(srcDir, folder);
   if (!fs.existsSync(folderPath)) return '';
   const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
   let content = '';
   for (const file of files) {
      const filePath = path.join(folderPath, file);
      content += fs.readFileSync(filePath, 'utf-8') + '\n';
   }
   return content;
}

async function buildScript() {
   try {
      // Read base index.js
      const basePath = path.join(srcDir, 'index.js');
      let baseContent = fs.readFileSync(basePath, 'utf-8');

      // Define folder order
      const folders = [
         { name: 'ui', label: 'KODE BLOK UI' },
         { name: 'pages', label: 'KODE BLOK PAGES' },
         { name: 'letters', label: 'KODE BLOK LETTERS' },
         { name: 'bootstrap', label: 'KODE BLOK KERNEL' }
      ];

      // Build replacement content
      let replacement = '';
      for (const folder of folders) {
         const content = readFolderScripts(folder.name);
         replacement += `
   //////////////////////////////////////////
   ////////// ${folder.label} ////////////////
   //////////////////////////////////////////
${content}`;
      }
      replacement += `
   // kode penutup`;

      // Replace the placeholder in base content
      baseContent = baseContent.replace('   // kode penutup', replacement);

      // Ensure output directory exists
      await fs.ensureDir(outputDir);

      // Write unminified JS
      await fs.writeFile(outputFile, baseContent);

      // Minify JS
      const minified = await minify(baseContent);

      // Write minified JS
      await fs.writeFile(outputFileMin, minified.code);

      console.log('script built successfully:', outputFile, 'and', outputFileMin);
   } catch (error) {
      console.error('Error building script:', error);
   }
}

buildScript();