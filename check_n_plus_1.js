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
  const content = fs.readFileSync(file, "utf8");
  // Very rough heuristic: look for ".map(" followed by "await prisma" or "for (" followed by "await prisma"
  if (content.match(/\.map\([^)]*\)\s*=>\s*{[^}]*await prisma/)) {
    console.log("Potential N+1 in map:", file);
  }
  if (content.match(/for\s*\([^)]*\)\s*{[^}]*await prisma/)) {
    console.log("Potential N+1 in for:", file);
  }
});
console.log("N+1 Check Complete.");

