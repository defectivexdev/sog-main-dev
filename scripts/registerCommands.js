const fs = require('fs');
const path = require('path');

// Load environment variables manually since we are running as a bare Node script
const envPath = path.join(__dirname, '../.env.local');
let envFile = "";
try {
  envFile = fs.readFileSync(envPath, 'utf8');
} catch (e) {
  console.error("Could not find .env.local file");
  process.exit(1);
}

const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
});

const TOKEN = envVars.DISCORD_BOT_TOKEN;
const CLIENT_ID = envVars.DISCORD_CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error("Missing DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID in .env.local");
  process.exit(1);
}

const commands = [
  {
    name: 'ฝากเงินแก๊งค์',
    description: 'บันทึกการฝากเงินเข้าแก๊งค์',
    options: [
      {
        name: 'amount',
        description: 'จำนวนเงินที่ฝาก (ใส่เป็นตัวเลขเท่านั้น)',
        type: 4, // INTEGER
        required: true,
      },
      {
        name: 'slip_url',
        description: 'ลิ้งก์รูปสลิปการโอนเงิน (ถ้ามี)',
        type: 3, // STRING
        required: false,
      }
    ]
  }
];

async function registerCommands() {
  console.log('Started refreshing application (/) commands.');

  try {
    const response = await fetch(`https://discord.com/api/v10/applications/${CLIENT_ID}/commands`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bot ${TOKEN}`
      },
      body: JSON.stringify(commands)
    });

    if (response.ok) {
      console.log('Successfully reloaded application (/) commands.');
    } else {
      const errorText = await response.text();
      console.error('Failed to register commands:', response.status, errorText);
    }
  } catch (error) {
    console.error(error);
  }
}

registerCommands();
