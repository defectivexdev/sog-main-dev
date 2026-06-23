import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  const airdrops = await p.airdrop.findMany({ where: { status: 'open' }, select: { id: true, sessionName: true, date: true } });
  console.log('Open airdrops:', JSON.stringify(airdrops, null, 2));
  
  // Group by sessionName, delete duplicates
  const seen = new Set();
  for (const a of airdrops) {
    if (seen.has(a.sessionName)) {
      await p.airdrop.delete({ where: { id: a.id } });
      console.log('Deleted duplicate:', a.id, a.sessionName);
    } else {
      seen.add(a.sessionName);
    }
  }
  await p.$disconnect();
}
main();
