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

  // Replace .map(x =>
  newContent = newContent.replace(/\.map\(\s*([a-zA-Z0-9_]+)\s*=>/g, ".map(($1: any) =>");
  
  // Replace .forEach(x =>
  newContent = newContent.replace(/\.forEach\(\s*([a-zA-Z0-9_]+)\s*=>/g, ".forEach(($1: any) =>");

  // Replace .filter(x =>
  newContent = newContent.replace(/\.filter\(\s*([a-zA-Z0-9_]+)\s*=>/g, ".filter(($1: any) =>");

  // Replace .sort((a, b) =>
  newContent = newContent.replace(/\.sort\(\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*\)\s*=>/g, ".sort(($1: any, $2: any) =>");

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, "utf8");
    console.log("Fixed " + file);
  }
});

