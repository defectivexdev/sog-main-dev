import fs from "fs";
import path from "path";

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk("src", function(filePath) {
  if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) {
    if (filePath.includes("auth.ts") || filePath.includes("profile")) return;
    
    let content = fs.readFileSync(filePath, "utf-8");
    let initialContent = content;

    content = content.replace(/session\?\.user\?\.name/g, "(session?.user?.icName || session?.user?.name)");
    content = content.replace(/session\.user\.name/g, "(session.user.icName || session.user.name)");
    content = content.replace(/user\?\.name/g, "(user?.icName || user?.name)");
    content = content.replace(/user\.name/g, "(user.icName || user.name)");

    if (content !== initialContent) {
      fs.writeFileSync(filePath, content, "utf-8");
      console.log("Updated", filePath);
    }
  }
});
