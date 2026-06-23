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
    } else if (file.endsWith(".tsx") || file.endsWith(".jsx")) {
      results.push(file);
    }
  });
  return results;
}

const files = walk("./src");
let linkWithA = [];

files.forEach(file => {
  const content = fs.readFileSync(file, "utf8");
  // Basic regex to find <Link ...> <a ...> ... </a> </Link>
  if (content.match(/<Link[^>]*>[\s\S]*?<a[^>]*>/i)) {
    linkWithA.push(file);
  }
});

console.log("Files with <a> inside <Link>:", JSON.stringify(linkWithA, null, 2));

