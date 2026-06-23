/**
 * Verify that a Discord user is in the SOG guild and has an allowed role.
 */
export async function verifyDiscordMembership(
  accessToken: string,
  userId: string
): Promise<{ valid: boolean; roles: string[] }> {
  const guildId = process.env.SOG_GUILD_ID!;
  const allowedRoleIds = (process.env.ALLOWED_ROLE_IDS || "").split(",").map((r) => r.trim()).filter(Boolean);
  const botToken = process.env.DISCORD_BOT_TOKEN!;

  if (!guildId || !botToken) {
    console.error("SOG_GUILD_ID or DISCORD_BOT_TOKEN not set");
    return { valid: false, roles: [] };
  }

  try {
    // Fetch guild member via bot token (more reliable than user token for guilds.members.read)
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      }
    );

    if (!res.ok) {
      // 404 = not in guild
      return { valid: false, roles: [] };
    }

    const member = await res.json();
    const memberRoles: string[] = member.roles || [];

    // If no allowed roles configured, just being in the guild is enough
    if (allowedRoleIds.length === 0) {
      return { valid: true, roles: memberRoles };
    }

    const hasRole = memberRoles.some((r: string) => allowedRoleIds.includes(r));
    return { valid: hasRole, roles: memberRoles };
  } catch (err) {
    console.error("Discord membership check failed:", err);
    return { valid: false, roles: [] };
  }
}
