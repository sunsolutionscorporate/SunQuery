const fs = require('fs-extra');
const path = require('path');
const CleanCSS = require('clean-css');

const srcDir = path.join(__dirname, '..', 'src', 'css');
const outputDir = path.join(__dirname, '..', '..', 'dist');
const outputFile = path.join(outputDir, 'sunquery.css');
const outputFileMin = path.join(outputDir, 'sunquery.min.css');

async function buildCSS() {
   try {
      // Read all CSS files
      const files = await fs.readdir(srcDir);
      const cssFiles = files.filter(file => file.endsWith('.css'));

      let cssContent = '';
      for (const file of cssFiles) {
         const filePath = path.join(srcDir, file);
         const content = await fs.readFile(filePath, 'utf-8');
         cssContent += content + '\n';
      }

      // Ensure output directory exists
      await fs.ensureDir(outputDir);

      // Write unminified CSS
      await fs.writeFile(outputFile, cssContent);

      // Minify CSS
      const minified = new CleanCSS().minify(cssContent);

      // Write minified CSS
      await fs.writeFile(outputFileMin, minified.styles);

      console.log('CSS built successfully:', outputFile, 'and', outputFileMin);
   } catch (error) {
      console.error('Error building CSS:', error);
   }
}

buildCSS();