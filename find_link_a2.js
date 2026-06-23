const fs = require("fs");
const content = fs.readFileSync("src/components/Navbar.tsx", "utf8");
const regex = /<Link[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/Link>/gi;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log("Found at index:", match.index);
  console.log(match[0]);
}

