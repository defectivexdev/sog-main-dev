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
  if (!filePath.endsWith(".ts") && !filePath.endsWith(".tsx")) return;
  
  let content = fs.readFileSync(filePath, "utf-8");
  let initialContent = content;

  // Fix the deeply mangled pattern:
  // (session.user.icName || (session.user.icName || session.(user.icName || user.name)))
  content = content.replace(
    /\(session\.user\.icName \|\| \(session\.user\.icName \|\| session\.\(user\.icName \|\| user\.name\)\)\)/g,
    "(session.user.icName || session.user.name)"
  );

  // Fix: (user?.icName || (user?.icName || user?.name))
  content = content.replace(
    /\(user\?\.icName \|\| \(user\?\.icName \|\| user\?\.name\)\)/g,
    "(user?.icName || user?.name)"
  );

  // Fix: (session?.user?.icName || session?.user?.name)?.split
  // This is fine, leave as-is

  if (content !== initialContent) {
    fs.writeFileSync(filePath, content, "utf-8");
    console.log("Fixed", filePath);
  }
});
