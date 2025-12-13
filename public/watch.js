import { watch } from "fs";
import { exec } from "child_process";

let building = false;

function build() {
   if (building) return;
   building = true;

   exec("node build.js", (err, stdout, stderr) => {
      console.clear();
      console.log("🔁 Rebuilding...");
      if (err) console.error(stderr);
      else console.log(stdout);
      building = false;
   });
}

console.log("👀 Watching src/ and plugins/ for changes...");
build(); // build pertama kali

watch("./src", { recursive: true }, build);
watch("./extensions", { recursive: true }, build);
watch("./helpers", { recursive: true }, build);
watch("./plugins", { recursive: true }, build);
