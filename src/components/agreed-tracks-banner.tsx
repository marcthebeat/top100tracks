'use client'

import { useState, useEffect } from "react"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function AgreedTracksBanner() {
    const [agreedCount, setAgreedCount] = useState(0)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const checkAgreed = () => {
            const agreedTracks = JSON.parse(localStorage.getItem("agreedTracks") || "[]")
            setAgreedCount(agreedTracks.length)
            setIsVisible(agreedTracks.length > 0)
        }

        checkAgreed()
        // Listen for storage events (in case of multiple tabs) or custom events
        window.addEventListener("storage", checkAgreed)

        // Custom event for same-tab updates (dispatched from VoteButton)
        const handleLocalUpdate = () => checkAgreed()
        window.addEventListener("agreedTracksUpdated", handleLocalUpdate)

        return () => {
            window.removeEventListener("storage", checkAgreed)
            window.removeEventListener("agreedTracksUpdated", handleLocalUpdate)
        }
    }, [])

    if (!isVisible) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-black text-white p-4 shadow-lg z-50 border-t border-gray-800">
            <div className="max-w-4xl mx-auto flex justify-between items-center">
                <div>
                    <p className="font-bold text-lg">You've agreed with {agreedCount} tracks!</p>
                    <p className="text-gray-400 text-sm">Build your own Top 100 list starting with these songs.</p>
                </div>
                <Link
                    href="/dashboard?import=true"
                    className="flex items-center gap-2 px-6 py-3 bg-[#1DB954] text-black font-bold rounded-full hover:bg-[#1ed760] transition-colors"
                >
                    Start My Top 100 <ArrowRight className="w-5 h-5" />
                </Link>
            </div>
        </div>
    )
}
