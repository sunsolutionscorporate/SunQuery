const chokidar = require('chokidar');
const path = require('path');
const { spawn } = require('child_process');

const srcCSSDir = path.join(__dirname, '..', 'src', 'css');
const srcJSDir = path.join(__dirname, '..', 'src', 'sunquery');

function buildCSS() {
   return new Promise((resolve, reject) => {
      const child = spawn('node', ['builder/build-css.js'], { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
      child.on('close', (code) => {
         if (code === 0) resolve();
         else reject(new Error('CSS build failed'));
      });
   });
}

function buildJS() {
   return new Promise((resolve, reject) => {
      const child = spawn('node', ['builder/build-sq.js'], { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
      child.on('close', (code) => {
         if (code === 0) resolve();
         else reject(new Error('JS build failed'));
      });
   });
}

async function buildAll() {
   try {
      await Promise.all([buildCSS(), buildJS()]);
      console.log('All builds completed successfully');
   } catch (error) {
      console.error('Build failed:', error.message);
   }
}

const watch = process.argv.includes('--watch');

if (watch) {
   console.log('Starting watch mode...');
   buildAll();

   chokidar.watch([srcCSSDir, srcJSDir], { ignoreInitial: true }).on('all', (event, filePath) => {
      console.log(`File ${event}: ${filePath}`);
      buildAll();
   });
} else {
   buildAll();
}