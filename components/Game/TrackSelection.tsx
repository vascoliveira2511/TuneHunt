"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Music, Play, Pause, X, CheckCircle, Clock } from "lucide-react"
import MusicSearch from "./MusicSearch"
import type { SpotifyTrack } from "@/lib/spotify"

interface TrackSelectionProps {
  gameId: string
  currentUserId: string
  isHost: boolean
  participants: Array<{
    id: string
    displayName: string
    user?: {
      id: string
      name: string
      image?: string
    }
  }>
  onStartGame?: () => void
}

export default function TrackSelection({ gameId, currentUserId, isHost, participants, onStartGame }: TrackSelectionProps) {
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null)
  const [playingTrack, setPlayingTrack] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [allSelections, setAllSelections] = useState<Array<{
    id: string
    selectedBy: string
    song: {
      spotifyId: string
      title: string
      artist: string
      album?: string
      previewUrl?: string
      imageUrl?: string
      durationMs?: number
    }
  }>>([])
  const [, setIsLoading] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Load existing selections function
  const loadSelections = useCallback(async () => {
    try {
      const response = await fetch(`/api/games/${gameId}/selections`)
      if (response.ok) {
        const data = await response.json()
        setAllSelections(data.selections)
        
        // Find current user's selection
        const userSelection = data.selections.find((s: { selectedBy: string }) => s.selectedBy === currentUserId)
        if (userSelection) {
          // Convert from database format back to Spotify format
          const spotifyTrack: SpotifyTrack = {
            id: userSelection.song.spotifyId,
            name: userSelection.song.title,
            artists: [{ name: userSelection.song.artist }],
            album: {
              name: userSelection.song.album || '',
              images: userSelection.song.imageUrl ? [{ url: userSelection.song.imageUrl, height: 300, width: 300 }] : []
            },
            preview_url: userSelection.song.previewUrl,
            external_urls: { deezer: '' },
            duration_ms: userSelection.song.durationMs || 0,
            source: 'deezer'
          }
          setSelectedTrack(spotifyTrack)
        }
      }
    } catch (error) {
      console.error('Failed to load selections:', error)
    } finally {
      setIsLoading(false)
    }
  }, [gameId, currentUserId])

  // Load existing selections on mount
  useEffect(() => {
    loadSelections()
  }, [loadSelections])

  const handleTrackSelect = async (track: SpotifyTrack) => {
    setIsSubmitting(true)
    
    try {
      console.log('Saving track selection:', track.name, 'by', track.artists[0].name)
      
      const response = await fetch(`/api/games/${gameId}/selections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ spotifyTrack: track }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Track selection saved:', data.selection)
        setSelectedTrack(track)
        // Reload selections to update status display
        loadSelections()
      } else {
        const error = await response.json()
        console.error('Failed to save track selection:', error.error)
        alert(error.error || 'Failed to save track selection')
      }
    } catch (error) {
      console.error('Failed to save track selection:', error)
      alert('Failed to save track selection')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveSelection = async () => {
    try {
      const response = await fetch(`/api/games/${gameId}/selections`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSelectedTrack(null)
        console.log('Track selection removed')
      } else {
        const error = await response.json()
        console.error('Failed to remove track selection:', error.error)
      }
    } catch (error) {
      console.error('Failed to remove track selection:', error)
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

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Count how many players have selected tracks using real data
  const playersWithTracks = allSelections.length
  const allPlayersReady = playersWithTracks === participants.length
  const canHostStart = isHost && playersWithTracks > 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Track Selection
              </CardTitle>
              <CardDescription>
                Each player must select one track for others to guess
              </CardDescription>
            </div>
            {canHostStart && onStartGame && (
              <Button onClick={onStartGame} size="lg" variant={allPlayersReady ? "default" : "outline"}>
                {allPlayersReady ? "Start Game" : "Start Game (Some players haven't selected)"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Player's Track Selection Status */}
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-3">Your Track Selection</h3>
            
            {selectedTrack ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 rounded-md">
                    <AvatarImage 
                      src={selectedTrack.album.images[0]?.url} 
                      alt={selectedTrack.album.name}
                    />
                    <AvatarFallback className="rounded-md">
                      {selectedTrack.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="font-medium">{selectedTrack.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedTrack.artists.map(artist => artist.name).join(', ')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDuration(selectedTrack.duration_ms)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Selected
                  </Badge>
                  
                  {selectedTrack.preview_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => playPreview(selectedTrack)}
                      className="h-8 w-8 p-0"
                    >
                      {playingTrack === selectedTrack.id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveSelection}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>You haven&apos;t selected a track yet</p>
                <p className="text-sm">Search below to choose your track</p>
              </div>
            )}
          </div>

          {/* Music Search - Only show if no track selected */}
          {!selectedTrack && (
            <Tabs defaultValue="search" className="w-full">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="search">Search for Your Track</TabsTrigger>
              </TabsList>

              <TabsContent value="search" className="space-y-4">
                <MusicSearch 
                  onTrackSelect={handleTrackSelect}
                  selectedTracks={selectedTrack ? [selectedTrack] : []}
                  isLoading={isSubmitting}
                />
              </TabsContent>
            </Tabs>
          )}

          {/* Players Selection Status */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-medium mb-3">Player Status ({playersWithTracks}/{participants.length} ready)</h3>
            <div className="grid gap-3">
              {participants.map((participant) => {
                const hasSelected = allSelections.some(s => s.selectedBy === participant.user?.id)
                return (
                  <div key={participant.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={participant.user?.image} />
                        <AvatarFallback>
                          {participant.displayName?.[0] || participant.user?.name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">
                        {participant.displayName || participant.user?.name}
                      </span>
                    </div>
                    
                    <Badge variant={hasSelected ? "secondary" : "outline"}>
                      {hasSelected ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ready
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Selecting...
                        </>
                      )}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Start Game Section */}
          {isHost && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {allPlayersReady ? (
                    "All players ready! You can start the game."
                  ) : canHostStart ? (
                    `${playersWithTracks} of ${participants.length} players have selected tracks. You can start now or wait for more.`
                  ) : (
                    `Waiting for players to select tracks... (${playersWithTracks} of ${participants.length} ready)`
                  )}
                </div>
                {canHostStart && onStartGame && (
                  <Button onClick={onStartGame} size="lg" variant={allPlayersReady ? "default" : "outline"}>
                    <Play className="h-4 w-4 mr-2" />
                    {allPlayersReady ? "Start Game" : "Start Game Anyway"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}