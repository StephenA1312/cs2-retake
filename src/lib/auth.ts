import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifySteamToken } from "@/lib/steam-token";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      id: "steam",
      name: "Steam",
      credentials: {
        token: { type: "text" },
      },
      async authorize(credentials) {
        const raw = credentials?.token as string | undefined;
        if (!raw) return null;

        const steamId = await verifySteamToken(raw);
        if (!steamId) return null;

        const res = await fetch(
          `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_CLIENT_ID}&steamids=${steamId}`
        );
        const data = await res.json();
        const player = data.response?.players?.[0];
        if (!player) return null;

        // Upsert user into D1 on every login to keep name/avatar fresh
        try {
          const db = await getDb();
          const now = Math.floor(Date.now() / 1000);
          await db
            .insert(users)
            .values({
              steamId,
              steamName: player.personaname ?? null,
              steamAvatar: player.avatarfull ?? null,
              createdAt: now,
              updatedAt: now,
            })
            .onConflictDoUpdate({
              target: users.steamId,
              set: {
                steamName: player.personaname ?? null,
                steamAvatar: player.avatarfull ?? null,
                updatedAt: now,
              },
            });
        } catch (err) {
          console.error("D1 upsert error on login:", err);
          // Don't block sign-in if DB is unavailable
        }

        return {
          id: steamId,
          name: player.personaname || `Steam:${steamId}`,
          email: null,
          image: player.avatarfull || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      if (account?.type === "credentials" && user) {
        token.sub = user.id;
        token.picture = user.image;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        session.user.image = token.picture as string | null;
        session.user.name = token.name as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  session: {
    strategy: "jwt",
  },
});
