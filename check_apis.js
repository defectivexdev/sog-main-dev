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
    } else if (file.endsWith("route.ts")) {
      results.push(file);
    }
  });
  return results;
}

const files = walk("./src/app/api");
let suspicious = [];

files.forEach(file => {
  const content = fs.readFileSync(file, "utf8");
  if (!content.includes("try {") && !content.includes("try{")) {
    suspicious.push(file);
  }
});

console.log("APIs missing try/catch:", JSON.stringify(suspicious, null, 2));

