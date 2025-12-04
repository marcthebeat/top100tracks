import { supabase } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { AuthButton } from "@/components/auth-button"
import { VoteButton } from "@/components/vote-button"
import { AgreedTracksBanner } from "@/components/agreed-tracks-banner"

interface PublicPlaylistPageProps {
    params: Promise<{
        userId: string
    }>
}

interface PlaylistTrack {
    position: number
    tracks: {
        id: string
        name: string
        artist: string
        album_art: string
        preview_url: string | null
    }
}

export default async function PublicPlaylistPage({ params }: PublicPlaylistPageProps) {
    const { userId } = await params

    // Fetch playlist and user details
    const { data: playlist } = await supabase
        .from('playlists')
        .select(`
      *,
      users (
        display_name,
        profile_image
      )
    `)
        .eq('creator_user_id', userId)
        .single()

    if (!playlist) {
        return notFound()
    }

    // Fetch tracks for this playlist
    const { data: tracks } = await supabase
        .from('playlist_tracks')
        .select(`
      position,
      tracks (
        id,
        name,
        artist,
        album_art,
        preview_url
      )
    `)
        .eq('playlist_id', playlist.id)
        .order('position', { ascending: true })
        .returns<PlaylistTrack[]>()

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-32">
            <header className="max-w-4xl mx-auto flex justify-between items-center mb-12 pt-8">
                <div className="flex items-center gap-4">
                    {playlist.users?.profile_image && (
                        <img
                            src={playlist.users.profile_image}
                            alt={playlist.users.display_name}
                            className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                        />
                    )}
                    <div>
                        <h1 className="text-2xl font-bold">{playlist.users?.display_name}'s Top 100</h1>
                        <p className="text-gray-500 text-sm">Top 100 Tracks of All Time</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <AuthButton />
                </div>
            </header>

            <main className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="font-semibold text-lg">Tracks</h2>
                        <span className="text-sm text-gray-500">{tracks?.length || 0} tracks</span>
                    </div>

                    <ul className="divide-y divide-gray-100">
                        {tracks?.map((item: PlaylistTrack) => (
                            <li key={item.tracks.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                <span className="text-gray-400 font-mono w-8 text-right text-lg">{item.position + 1}</span>
                                <img
                                    src={item.tracks.album_art}
                                    alt={item.tracks.name}
                                    className="w-12 h-12 rounded shadow-sm"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{item.tracks.name}</p>
                                    <p className="text-sm text-gray-500 truncate">{item.tracks.artist}</p>
                                </div>
                                {item.tracks.preview_url && (
                                    <audio controls src={item.tracks.preview_url} className="h-8 w-32 opacity-50 hover:opacity-100 transition-opacity mr-4" />
                                )}
                                <VoteButton
                                    playlistId={playlist.id}
                                    trackId={item.tracks.id}
                                    trackName={item.tracks.name}
                                    trackArtist={item.tracks.artist}
                                    albumArt={item.tracks.album_art}
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            </main>
            <AgreedTracksBanner />
        </div>
    )
}
