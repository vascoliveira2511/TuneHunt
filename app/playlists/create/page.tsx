"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Music, ArrowLeft, Search, Play, Pause, X, Save } from "lucide-react"
import Link from "next/link"
import MusicSearch from "@/components/Game/MusicSearch"
import type { SpotifyTrack } from "@/lib/spotify"

export default function CreatePlaylistPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [playlistName, setPlaylistName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedTracks, setSelectedTracks] = useState<SpotifyTrack[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [playingTrack, setPlayingTrack] = useState<string | null>(null)

  const handleAddTrack = (track: SpotifyTrack) => {
    if (!selectedTracks.find(t => t.id === track.id)) {
      setSelectedTracks([...selectedTracks, track])
    }
  }

  const handleRemoveTrack = (trackId: string) => {
    setSelectedTracks(selectedTracks.filter(t => t.id !== trackId))
  }

  const togglePreview = (track: SpotifyTrack) => {
    if (!track.preview_url) return

    if (playingTrack === track.id) {
      setPlayingTrack(null)
      return
    }

    setPlayingTrack(track.id)
    const audio = new Audio(track.preview_url)
    audio.volume = 0.3
    audio.play().catch(console.error)

    audio.onended = () => setPlayingTrack(null)
    audio.onerror = () => setPlayingTrack(null)
  }

  const handleCreatePlaylist = async () => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (!playlistName.trim()) {
      alert('Please enter a playlist name')
      return
    }

    if (selectedTracks.length < 5) {
      alert('Please add at least 5 tracks to your playlist')
      return
    }

    setIsCreating(true)

    try {
      // First create the playlist
      const playlistResponse = await fetch('/api/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: playlistName.trim(),
          description: description.trim() || undefined
        }),
      })

      if (!playlistResponse.ok) {
        const error = await playlistResponse.json()
        alert(error.error || 'Failed to create playlist')
        return
      }

      const { playlist } = await playlistResponse.json()

      // Then add songs to the playlist
      const songsResponse = await fetch(`/api/playlists/${playlist.id}/songs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tracks: selectedTracks
        }),
      })

      if (songsResponse.ok) {
        router.push(`/playlists/${playlist.id}`)
      } else {
        const error = await songsResponse.json()
        alert(error.error || 'Failed to add songs to playlist')
      }
    } catch (error) {
      console.error('Failed to create playlist:', error)
      alert('Failed to create playlist')
    } finally {
      setIsCreating(false)
    }
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              You need to be signed in to create a playlist
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/auth/signin')} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/playlists" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Playlists
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Playlist Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Create Playlist
              </CardTitle>
              <CardDescription>
                Build a curated collection of tracks for TuneHunt games
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="playlistName">Playlist Name *</Label>
                <Input
                  id="playlistName"
                  placeholder="Enter playlist name..."
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your playlist..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {description.length}/500 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label>Creator</Label>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={session.user?.image || ''} />
                    <AvatarFallback className="text-xs">
                      {session.user?.name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{session.user?.name}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tracks ({selectedTracks.length})</Label>
                <p className="text-sm text-muted-foreground">
                  Minimum 5 tracks required. Add variety for better gameplay!
                </p>
                
                {selectedTracks.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                    <Music className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No tracks added yet</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => {}}
                    >
                      <Search className="h-4 w-4 mr-1" />
                      Search Tracks
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedTracks.map((track, index) => (
                      <div key={track.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                        <span className="text-xs text-muted-foreground w-6">
                          {index + 1}
                        </span>
                        <Avatar className="h-8 w-8 rounded-sm">
                          <AvatarImage src={track.album.images[0]?.url} alt={track.album.name} />
                          <AvatarFallback className="rounded-sm text-xs">
                            {track.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{track.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {track.artists.map(artist => artist.name).join(', ')}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDuration(track.duration_ms)}
                        </div>
                        <div className="flex items-center gap-1">
                          {track.preview_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePreview(track)}
                              className="h-6 w-6 p-0"
                            >
                              {playingTrack === track.id ? (
                                <Pause className="h-3 w-3" />
                              ) : (
                                <Play className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTrack(track.id)}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t space-y-3">
                <Button
                  onClick={() => {}}
                  variant="outline"
                  className="w-full"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Add More Tracks
                </Button>
                
                <Button
                  onClick={handleCreatePlaylist}
                  disabled={isCreating || !playlistName.trim() || selectedTracks.length < 5}
                  className="w-full"
                >
                  {isCreating ? (
                    <>Creating...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Playlist
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Music Search */}
          <Card>
            <CardHeader>
              <CardTitle>Add Tracks</CardTitle>
              <CardDescription>
                Search for tracks to add to your playlist
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MusicSearch 
                onTrackSelect={handleAddTrack}
                selectedTracks={selectedTracks}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}