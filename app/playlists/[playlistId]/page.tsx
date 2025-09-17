"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Music, Play, Pause, Users, Star, Edit, Trash2, Plus } from "lucide-react"
import Link from "next/link"

interface PlaylistSong {
  id: string
  position: number
  song: {
    id: string
    spotifyId: string
    title: string
    artist: string
    album?: string
    previewUrl?: string
    imageUrl?: string
    durationMs?: number
  }
}

interface Playlist {
  id: string
  name: string
  description?: string
  createdBy?: string
  isOfficial: boolean
  isPublished: boolean
  rating: number
  ratingCount: number
  createdAt: string
  creator?: {
    id: string
    name: string
    image?: string
  }
  songs: PlaylistSong[]
  _count?: {
    songs: number
  }
}

export default function PlaylistDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [playingTrack, setPlayingTrack] = useState<string | null>(null)

  const playlistId = params.playlistId as string

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const response = await fetch(`/api/playlists/${playlistId}`)
        if (response.ok) {
          const data = await response.json()
          setPlaylist(data.playlist)
        } else {
          setError("Playlist not found")
        }
      } catch (error) {
        console.error('Error fetching playlist:', error)
        setError("Failed to load playlist")
      } finally {
        setLoading(false)
      }
    }

    fetchPlaylist()
  }, [playlistId])

  const togglePreview = (song: PlaylistSong['song']) => {
    if (!song.previewUrl) return

    if (playingTrack === song.id) {
      setPlayingTrack(null)
      return
    }

    setPlayingTrack(song.id)
    const audio = new Audio(song.previewUrl)
    audio.volume = 0.3
    audio.play().catch(console.error)

    audio.onended = () => setPlayingTrack(null)
    audio.onerror = () => setPlayingTrack(null)
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ))
  }

  const handleCreateRoom = () => {
    router.push(`/create-room?playlist=${playlistId}`)
  }

  const isOwner = session?.user && playlist?.createdBy === (session.user as { id: string }).id

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="text-lg">Loading playlist...</div>
        </div>
      </div>
    )
  }

  if (error || !playlist) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Playlist Not Found</CardTitle>
            <CardDescription>
              {error || "The playlist you're looking for doesn't exist."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/playlists')}>
              Back to Playlists
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalDuration = playlist.songs.reduce((total, song) => 
    total + (song.song.durationMs || 0), 0
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/playlists" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Playlists
          </Link>
        </div>

        {/* Playlist Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-2xl">{playlist.name}</CardTitle>
                  {playlist.isOfficial && (
                    <Badge variant="secondary">Official</Badge>
                  )}
                  {!playlist.isPublished && (
                    <Badge variant="outline">Draft</Badge>
                  )}
                </div>
                
                {playlist.description && (
                  <CardDescription className="text-base mb-4">
                    {playlist.description}
                  </CardDescription>
                )}

                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  {playlist.creator && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={playlist.creator.image} />
                        <AvatarFallback className="text-xs">
                          {playlist.creator.name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span>by {playlist.creator.name}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <Music className="h-4 w-4" />
                    <span>{playlist.songs.length} songs</span>
                  </div>
                  
                  <span>{formatDuration(totalDuration)}</span>
                  
                  {playlist.ratingCount > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="flex">{renderStars(playlist.rating)}</div>
                      <span>({playlist.ratingCount})</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isOwner && (
                  <>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </>
                )}
                <Button onClick={handleCreateRoom}>
                  <Users className="h-4 w-4 mr-2" />
                  Create Room
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Songs List */}
        <Card>
          <CardHeader>
            <CardTitle>Tracks</CardTitle>
          </CardHeader>
          <CardContent>
            {playlist.songs.length === 0 ? (
              <div className="text-center py-12">
                <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No tracks yet</h3>
                <p className="text-muted-foreground mb-4">
                  This playlist doesn&apos;t have any tracks added yet.
                </p>
                {isOwner && (
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tracks
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {playlist.songs.map((playlistSong, index) => {
                  const song = playlistSong.song
                  return (
                    <div key={song.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <span className="text-muted-foreground w-8 text-sm">
                        {index + 1}
                      </span>
                      
                      <Avatar className="h-12 w-12 rounded-md">
                        <AvatarImage src={song.imageUrl} alt={song.album} />
                        <AvatarFallback className="rounded-md">
                          {song.title[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{song.title}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {song.artist}
                        </div>
                        {song.album && (
                          <div className="text-xs text-muted-foreground truncate">
                            {song.album}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        {song.durationMs ? formatDuration(song.durationMs) : '--:--'}
                      </div>
                      
                      {song.previewUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePreview(song)}
                          className="h-8 w-8 p-0"
                        >
                          {playingTrack === song.id ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}