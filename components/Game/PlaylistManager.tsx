"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Music, Play, Pause, X, Shuffle, RotateCcw } from "lucide-react"
import MusicSearch from "./MusicSearch"
import type { SpotifyTrack } from "@/lib/spotify"

interface PlaylistManagerProps {
  isHost: boolean
  onStartGame?: () => void
}

export default function PlaylistManager({ isHost, onStartGame }: PlaylistManagerProps) {
  const [selectedTracks, setSelectedTracks] = useState<SpotifyTrack[]>([])
  const [playingTrack, setPlayingTrack] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handleTrackSelect = (track: SpotifyTrack) => {
    if (!selectedTracks.some(selected => selected.id === track.id)) {
      setSelectedTracks(prev => [...prev, track])
    }
  }

  const handleRemoveTrack = (trackId: string) => {
    setSelectedTracks(prev => prev.filter(track => track.id !== trackId))
    if (playingTrack === trackId) {
      audioRef.current?.pause()
      setPlayingTrack(null)
    }
  }

  const playPreview = (track: SpotifyTrack) => {
    if (!track.preview_url) return

    if (playingTrack === track.id) {
      audioRef.current?.pause()
      setPlayingTrack(null)
      return
    }

    if (audioRef.current) {
      audioRef.current.pause()
    }

    const audio = new Audio(track.preview_url)
    audio.volume = 0.3
    audioRef.current = audio

    audio.play().catch(console.error)
    setPlayingTrack(track.id)

    audio.onended = () => {
      setPlayingTrack(null)
    }

    audio.onerror = () => {
      setPlayingTrack(null)
    }
  }

  const shufflePlaylist = () => {
    const shuffled = [...selectedTracks]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    setSelectedTracks(shuffled)
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (!isHost) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Game Playlist
          </CardTitle>
          <CardDescription>
            The host is preparing the music for this game
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Waiting for the host to select songs...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Game Setup
              </CardTitle>
              <CardDescription>
                Search and select songs for your TuneHunt game
              </CardDescription>
            </div>
            {selectedTracks.length >= 2 && onStartGame && (
              <Button onClick={onStartGame} size="lg">
                Start Game ({selectedTracks.length} songs)
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search">Search Music</TabsTrigger>
              <TabsTrigger value="playlist" className="relative">
                Playlist
                {selectedTracks.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
                    {selectedTracks.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-4">
              <MusicSearch 
                onTrackSelect={handleTrackSelect}
                selectedTracks={selectedTracks}
              />
            </TabsContent>

            <TabsContent value="playlist" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium">Selected Songs</h3>
                  <Badge variant="outline">{selectedTracks.length} tracks</Badge>
                </div>
                {selectedTracks.length > 1 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={shufflePlaylist}
                      className="h-8"
                    >
                      <Shuffle className="h-3 w-3 mr-1" />
                      Shuffle
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTracks([])}
                      className="h-8"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  </div>
                )}
              </div>

              {selectedTracks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No songs selected yet</p>
                  <p className="text-sm">Switch to the Search tab to add songs</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedTracks.map((track, index) => (
                    <Card key={track.id} className="transition-all hover:bg-accent/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="text-sm font-mono text-muted-foreground w-6">
                              {(index + 1).toString().padStart(2, '0')}
                            </div>
                            
                            <Avatar className="h-10 w-10 rounded-md">
                              <AvatarImage 
                                src={track.album.images[0]?.url} 
                                alt={track.album.name}
                              />
                              <AvatarFallback className="rounded-md">
                                {track.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{track.name}</div>
                              <div className="text-sm text-muted-foreground truncate">
                                {track.artists.map(artist => artist.name).join(', ')}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDuration(track.duration_ms)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {track.preview_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => playPreview(track)}
                                className="h-8 w-8 p-0"
                              >
                                {playingTrack === track.id ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveTrack(track.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {selectedTracks.length >= 2 && onStartGame && (
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Ready to start with {selectedTracks.length} songs
                    </div>
                    <Button onClick={onStartGame} size="lg">
                      <Play className="h-4 w-4 mr-2" />
                      Start Game
                    </Button>
                  </div>
                </div>
              )}

              {selectedTracks.length === 1 && (
                <div className="pt-4 border-t">
                  <div className="text-sm text-muted-foreground text-center">
                    Add at least one more song to start the game
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}