import NextAuth, { AuthOptions } from "next-auth"
import SpotifyProvider from "next-auth/providers/spotify"
import { supabase } from "@/lib/supabase"

const scopes = [
    "user-read-email",
    "playlist-read-private",
    "playlist-modify-public",
    "playlist-modify-private",
].join(",")

export const authOptions: AuthOptions = {
    providers: [
        SpotifyProvider({
            clientId: process.env.SPOTIFY_CLIENT_ID!,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
            authorization: {
                params: { scope: scopes },
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (account && user) {
                // Upsert user to Supabase
                // We use the Spotify ID (providerAccountId) as the primary key in our users table
                const { error } = await supabase
                    .from('users')
                    .upsert({
                        id: account.providerAccountId,
                        display_name: user.name,
                        profile_image: user.image,
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'id' })

                if (error) {
                    console.error('Error saving user to Supabase:', error)
                    // We don't block sign in on DB error, but we log it
                }
            }
            return true
        },
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token
                token.refreshToken = account.refresh_token
                token.expiresAt = account.expires_at
                token.id = account.providerAccountId
            }
            return token
        },
        async session({ session, token }: any) {
            session.accessToken = token.accessToken
            if (session.user) {
                session.user.id = token.id
            }
            return session
        },
    },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
