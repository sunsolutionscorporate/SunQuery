const fs = require('fs-extra');
const path = require('path');
const { minify } = require('terser');

const srcDir = path.join(__dirname, '..', 'src', 'sunquery');
const outputDir = path.join(__dirname, '..', '..', 'dist');
const outputFile = path.join(outputDir, 'sunquery.js');
const outputFileMin = path.join(outputDir, 'sunquery.min.js');

async function readFilesFromDir(dir) {
   const files = await fs.readdir(dir);
   const jsFiles = files.filter(file => file.endsWith('.js'));
   let content = '';
   for (const file of jsFiles) {
      const filePath = path.join(dir, file);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      content += fileContent + '\n';
   }
   return content;
};


const SRC_DIR = "src/sunquery";
const EXTENSION_DIR = "src/sunquery/extensions";
const HELPER_DIR = "src/sunquery/helpers";
const PLUGIN_DIR = "src/sunquery/plugins";
function convertFunctionsToMethods(code) {
   let i = 0;
   const L = code.length;
   const outParts = [];
   const rangesToRemove = [];
   let bufferNonFunc = '';

   const isIdStart = ch => /[A-Za-z$_]/.test(ch);
   const isId = ch => /[A-Za-z0-9$_]/.test(ch);

   const flushComments = text => {
      const comments = text.split(/\r?\n/).filter(line => /^\s*(\/\/|\/\*)/.test(line)).join('\n');
      if (comments) outParts.push(comments);
   };

   while (i < L) {
      // --- Skip whitespace & comments ---
      if (/\s/.test(code[i])) { bufferNonFunc += code[i++]; continue; }
      if (code.startsWith('//', i)) {
         const j = code.indexOf('\n', i);
         bufferNonFunc += code.slice(i, j === -1 ? L : j + 1);
         i = j === -1 ? L : j + 1;
         continue;
      }
      if (code.startsWith('/*', i)) {
         const j = code.indexOf('*/', i + 2);
         bufferNonFunc += code.slice(i, j === -1 ? L : j + 2);
         i = j === -1 ? L : j + 2;
         continue;
      }

      // --- 1️⃣ Cek pola "const name = new function" ---
      if (code.startsWith('const', i) || code.startsWith('let', i) || code.startsWith('var', i)) {
         let k = i;
         // skip const/let/var
         while (k < L && !/\s/.test(code[k])) k++;
         while (k < L && /\s/.test(code[k])) k++;
         // ambil nama
         if (k < L && isIdStart(code[k])) {
            const nameStart = k;
            while (k < L && isId(code[k])) k++;
            const name = code.slice(nameStart, k);
            while (k < L && /\s/.test(code[k])) k++;
            // cek apakah " = new function"
            if (code.startsWith('=', k)) {
               k++;
               while (k < L && /\s/.test(code[k])) k++;
               if (code.startsWith('new function', k) || code.startsWith('new class', k) || code.startsWith('function', k)) {
                  // flush comment dulu
                  flushComments(bufferNonFunc);
                  bufferNonFunc = '';

                  // ambil isi function hingga kurung kurawal seimbang
                  let braceDepth = 0, j = k;
                  while (j < L) {
                     const ch = code[j];
                     if (ch === '{') braceDepth++;
                     else if (ch === '}') {
                        braceDepth--;
                        if (braceDepth === 0) { j++; break; }
                     } else if (ch === '"' || ch === "'" || ch === '`') {
                        const quote = ch;
                        j++;
                        while (j < L && code[j] !== quote) {
                           if (code[j] === '\\') j++;
                           j++;
                        }
                        j++;
                        continue;
                     }
                     j++;
                  }
                  const body = code.slice(k, j);
                  outParts.push(`${name}: ${body}`);
                  rangesToRemove.push([i, j]); // i = awal, j = akhir blok
                  i = j;
                  continue;
               }
            }
         }
      }

      // If current char begins something other than 'function' (or 'async function'), treat as non-func top-level content
      // Detect optional "async" + whitespace + "function"
      let start = i;
      let asyncPrefix = '';
      if (code.startsWith('async', i) && /\s/.test(code[i + 5] || '')) {
         // tentative async; ensure next non-space is "function"
         let k = i + 5;
         while (k < L && /\s/.test(code[k])) k++;
         if (code.startsWith('function', k) && /\s/.test(code[k + 8] || '')) {
            asyncPrefix = 'async';
            i = k; // move i to 'function'
         }
      }

      // try match 'function' at position i
      if (code.startsWith('function', i)) {
         // ensure it's a function declaration with a name: `function <name>(`
         let k = i + 8;
         // skip whitespace
         while (k < L && /\s/.test(code[k])) k++;
         // now read identifier name
         if (k < L && isIdStart(code[k])) {
            let nameStart = k;
            k++;
            while (k < L && isId(code[k])) k++;
            const name = code.slice(nameStart, k);
            // skip whitespace to '('
            while (k < L && /\s/.test(code[k])) k++;
            if (k < L && code[k] === '(') {
               // Found top-level function declaration; first flush any buffered non-function text into outParts (optional)
               if (bufferNonFunc.trim()) {
                  // If there's non-function stuff, we might ignore or keep; for safety keep as comment to not break object literal.
                  // But since we are building methods block only, we'll drop bufferNonFunc except comments.
                  // Here we'll keep comments (lines starting with // or /*) in outParts as-is.
                  const commentsOnly = bufferNonFunc.split(/\r?\n/).filter(line => /^\s*(\/\/|\/\*)/.test(line)).join('\n');
                  if (commentsOnly) outParts.push(commentsOnly);
               }
               bufferNonFunc = '';

               // find matching ')' for params (handle nested parentheses in default values)
               let paramsStart = k;
               let pDepth = 0;
               let j = k;
               while (j < L) {
                  const ch = code[j];
                  if (ch === '(') pDepth++;
                  else if (ch === ')') {
                     pDepth--;
                     if (pDepth === 0) { j++; break; }
                  } else if (ch === '"' || ch === "'" || ch === '`') {
                     // skip string literal safely
                     const quote = ch;
                     j++;
                     while (j < L) {
                        if (code[j] === '\\') j += 2;
                        else if (code[j] === quote) { j++; break; }
                        else j++;
                     }
                     continue;
                  } else if (code.startsWith('//', j)) {
                     // skip single-line comment
                     j = code.indexOf('\n', j);
                     if (j === -1) { j = L; break; }
                     continue;
                  } else if (code.startsWith('/*', j)) {
                     j = code.indexOf('*/', j + 2);
                     if (j === -1) { j = L; break; }
                     j += 2;
                     continue;
                  }
                  j++;
               }
               const paramsAndClose = code.slice(paramsStart, j); // includes closing ')'

               // skip whitespace to body start '{'
               while (j < L && /\s/.test(code[j])) j++;
               if (j >= L || code[j] !== '{') {
                  // malformed; bail: treat as non-function text
                  bufferNonFunc += code.slice(i, j);
                  i = j;
                  continue;
               }

               // now capture the body by counting braces
               let bodyStart = j;
               let bDepth = 0;
               let m = j;
               while (m < L) {
                  const ch = code[m];
                  if (ch === '{') {
                     bDepth++;
                     m++;
                     continue;
                  } else if (ch === '}') {
                     bDepth--;
                     m++;
                     if (bDepth === 0) break; // closed function body
                     continue;
                  } else if (ch === '"' || ch === "'" || ch === '`') {
                     // skip string
                     const quote = ch;
                     m++;
                     while (m < L) {
                        if (code[m] === '\\') m += 2;
                        else if (code[m] === quote) { m++; break; }
                        else m++;
                     }
                     continue;
                  } else if (code.startsWith('//', m)) {
                     // skip single-line comment
                     m = code.indexOf('\n', m);
                     if (m === -1) { m = L; break; }
                     continue;
                  } else if (code.startsWith('/*', m)) {
                     m = code.indexOf('*/', m + 2);
                     if (m === -1) { m = L; break; }
                     m += 2;
                     continue;
                  }
                  m++;
               }
               const body = code.slice(bodyStart, m); // includes braces

               // Build method string
               const asyncStr = asyncPrefix ? (asyncPrefix + ' ') : '';
               const method = `${asyncStr}${name}${paramsAndClose} ${body}`;

               outParts.push(method.trim());
               rangesToRemove.push([start, m]); // start = awal fungsi, m = akhir blok

               // advance i to m (end of function)
               i = m;
               // reset any asyncPrefix
               asyncPrefix = '';
               continue;
            }
         }
      }

      // jika tidak match apa pun
      bufferNonFunc += code[i];
      i++
   }

   // gabungkan hasil
   const methods = outParts.map(s => s.trim()).filter(s => s.length > 0).join(',\n');
   // Hapus bagian yang sudah diproses dari code
   if (rangesToRemove.length > 0) {
      rangesToRemove.sort((a, b) => a[0] - b[0]);
      const merged = [];
      for (const [start, end] of rangesToRemove) {
         if (!merged.length || merged[merged.length - 1][1] < start) {
            merged.push([start, end]);
         } else {
            merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], end);
         }
      }

      let last = 0;
      const keptParts = [];
      for (const [start, end] of merged) {
         if (last < start) keptParts.push(code.slice(last, start));
         last = end;
      }
      if (last < code.length) keptParts.push(code.slice(last));
      code = keptParts.join('');
      code = code
         .split(/\r?\n/)
         .map(line => line.trim())
         .filter(line => line && line !== ';')
         .join('\n');
   }

   // console.log((code.trim()))
   // return methods;
   return {
      code: methods,
      remaining: code.trim()
   };
};
class CoreReader {
   #dir;
   #child;
   #state;
   #type;
   #map_type = {
      'plugins-form': {
         head: `\nn.plugin('form', {\n`,
         foot: '\n});'
      },
      'method-static': {
         head: '\nn.extend(n,{\n',
         foot: '\n});'
      },
      'method-instance': {
         head: '\nn.fn.extend({\n',
         foot: '\n});'
      },
      'method-helper': {
         head: '\naddHelper({\n',
         foot: '\n});'
      },
      'method-global': {
         head: '\n// method-global\n',
         foot: '// end method-global\n'
      },
      'method-common': {
         head: '\n// method-common\n',
         foot: '// end method-common\n'
      },
      'method-export': {
         head: '\n// method-export\n',
         foot: '\n'
      },
   };
   #removeNewlines(str) { return str.replace(/[\r\n]+$/, '') };
   constructor(type) {
      this.#state = true;
      this.#type = type;
      // this.#dir = this.#map_type[type].head;
      this.#dir = '';
      // this.#child = '\n';
   }
   write(code) {
      if (!this.#state) return this;
      if (!code) return this;
      if (this.#type === 'method-global' || this.#type === 'method-common' || this.#type === 'method-export') {
         code = code.endsWith('\n') ? code : code + '\n';
      } else {
         const blok = convertFunctionsToMethods(code);
         code = this.#removeNewlines(blok.code);
         code = code.endsWith('\n') ? code : code + ',\n';
         this.addChild(blok.remaining);
      }
      this.#dir += code;
      return this;
   }
   //masukkan code ke baris sebelumnya
   shift(code) {
      if (!this.#state) return this;
      if (!code) return this;
      if (this.#type === 'method-global' || this.#type === 'method-common' || this.#type === 'method-export') {
         code = code.endsWith('\n') ? code : code + '\n';
      } else {
         code = code.endsWith('\n') ? code : code + ',\n';
      }
      this.#dir = code + this.#dir;
      return this;
   };

   addChild(code) {
      if (!code) return this;
      if (!this.#child) {
         this.#child = '\n';
      }
      code = code.endsWith('\n') ? code : code + '\n';
      this.#child += code;
      return this;
   }
   end() {
      // this.#dir += this.#map_type[this.#type].foot;
      this.#dir = this.#map_type[this.#type].head + '' + this.#dir + '' + this.#map_type[this.#type].foot
      if (this.#child) {
         this.#dir += this.#child;
         this.#child = undefined;
      }
      this.#state = false;
      return this.#dir;
   };

   static splitTag(str) {
      const lines = str.split(/\r?\n/);
      const results = [];
      const remain = [];
      let currentTag = null;
      let buffer = [];

      const isTagLine = line => {
         const match = line.match(/^\s*\/\/\s*@([\w\-]+)/);
         return match ? match[1] : null;
      };

      for (const line of lines) {
         const tag = isTagLine(line);
         if (tag) {
            if (currentTag && buffer.length) {
               results.push({ tag: currentTag, code: buffer.join('\n').trim() });
            }
            currentTag = tag;
            buffer = [];
         } else {
            if (currentTag) {
               buffer.push(line);
            } else {
               remain.push(line);
            }
         }
      }

      // Tangani buffer terakhir
      if (currentTag && buffer.length) {
         results.push({ tag: currentTag, code: buffer.join('\n').trim() });
      } else if (!currentTag && buffer.length) {
         remain.push(...buffer);
      }

      return {
         remain: remain.join('\n').trim(),
         results
      };
   }
};
const code_instance = {
   method_global: new CoreReader('method-global'),
   method_static: new CoreReader('method-static'),
   method_instance: new CoreReader('method-instance'),
   method_helper: new CoreReader('method-helper'),
   plugins_form: new CoreReader('plugins-form'),
   // method_common: new CoreReader('method-common'),
   method_export: new CoreReader('method-export'),
};

async function buildJS() {
   try {
      // // Read template
      // const template = await fs.readFile(path.join(srcDir, 'index.js'), 'utf-8');

      // // Read sections
      // const helpersContent = await readFilesFromDir(path.join(srcDir, 'helpers'));
      // const staticsContent = await readFilesFromDir(path.join(srcDir, 'statics'));
      // const instancesContent = await readFilesFromDir(path.join(srcDir, 'instances'));
      // const pluginsContent = await readFilesFromDir(path.join(srcDir, 'plugins'));

      // // Replace placeholders by inserting content after them
      // let result = template
      //    .replace(/(\/\/ kumpulan dari file helper)/, '$1\n\n' + helpersContent.trim())
      //    .replace(/(\/\/ kumpulan dari statics)/, '$1\n\n' + staticsContent.trim())
      //    .replace(/(\/\/ kumpulan dari instances)/, '$1\n\n' + instancesContent.trim())
      //    .replace(/(\/\/ kumpulan dari plugins)/, '$1\n\n' + pluginsContent.trim());


      // 1️) Ambil core
      const blok_core = CoreReader.splitTag(fs.readFileSync(path.join(SRC_DIR, "index.js"), "utf8"));
      let output = blok_core.remain;
      blok_core.results.forEach(ar => {
         const tag = ar.tag.replace(/-/g, '_');
         code_instance[tag].write(ar.code);
      });
      // 2) ambil helper
      const helperFiles = fs.readdirSync(HELPER_DIR).filter(f => f.endsWith(".js"));
      for (const file of helperFiles) {
         let blok_helper = CoreReader.splitTag(fs.readFileSync(path.join(HELPER_DIR, file), "utf8"));
         blok_helper.results.forEach(ar => {
            const tag = ar.tag.replace(/-/g, '_');
            code_instance[tag].write(ar.code);
         })
      }

      // 3) ambil extension
      const extensionfiles = fs.readdirSync(EXTENSION_DIR).filter(f => f.endsWith(".js"));
      for (const file of extensionfiles) {
         let blok_extension = CoreReader.splitTag(fs.readFileSync(path.join(EXTENSION_DIR, file), "utf8"));
         blok_extension.results.forEach(ar => {
            const tag = ar.tag.replace(/-/g, '_');
            code_instance[tag].write(ar.code);
         })
      }

      // 4) ambil plugins
      const pluginfiles = fs.readdirSync(PLUGIN_DIR).filter(f => f.endsWith(".js"));
      for (const file of pluginfiles) {
         let blok_plugin = CoreReader.splitTag(fs.readFileSync(path.join(PLUGIN_DIR, file), "utf8"));
         blok_plugin.results.forEach(ar => {
            const tag = ar.tag.replace(/-/g, '_');
            code_instance[tag].write(ar.code);
         })
      };

      // 
      // output += code_instance.method_common.end();
      output += code_instance.method_global.end();
      output += code_instance.method_helper.end();
      output += code_instance.method_instance.end();
      output += code_instance.method_static.end();
      output += code_instance.plugins_form.end();
      output += code_instance.method_export.end();


      // Ensure output directory exists
      await fs.ensureDir(outputDir);

      // Write unminified
      await fs.writeFile(outputFile, output);

      // Minify
      const minified = await minify(output, {
         compress: {
            drop_console: false,
         },
         mangle: true,
         output: {
            comments: /^!/, // hanya simpan banner yang diawali /*!
         },
      });
      await fs.writeFile(outputFileMin, minified.code);

      console.log('JS built successfully:', outputFile, 'and', outputFileMin);
   } catch (error) {
      console.error('Error building JS:', error);
   }
}

buildJS();