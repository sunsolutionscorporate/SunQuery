import fs from "fs";
import path from "path";
import { minify } from "terser";

function getExportGlobalValues(str) {
   const match = str.match(/([\s\S]*?)\/\/@export_global([\s\S]*)/);

   const base = match ? match[1].trim() : str.trim();
   const foot = match ? '\n\n      /********************** @GLOBAL_EXPORT ***********************************/\n      ' + match[2].trim() : '';

   return {
      base, foot
   }
}
function extractTagName(str) {
   const match = str.match(/^\s*\/\/\s*@([\w\-]+)/);
   return match ? match[1] : null;
}
function splitByTag(str) {
   const lines = str.split(/\r?\n/);
   const result = [];
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
            result.push({ tag: currentTag, code: buffer.join('\n').trim() });
         }
         currentTag = tag;
         buffer = []; // ← baris tag tidak ikut masuk
      } else {
         if (currentTag) buffer.push(line);
      }
   }

   if (currentTag && buffer.length) {
      result.push({ tag: currentTag, code: buffer.join('\n').trim() });
   }

   return result;

}

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
      methods,
      remaining: code.trim()
   };
};

class Method_handler {
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
   };
   constructor(type) {
      this.#state = true;
      this.#type = type;
      this.#dir = this.#map_type[type].head;
      // this.#child = '\n';
   }
   write(code) {
      if (!this.#state) return this;
      if (!code) return this;
      if (this.#type === 'method-global') {
         code = code.endsWith('\n') ? code : code + '\n';
      } else {
         code = code.endsWith('\n') ? code : code + ',\n';
      }
      this.#dir += code;
      return this;
   }
   addChild(code) {
      if (!this.#child) {
         this.#child = '\n';
      }
      code = code.endsWith('\n') ? code : code + '\n';
      this.#child += code;
      return this;
   }
   end() {
      this.#dir += this.#map_type[this.#type].foot;
      if (this.#child) {
         this.#dir += this.#child;
         this.#child = undefined;
      }
      this.#state = false;
      return this.#dir;
   }
};
const method_global = new Method_handler('method-global');
const method_static = new Method_handler('method-static');
const method_instance = new Method_handler('method-instance');
const method_helper = new Method_handler('method-helper');
const method_plugForm = new Method_handler('plugins-form');
const method_common = new Method_handler('method-common');

const instance_src = {
   method_global: new Method_handler('method-global'),
   method_static: new Method_handler('method-static'),
   method_instance: new Method_handler('method-instance'),
   method_helper: new Method_handler('method-helper'),
   method_plugForm: new Method_handler('plugins-form'),
   method_common: new Method_handler('method-common'),
};

const log = console.log;
// Baca package.json untuk metadata
const pkg = JSON.parse(fs.readFileSync("./package.json", "utf8"));
// Path utama
const SRC_DIR = "./src";
const EXTENSION_DIR = "./extensions";
const HELPER_DIR = "./helpers";
const PLUGIN_DIR = "./plugins";
const DIST_DIR = "./dist";
const OUTPUT_FILE = path.join(DIST_DIR, "sunquery.js");
const MIN_FILE = path.join(DIST_DIR, "sunquery.min.js");

// Banner otomatis dari package.json
const banner = `/*!
 * ${pkg.name}.js v${pkg.version}
 * ${pkg.description}
 * (c) ${new Date().getFullYear()} ${pkg.author}
 * Released under the ${pkg.license} License.
 */
`;
if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });
// 1️⃣ Ambil core
let output = fs.readFileSync(path.join(SRC_DIR, "core.js"), "utf8");
const core_code = getExportGlobalValues(output);
output = core_code.base;

// ambil common
let code_common = fs.readFileSync(path.join(SRC_DIR, "common.js"), "utf8");
code_common = splitByTag(code_common);
code_common.forEach(ar => {
   log(instance_src[ar.tag.replace(/-/g, '_')])
})
// code_common = method_common.write(code_common);
// log(method_common.end())





// 2️⃣ Tambahkan semua helper
const helperFiles = fs.readdirSync(HELPER_DIR).filter(f => f.endsWith(".js"));
for (const file of helperFiles) {
   let code = fs.readFileSync(path.join(HELPER_DIR, file), "utf8");
   code = convertFunctionsToMethods(code);
   method_helper.write(code.methods);
}
// 3️⃣ Tambahkan semua extrension
const extensionFiles = fs.readdirSync(EXTENSION_DIR).filter(f => f.endsWith(".js"));
for (const file of extensionFiles) {
   let code = fs.readFileSync(path.join(EXTENSION_DIR, file), "utf8");
   const methods = convertFunctionsToMethods(code);
   if (file === 'instances.js') {
      // output += `\n\n/********************** @INSTANCE_METHOD [${file}] ******************/`
      // jika methods kosong, fallback: sisipkan file mentah (atau laporkan)
      if (!methods.methods.trim()) {
         console.log(`⚠️ Extension ${file} tidak berisi function top-level. Menyisipkan apa adanya.`);
         output += `\n(function(n){\n${code}\n})(n);`;
      } else {
         // output += `\nn.fn.extend({\n${methods.methods}\n});`;
         method_instance.write(methods.methods);
      }
   }
   if (file === 'statics.js') {
      // jika methods kosong, fallback: sisipkan file mentah (atau laporkan)
      if (!methods.methods.trim()) {
         console.log(`⚠️ Extension ${file} tidak berisi function top-level. Menyisipkan apa adanya.`);
         output += `\n(function(n){\n${code}\n})(n);`;
      } else {
         method_static.write(methods.methods);
      }
      method_static.addChild(methods.remaining);
   }
};

const pluginFiles = fs.readdirSync(PLUGIN_DIR).filter(f => f.endsWith(".js"))
for (const file of pluginFiles) {
   let block = fs.readFileSync(path.join(PLUGIN_DIR, file), "utf8");
   block = splitByTag(block)
   block.forEach(ar => {
      let code = convertFunctionsToMethods(ar.code);
      if (ar.tag === 'method-static') {
         // console.log(ar.code.methods)
         method_static.write(code.methods.trim());
         method_static.addChild(code.remaining);
      }
      if (ar.tag === 'method-instance') {
         // console.log(ar.code.methods)
         method_instance.write(code.methods.trim());
         method_instance.addChild(code.remaining);
      }
      if (ar.tag === 'method-global') {
         // console.log(ar.code.methods)
         method_global.write(ar.code.trim());
         // method_global.addChild(ar.code.remaining);
      }
      if (ar.tag === 'plugins-form') {
         // console.log(ar.code.methods)
         method_plugForm.write(code.methods.trim());
         // method_global.addChild(ar.code.remaining);
      }
   })
};

output += method_global.end();
output += method_helper.end();
output += method_instance.end();
output += method_static.end();
output += method_plugForm.end();

output += core_code.foot
// 3️⃣ Tambahkan banner di awal
output = banner + "\n" + output;
// 4️⃣ Simpan hasil build
fs.writeFileSync(OUTPUT_FILE, output, "utf8");
console.log(`✅ Build selesai! ${extensionFiles.length} extension`);
console.log(`                  ${helperFiles.length} helper`);
console.log(`                  ${pluginFiles.length} plugin`);
// 5️⃣ Lanjut minify otomatis
(async () => {
   try {
      const result = await minify(output, {
         compress: {
            drop_console: false,
         },
         mangle: true,
         output: {
            comments: /^!/, // hanya simpan banner yang diawali /*!
         },
      });

      fs.writeFileSync(MIN_FILE, result.code, "utf8");
      console.log(`✨ Minified: dist/sunquery.min.js (${(result.code.length / 1024).toFixed(2)} KB)`);
   } catch (err) {
      console.error("❌ Gagal minify:", err);
   }
})();
