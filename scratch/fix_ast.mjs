import fs from "fs";
import path from "path";

// Fix delete parens in all
const routes = ['activities', 'airdrop', 'attendance', 'leave', 'members', 'payment', 'profile', 'requisition', 'store', 'welfare'];
for (const route of routes) {
  const file = path.join('src/app/api', route, 'route.ts');
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/where: \{ id: id \} \)\);/g, 'where: { id: id } });');
  fs.writeFileSync(file, content);
}

// Fix activities
let file = 'src/app/api/activities/route.ts';
let content = fs.readFileSync(file, 'utf-8');
content = content.replace(/const activity = await Activity\.findByIdAndUpdate\([^]+?\{ new: true \}\n    \);/g, `const activity = await prisma.activity.update({ where: { id }, data: { participants: { push: memberName } } });`);
fs.writeFileSync(file, content);

// Fix airdrop
file = 'src/app/api/airdrop/route.ts';
content = fs.readFileSync(file, 'utf-8');
content = content.replace(/const airdrop = await Airdrop\.findByIdAndUpdate\([^]+?\{ new: true \}\n    \);/g, `const airdrop = await prisma.airdrop.update({ where: { id }, data: { checkedMembers: { push: memberName } } });`);
fs.writeFileSync(file, content);

// Fix payment
file = 'src/app/api/payment/route.ts';
content = fs.readFileSync(file, 'utf-8');
content = content.replace(/  \}\);\n  return NextResponse\.json/g, `  } });\n  return NextResponse.json`);
fs.writeFileSync(file, content);
