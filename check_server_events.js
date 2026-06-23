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
    } else if (file.endsWith(".tsx")) {
      results.push(file);
    }
  });
  return results;
}

const files = walk("./src/app");
let errors = [];

files.forEach(file => {
  const content = fs.readFileSync(file, "utf8");
  if (!content.includes("\"use client\"") && !content.includes("\x27use client\x27")) {
    if (content.includes("onClick=") || content.includes("onChange=")) {
      errors.push(file);
    }
  }
});

console.log(JSON.stringify(errors));

