'use client'

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, X } from "lucide-react"

interface Track {
    id: string
    name: string
    artist: string
    album: string
    albumArt: string
}

interface SortableTrackItemProps {
    track: Track
    index: number
    onRemove: (id: string) => void
}

export function SortableTrackItem({ track, index, onRemove }: SortableTrackItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: track.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <li
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-4 p-3 bg-white border border-gray-100 rounded-lg group shadow-sm mb-2"
        >
            <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600">
                <GripVertical className="w-5 h-5" />
            </div>

            <span className="text-gray-400 font-mono w-6 text-right text-sm">{index + 1}</span>

            <img src={track.albumArt} alt={track.album} className="w-10 h-10 rounded shadow-sm" />

            <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate text-sm">{track.name}</p>
                <p className="text-xs text-gray-500 truncate">{track.artist}</p>
            </div>

            <button
                onClick={() => onRemove(track.id)}
                className="text-red-400 hover:text-red-600 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <X className="w-4 h-4" />
            </button>
        </li>
    )
}
