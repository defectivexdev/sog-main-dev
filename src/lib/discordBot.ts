// src/lib/discordBot.ts
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

export const CHANNELS = {
  LEAVE: "1442204828456714463",
  ATTENDANCE: "1442878695978045500",
  AIRDROP_ATTENDANCE: "1442227212097945600",
  AIRDROP_ITEMS: "1458917335858675793",
  ACTIVITIES: "1451213589133267117",
  PAYMENT: "1458476344898883646",
  WELFARE: "1442224457337929749",
  REQUISITION: "1445428672566788117"
};

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number; // integer (e.g. 0xff0000)
  fields?: { name: string; value: string; inline?: boolean }[];
  thumbnail?: { url: string };
  image?: { url: string };
  timestamp?: string; // ISO8601 string
  footer?: { text: string; icon_url?: string };
}

/**
 * Sends a new message with embeds to a specific channel.
 * Returns the message ID if successful.
 */
export async function sendDiscordMessage(channelId: string, embeds: DiscordEmbed[], content?: string): Promise<string | null> {
  if (!BOT_TOKEN) {
    console.error("Missing DISCORD_BOT_TOKEN");
    return null;
  }

  try {
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bot ${BOT_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: content || "",
        embeds: embeds
      })
    });

    if (!res.ok) {
      console.error("Discord API Error (POST):", await res.text());
      return null;
    }

    const data = await res.json();
    return data.id; // Return the message ID
  } catch (error) {
    console.error("Failed to send discord message:", error);
    return null;
  }
}

/**
 * Edits an existing message by its message ID.
 */
export async function editDiscordMessage(channelId: string, messageId: string, embeds: DiscordEmbed[], content?: string): Promise<boolean> {
  if (!BOT_TOKEN) return false;

  try {
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bot ${BOT_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: content || "",
        embeds: embeds
      })
    });

    if (!res.ok) {
      console.error("Discord API Error (PATCH):", await res.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("Failed to edit discord message:", error);
    return false;
  }
}
