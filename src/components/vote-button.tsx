'use client'

import { useState, useEffect } from "react"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useSession } from "next-auth/react"

interface VoteButtonProps {
    playlistId: string
    trackId: string
    trackName: string // For local storage tracking
    trackArtist: string
    albumArt: string
}

export function VoteButton({ playlistId, trackId, trackName, trackArtist, albumArt }: VoteButtonProps) {
    const { data: session } = useSession()
    const [vote, setVote] = useState<"agree" | "disagree" | null>(null)
    const [loading, setLoading] = useState(false)

    // Load initial vote from local storage or DB (if logged in)
    useEffect(() => {
        // Check local storage first for immediate feedback
        const localVotes = JSON.parse(localStorage.getItem("votes") || "{}")
        const key = `${playlistId}-${trackId}`
        if (localVotes[key]) {
            setVote(localVotes[key])
        }
    }, [playlistId, trackId])

    const handleVote = async (newVote: "agree" | "disagree") => {
        if (loading) return
        setLoading(true)

        // Optimistic update
        setVote(newVote)

        // Save to local storage
        const localVotes = JSON.parse(localStorage.getItem("votes") || "{}")
        localVotes[`${playlistId}-${trackId}`] = newVote
        localStorage.setItem("votes", JSON.stringify(localVotes))

        // Save "Agreed" tracks to a separate list for "Convert to Creator" flow
        if (newVote === "agree") {
            const agreedTracks = JSON.parse(localStorage.getItem("agreedTracks") || "[]")
            if (!agreedTracks.find((t: any) => t.id === trackId)) {
                agreedTracks.push({ id: trackId, name: trackName, artist: trackArtist, albumArt })
                localStorage.setItem("agreedTracks", JSON.stringify(agreedTracks))
                // Dispatch custom event for the banner
                window.dispatchEvent(new Event("agreedTracksUpdated"))
            }
        }

        try {
            // Save to Supabase
            const { error } = await supabase
                .from('votes')
                .upsert({
                    playlist_id: playlistId,
                    track_id: trackId,
                    reviewer_id: session?.user?.id || null, // Null if anonymous
                    session_id: !session?.user?.id ? 'anonymous' : null, // We should probably generate a real session ID
                    vote_type: newVote,
                }, { onConflict: 'playlist_id, track_id, reviewer_id, session_id' }) // This constraint might need adjustment for anonymous users

            if (error) console.error("Vote failed", error)
        } catch (error) {
            console.error("Vote error", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex gap-2">
            <button
                onClick={() => handleVote("agree")}
                className={`p-2 rounded-full transition-colors ${vote === "agree" ? "bg-green-100 text-green-600" : "hover:bg-gray-100 text-gray-400"}`}
            >
                <ThumbsUp className="w-5 h-5" />
            </button>
            <button
                onClick={() => handleVote("disagree")}
                className={`p-2 rounded-full transition-colors ${vote === "disagree" ? "bg-red-100 text-red-600" : "hover:bg-gray-100 text-gray-400"}`}
            >
                <ThumbsDown className="w-5 h-5" />
            </button>
        </div>
    )
}
