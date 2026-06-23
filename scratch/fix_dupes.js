const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const airdrops = await p.airdrop.findMany({ where: { status: 'open' }, select: { id: true, sessionName: true, date: true } });
  console.log(JSON.stringify(airdrops, null, 2));
  
  // Delete duplicates - keep only the first one
  if (airdrops.length > 1) {
    for (let i = 1; i < airdrops.length; i++) {
      await p.airdrop.delete({ where: { id: airdrops[i].id } });
      console.log('Deleted duplicate:', airdrops[i].id);
    }
  }
  await p.$disconnect();
}
main();
