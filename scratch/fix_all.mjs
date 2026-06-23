import fs from "fs";
import path from "path";

const routes = ['activities', 'airdrop', 'attendance', 'leave', 'members', 'payment', 'profile', 'requisition', 'store', 'welfare'];
for (const route of routes) {
  const file = path.join('src/app/api', route, 'route.ts');
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf-8');

  // Fix delete parens
  content = content.replace(/where: \{ id: id \} \)\);/g, "where: { id: id } });");

  // Fix create parens
  content = content.replace(/name\) \}\)\);/g, "name) } });");
  content = content.replace(/sessionName\) \}\)\);/g, "sessionName) } });");
  content = content.replace(/session\.user\.icName \|\| session\.user\.name\) \}\)\);/g, "session.user.icName || session.user.name) } });");

  // Remove mongoose ObjectId from leave and payment
  content = content.replace(/member\?\._id \|\| new \(await import\("mongoose"\)\)\.default\.Types\.ObjectId\(\)/g, "member?.id || 'unknown'");
  content = content.replace(/memberId: member\?\._id \|\| "unknown"/g, "memberId: member?.id || 'unknown'");

  // Fix payment create
  content = content.replace(/Payment\.create\(\{/g, "prisma.payment.create({ data: {");

  // Fix await prisma()
  content = content.replace(/await prisma\(\);/g, "");

  fs.writeFileSync(file, content);
  console.log("Fixed", file);
}
