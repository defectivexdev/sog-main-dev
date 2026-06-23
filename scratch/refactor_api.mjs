import fs from "fs";
import path from "path";

const routes = [
  "activities",
  "airdrop",
  "attendance",
  "leave",
  "members",
  "payment",
  "profile",
  "requisition",
  "store",
  "welfare"
];

for (const route of routes) {
  const filePath = path.join("src/app/api", route, "route.ts");
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, "utf-8");

  // 1. Replace imports
  content = content.replace(/import dbConnect from "@\/lib\/db";\n/g, 'import prisma from "@/lib/db";\n');
  content = content.replace(/import [A-Za-z]+ from "@\/lib\/models\/[A-Za-z]+";\n/g, "");

  // 2. Remove await dbConnect()
  content = content.replace(/[ \t]*await dbConnect\(\);\n/g, "");

  // 3. Replace Mongoose queries
  // Capitalize model name for prisma (lowercase first letter)
  content = content.replace(/([A-Z][a-z]+)\.find\(\)/g, (match, p1) => `prisma.${p1.toLowerCase()}.findMany()`);
  content = content.replace(/([A-Z][a-zA-Z]+)\.find\(\)/g, (match, p1) => `prisma.${p1.charAt(0).toLowerCase() + p1.slice(1)}.findMany()`);
  
  content = content.replace(/\.sort\(\{ ([a-zA-Z]+): -1 \}\)\.lean\(\)/g, (match, p1) => `{ orderBy: { ${p1}: 'desc' } }`);
  
  // Custom replaces
  content = content.replace(/Activity\.create\(\{ \.\.\.body, createdBy: (.+) \}\)/g, "prisma.activity.create({ data: { ...body, createdBy: $1 } })");
  content = content.replace(/Airdrop\.create\(\{ \.\.\.body, createdBy: (.+) \}\)/g, "prisma.airdrop.create({ data: { ...body, createdBy: $1 } })");
  content = content.replace(/Attendance\.create\(\{ \.\.\.body, recordedBy: (.+) \}\)/g, "prisma.attendance.create({ data: { ...body, recordedBy: $1 } })");
  content = content.replace(/Leave\.create\(\{ \.\.\.body, memberName: (.+) \}\)/g, "prisma.leave.create({ data: { ...body, memberName: $1 } })");
  content = content.replace(/Member\.create\(body\)/g, "prisma.member.create({ data: body })");
  content = content.replace(/Payment\.create\(body\)/g, "prisma.payment.create({ data: body })");
  content = content.replace(/Requisition\.create\(body\)/g, "prisma.requisition.create({ data: body })");
  content = content.replace(/StoreItem\.create\(body\)/g, "prisma.storeItem.create({ data: body })");
  content = content.replace(/WelfareItem\.create\(body\)/g, "prisma.welfareItem.create({ data: body })");

  content = content.replace(/Activity\.findByIdAndUpdate\(([^,]+), \{ \$addToSet: \{ participants: ([^ ]+) \} \}, \{ new: true \}\)/g, "prisma.activity.update({ where: { id: $1 }, data: { participants: { push: $2 } } })");
  content = content.replace(/Activity\.findByIdAndUpdate\(([^,]+), \{ \$pull: \{ participants: ([^ ]+) \} \}, \{ new: true \}\)/g, `prisma.activity.findUnique({where:{id:$1}}).then(act => prisma.activity.update({where:{id:$1}, data:{participants: act.participants.filter(p => p !== $2)}}))`);

  content = content.replace(/([A-Z][a-zA-Z]+)\.findByIdAndUpdate\(([^,]+), ([^,]+), \{ new: true \}\)/g, (match, p1, p2, p3) => `prisma.${p1.charAt(0).toLowerCase() + p1.slice(1)}.update({ where: { id: ${p2} }, data: ${p3} })`);
  content = content.replace(/([A-Z][a-zA-Z]+)\.findByIdAndUpdate\(([^,]+), \{ \.\.\.update, (.+) \}, \{ new: true \}\)/g, (match, p1, p2, p3) => `prisma.${p1.charAt(0).toLowerCase() + p1.slice(1)}.update({ where: { id: ${p2} }, data: { ...update, ${p3} } })`);

  content = content.replace(/([A-Z][a-zA-Z]+)\.findByIdAndDelete\(([^)]+)\)/g, (match, p1, p2) => `prisma.${p1.charAt(0).toLowerCase() + p1.slice(1)}.delete({ where: { id: ${p2} } })`);

  content = content.replace(/Member\.findOneAndUpdate\(\s*\{ discordId: ([^ ]+) \},\s*\{ icName: (.+) \},\s*\{ new: true \}\s*\)/g, "prisma.member.update({ where: { discordId: $1 }, data: { icName: $2 } })");

  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`Updated ${filePath}`);
}
