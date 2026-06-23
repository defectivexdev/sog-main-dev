const fs = require("fs");
const path = require("path");

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith("page.tsx")) {
      results.push(file);
    }
  });
  return results;
}

const files = walk("./src/app");
files.forEach(file => {
  const content = fs.readFileSync(file, "utf8");
  const match = content.match(/export default (async )?function ([a-z][a-zA-Z0-9_]*)/);
  if (match) {
    console.log("Lowercase export:", file, "=>", match[2]);
  }
});

