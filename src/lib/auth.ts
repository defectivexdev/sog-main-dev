import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { verifyDiscordMembership } from "@/lib/discord";
import { resolveGangRole, type GangRole } from "@/lib/roles";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "identify email guilds guilds.members.read",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/access-denied",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "discord") return false;

      const userId = account.providerAccountId;
      const accessToken = account.access_token!;

      const { valid, roles } = await verifyDiscordMembership(accessToken, userId);

      if (!valid) {
        return "/access-denied?reason=unauthorized";
      }

      (user as Record<string, unknown>).discordRoles = roles;
      (user as Record<string, unknown>).discordId = userId;

      // Resolve gang role from Discord roles + env config
      const gangRole = resolveGangRole(userId, roles);
      (user as Record<string, unknown>).gangRole = gangRole;

      return true;
    },

    async jwt({ token, user, account }) {
      if (account && user) {
        token.discordId = (user as Record<string, unknown>).discordId as string;
        token.discordRoles = (user as Record<string, unknown>).discordRoles as string[];
        token.gangRole = (user as Record<string, unknown>).gangRole as GangRole;
        token.accessToken = account.access_token;
      }

      // Re-fetch Discord roles on every token refresh to pick up role changes
      if (token.discordId) {
        try {
          const guildId = process.env.SOG_GUILD_ID;
          const botToken = process.env.DISCORD_BOT_TOKEN;
          if (guildId && botToken) {
            const res = await fetch(
              `https://discord.com/api/v10/guilds/${guildId}/members/${token.discordId}`,
              { headers: { Authorization: `Bot ${botToken}` }, next: { revalidate: 0 } }
            );
            if (res.ok) {
              const discordMember = await res.json();
              const freshRoles: string[] = discordMember.roles || [];
              token.discordRoles = freshRoles;
              token.gangRole = resolveGangRole(token.discordId as string, freshRoles);
              
              if (discordMember.user?.avatar) {
                token.discordAvatar = `https://cdn.discordapp.com/avatars/${discordMember.user.id}/${discordMember.user.avatar}.png`;
              }
            }
          }
        } catch (err) {
          console.error("Error refreshing Discord roles:", err);
        }
      }

      // Sync icName from DB
      if (token.discordId) {
        try {
          const prisma = (await import("@/lib/db")).default;
          const member = await prisma.member.findUnique({
            where: { discordId: token.discordId as string }
          });
          
          if (member) {
            token.icName = member.icName || null;
            // Also sync the member role and avatar in DB
            const newRole = token.gangRole === "leader" ? "leader" : token.gangRole === "vice_leader" ? "vice_leader" : "member";
            
            const updates: any = {};
            if (member.role !== newRole) updates.role = newRole;
            
            const avatarToSave = (token.discordAvatar as string) || (user?.image as string);
            if (avatarToSave && member.avatar !== avatarToSave) updates.avatar = avatarToSave;

            if (Object.keys(updates).length > 0) {
              await prisma.member.update({
                where: { discordId: token.discordId as string },
                data: updates,
              });
            }
          } else if (user) {
            await prisma.member.create({
              data: {
                discordId: token.discordId as string,
                name: user.name || "Unknown",
                nickname: user.name || "Unknown",
                role: token.gangRole === "leader" ? "leader" : token.gangRole === "vice_leader" ? "vice_leader" : "member",
                avatar: user.image || null,
              }
            });
            token.icName = null;
          }
        } catch (error) {
          console.error("Error syncing user with DB:", error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user.discordId = token.discordId as string;
      session.user.discordRoles = token.discordRoles as string[];
      session.user.gangRole = token.gangRole as GangRole;
      session.user.icName = token.icName as string | null | undefined;
      if (token.discordAvatar) {
        session.user.image = token.discordAvatar as string;
      }
      return session;
    },
  },
});

// Augment NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      discordId?: string;
      discordRoles?: string[];
      gangRole?: GangRole;
      icName?: string | null;
    };
  }
}
