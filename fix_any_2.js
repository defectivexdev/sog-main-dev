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
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      results.push(file);
    }
  });
  return results;
}

const files = walk("./src");

files.forEach(file => {
  let content = fs.readFileSync(file, "utf8");
  let newContent = content;

  // Replace .map((x, y) =>
  newContent = newContent.replace(/\.map\(\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*\)\s*=>/g, ".map(($1: any, $2: any) =>");
  
  // Replace .forEach((x, y) =>
  newContent = newContent.replace(/\.forEach\(\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*\)\s*=>/g, ".forEach(($1: any, $2: any) =>");

  // Replace .filter((x, y) =>
  newContent = newContent.replace(/\.filter\(\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*\)\s*=>/g, ".filter(($1: any, $2: any) =>");

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, "utf8");
    console.log("Fixed 2 args in " + file);
  }
});

