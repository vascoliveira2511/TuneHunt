"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Music, User } from "lucide-react"

interface Song {
  id: string
  title: string
  artist: string
  album?: string
  imageUrl?: string
  selectedBy: string
}

interface GameSongsSummaryProps {
  gameId: string | undefined
}

export default function GameSongsSummary({ gameId }: GameSongsSummaryProps) {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!gameId) return

    const fetchGameSongs = async () => {
      try {
        const response = await fetch(`/api/games/${gameId}/songs`)
        if (response.ok) {
          const data = await response.json()
          setSongs(data.songs)
        }
      } catch (error) {
        console.error('Failed to fetch game songs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchGameSongs()
  }, [gameId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Songs Played
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-sm text-muted-foreground">Loading songs...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (songs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Songs Played
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-sm text-muted-foreground">No songs found</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Songs Played ({songs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {songs.map((song, index) => (
            <div key={song.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                {index + 1}
              </div>

              <Avatar className="h-12 w-12 rounded-md">
                <AvatarImage src={song.imageUrl} alt={song.album} />
                <AvatarFallback className="rounded-md">
                  <Music className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-base truncate">
                  {song.title}
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {song.artist}
                </div>
                {song.album && (
                  <div className="text-xs text-muted-foreground truncate">
                    {song.album}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-1">
                <Badge variant="secondary" className="text-xs">
                  <User className="h-3 w-3 mr-1" />
                  {song.selectedBy === 'playlist' ? 'Playlist' : song.selectedBy}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}