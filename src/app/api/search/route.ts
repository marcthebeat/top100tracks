import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { getSpotifyClient } from "@/lib/spotify"
import { authOptions } from "../auth/[...nextauth]/route"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query) {
        return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 })
    }

    const session = await getServerSession(authOptions)

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const spotify = getSpotifyClient(session.accessToken)
        const data = await spotify.searchTracks(query, { limit: 10 })

        const tracks = data.body.tracks?.items.map((track: SpotifyApi.TrackObjectFull) => ({
            id: track.id,
            name: track.name,
            artist: track.artists.map((a: SpotifyApi.ArtistObjectSimplified) => a.name).join(", "),
            album: track.album.name,
            albumArt: track.album.images[0]?.url,
            previewUrl: track.preview_url,
            uri: track.uri,
        }))

        return NextResponse.json({ tracks })
    } catch (error) {
        console.error("Spotify Search Error:", error)
        return NextResponse.json({ error: "Failed to search tracks" }, { status: 500 })
    }
}
