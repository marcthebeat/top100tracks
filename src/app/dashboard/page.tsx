'use client'

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { SearchTracks } from "@/components/search-tracks"
import { AuthButton } from "@/components/auth-button"
import { useSearchParams } from "next/navigation"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { SortableTrackItem } from "@/components/sortable-track-item"
import { Loader2, Save } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Track {
    id: string
    name: string
    artist: string
    album: string
    albumArt: string
    previewUrl: string | null
    uri: string
}

import { Suspense } from "react"

function DashboardContent() {
    const { data: session } = useSession()
    const searchParams = useSearchParams()
    const [playlist, setPlaylist] = useState<Track[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState("")

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    useEffect(() => {
        const shouldImport = searchParams.get("import") === "true"
        if (shouldImport) {
            const agreedTracks = JSON.parse(localStorage.getItem("agreedTracks") || "[]")
            if (agreedTracks.length > 0) {
                // Transform to Track interface if needed (assuming structure matches mostly)
                const tracks: Track[] = agreedTracks.map((t: any) => ({
                    id: t.id,
                    name: t.name,
                    artist: t.artist,
                    album: t.album, // Might be missing in agreedTracks if not saved, check VoteButton
                    albumArt: t.albumArt,
                    previewUrl: null, // Might be missing
                    uri: "", // Might be missing
                }))

                setPlaylist((prev) => {
                    // Avoid duplicates
                    const newTracks = tracks.filter(t => !prev.find(p => p.id === t.id))
                    return [...prev, ...newTracks].slice(0, 100)
                })
                setMessage("Imported your agreed tracks!")
            }
        }
    }, [searchParams])

    const addTrack = (track: Track) => {
        if (playlist.find((t) => t.id === track.id)) return
        if (playlist.length >= 100) return
        setPlaylist([...playlist, track])
    }

    const removeTrack = (trackId: string) => {
        setPlaylist(playlist.filter((t) => t.id !== trackId))
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            setPlaylist((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id)
                const newIndex = items.findIndex((item) => item.id === over.id)

                return arrayMove(items, oldIndex, newIndex)
            })
        }
    }

    const savePlaylist = async () => {
        if (!session?.user?.id) return
        setIsSaving(true)
        setMessage("")

        try {
            // 1. Create or Update Playlist
            const { data: playlistData, error: playlistError } = await supabase
                .from('playlists')
                .upsert({
                    creator_user_id: session.user.id,
                    title: "My Top 100 Tracks",
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'creator_user_id' })
                .select()
                .single()

            if (playlistError) throw playlistError

            // 2. Clear existing tracks for this playlist
            await supabase.from('playlist_tracks').delete().eq('playlist_id', playlistData.id)

            // 3. Insert Tracks (Canonical)
            const tracksToInsert = playlist.map(t => ({
                spotify_track_id: t.id,
                name: t.name,
                artist: t.artist,
                album_art: t.albumArt,
                preview_url: t.previewUrl,
            }))

            const { error: tracksError } = await supabase
                .from('tracks')
                .upsert(tracksToInsert, { onConflict: 'spotify_track_id' })
                .select()

            if (tracksError) throw tracksError

            // 4. Get the internal track IDs
            const { data: dbTracks } = await supabase
                .from('tracks')
                .select('id, spotify_track_id')
                .in('spotify_track_id', playlist.map(t => t.id))

            if (!dbTracks) throw new Error("Failed to retrieve track IDs")

            // Map spotify_id to internal uuid
            const trackMap = new Map(dbTracks.map((t: { id: string, spotify_track_id: string }) => [t.spotify_track_id, t.id]))

            // 5. Insert Playlist Tracks with position
            const playlistTracks = playlist.map((t, index) => ({
                playlist_id: playlistData.id,
                track_id: trackMap.get(t.id),
                position: index,
            }))

            const { error: linkError } = await supabase
                .from('playlist_tracks')
                .insert(playlistTracks)

            if (linkError) throw linkError

            setMessage("Playlist saved successfully!")
        } catch (error) {
            console.error("Save failed", error)
            setMessage("Failed to save playlist.")
        } finally {
            setIsSaving(false)
        }
    }

    if (!session) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold mb-4">Please sign in to manage your Top 100</h1>
                <AuthButton />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 pb-32">
            <header className="max-w-4xl mx-auto flex justify-between items-center mb-8 pt-8 sticky top-0 z-40 bg-gray-50/80 backdrop-blur-md py-4 -mx-4 px-4 border-b border-gray-100/50">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Top 100</h1>
                    <p className="text-gray-500 text-sm">The soundtrack of your life.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-gray-100 rounded-full text-xs font-mono font-medium text-gray-600">
                        {playlist.length}/100
                    </div>
                    <button
                        onClick={savePlaylist}
                        disabled={isSaving || playlist.length === 0}
                        className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-full hover:bg-gray-800 disabled:opacity-50 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/10"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save
                    </button>
                    <AuthButton />
                </div>
            </header>

            {message && (
                <div className={`max-w-4xl mx-auto mb-6 p-4 rounded-xl text-center animate-fade-in ${message.includes("success") ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                    {message}
                </div>
            )}

            {session?.user?.id && (
                <div className="max-w-4xl mx-auto mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl flex items-center justify-between shadow-sm">
                    <div>
                        <p className="font-bold text-blue-900 text-lg">Your list is ready to share!</p>
                        <p className="text-blue-700">Share this link with friends to get their votes.</p>
                    </div>
                    <a
                        href={`/u/${session.user.id}`}
                        target="_blank"
                        className="px-5 py-2.5 bg-white text-blue-600 font-bold rounded-xl border border-blue-200 hover:bg-blue-50 transition-all shadow-sm hover:shadow-md"
                    >
                        View Public Page
                    </a>
                </div>
            )}

            <main className="max-w-4xl mx-auto space-y-8">
                <SearchTracks onAddTrack={addTrack} />

                <div className="bg-white rounded-2xl shadow-xl shadow-gray-100/50 border border-gray-100 p-8 min-h-[300px]">
                    {playlist.length === 0 ? (
                        <div className="text-center text-gray-400 py-20">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">🎵</span>
                            </div>
                            <p className="text-lg font-medium text-gray-900">No tracks added yet</p>
                            <p className="text-sm mt-1">Search for your favorite songs above to start building your list.</p>
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={playlist.map(t => t.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <ul className="space-y-3">
                                    {playlist.map((track, index) => (
                                        <SortableTrackItem
                                            key={track.id}
                                            track={track}
                                            index={index}
                                            onRemove={removeTrack}
                                        />
                                    ))}
                                </ul>
                            </SortableContext>
                        </DndContext>
                    )}
                </div>
            </main>
        </div>
    )
}

export default function Dashboard() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>}>
            <DashboardContent />
        </Suspense>
    )
}

