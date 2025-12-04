'use client'

import { signIn, signOut, useSession } from "next-auth/react"

export function AuthButton() {
    const { data: session } = useSession()

    if (session) {
        return (
            <div className="flex items-center gap-4">
                <p>Signed in as {session.user?.name}</p>
                <button
                    onClick={() => signOut()}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                    Sign out
                </button>
            </div>
        )
    }

    return (
        <button
            onClick={() => signIn("spotify")}
            className="px-6 py-3 text-sm font-medium text-black bg-[#1DB954] rounded-full hover:bg-[#1ed760] transition-colors"
        >
            Sign in with Spotify
        </button>
    )
}
