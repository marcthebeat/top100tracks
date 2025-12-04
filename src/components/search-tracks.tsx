'use client'

import { useState } from "react"
import { Search, Plus, Loader2 } from "lucide-react"

interface Track {
    id: string
    name: string
    artist: string
    album: string
    albumArt: string
    previewUrl: string | null
    uri: string
}

interface SearchTracksProps {
    onAddTrack: (track: Track) => void
}

export function SearchTracks({ onAddTrack }: SearchTracksProps) {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<Track[]>([])
    const [loading, setLoading] = useState(false)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return

        setLoading(true)
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
            const data = await res.json()
            if (data.tracks) {
                setResults(data.tracks)
            }
        } catch (error) {
            console.error("Search failed", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="relative mb-6">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for a song..."
                    className="w-full p-4 pl-12 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white/50 backdrop-blur-sm"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <button
                    type="submit"
                    disabled={loading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                </button>
            </form>

            {results.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                    <ul className="divide-y divide-gray-100">
                        {results.map((track) => (
                            <li key={track.id} className="p-3 flex items-center gap-4 hover:bg-gray-50 transition-colors group">
                                <img src={track.albumArt} alt={track.album} className="w-12 h-12 rounded object-cover shadow-sm" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{track.name}</p>
                                    <p className="text-sm text-gray-500 truncate">{track.artist}</p>
                                </div>
                                <button
                                    onClick={() => onAddTrack(track)}
                                    className="p-2 rounded-full hover:bg-green-100 text-green-600 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
