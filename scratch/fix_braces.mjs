import fs from "fs";
import path from "path";

const routes = ['activities', 'airdrop', 'attendance', 'leave', 'members', 'payment', 'profile', 'requisition', 'store', 'welfare'];
for (const route of routes) {
  const file = path.join('src/app/api', route, 'route.ts');
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/desc' \}\);/g, "desc' } });");
  content = content.replace(/icName\.trim\(\) \}\)\);/g, "icName.trim() } });");
  fs.writeFileSync(file, content);
  console.log(`Fixed ${file}`);
}
