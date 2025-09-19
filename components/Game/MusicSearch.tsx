"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, Play, Pause, Plus, Volume2, VolumeX } from "lucide-react"
import type { SpotifyTrack } from "@/lib/spotify"
import { Loading, MusicSearchSkeleton } from "@/components/ui/loading"

interface MusicSearchProps {
  onTrackSelect: (track: SpotifyTrack) => void
  selectedTracks?: SpotifyTrack[]
  isLoading?: boolean
}

export default function MusicSearch({ onTrackSelect, selectedTracks = [] }: MusicSearchProps) {
  const [query, setQuery] = useState("")
  const [tracks, setTracks] = useState<SpotifyTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [playingTrack, setPlayingTrack] = useState<string | null>(null)
  const [audioVolume, setAudioVolume] = useState(0.3)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const searchTracks = useCallback(async (searchQuery: string) => {
    console.log('🔍 Starting search for:', searchQuery)
    
    if (!searchQuery.trim()) {
      console.log('❌ Empty search query, clearing tracks')
      setTracks([])
      return
    }

    console.log('⏳ Setting loading to true')
    setLoading(true)
    
    try {
      const url = `/api/spotify/search?q=${encodeURIComponent(searchQuery)}&limit=10`
      console.log('🌐 Fetching URL:', url)
      
      const response = await fetch(url)
      console.log('📡 Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Response data:', data)
        console.log('🎵 First track preview_url:', data.tracks[0]?.preview_url)
        setTracks(data.tracks || [])
      } else {
        const errorData = await response.text()
        console.error('❌ API Error:', response.status, errorData)
        setTracks([])
      }
    } catch (error) {
      console.error('💥 Network Error:', error)
      setTracks([])
    } finally {
      console.log('🏁 Setting loading to false')
      setLoading(false)
    }
  }, [])

  const handleSearch = () => {
    console.log('🎯 handleSearch called with query:', query)
    searchTracks(query)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const playPreview = (track: SpotifyTrack) => {
    if (!track.preview_url) {
      console.warn('No preview URL available for track:', track.name)
      return
    }

    // Note: Deezer preview URLs may have CORS restrictions
    console.log('🎵 Attempting to play preview URL:', track.preview_url)

    if (playingTrack === track.id) {
      audioRef.current?.pause()
      setPlayingTrack(null)
      return
    }

    if (audioRef.current) {
      audioRef.current.pause()
    }

    console.log('🎵 Attempting to play preview:', track.preview_url)

    const audio = new Audio()
    audio.volume = audioVolume
    audioRef.current = audio

    // Set source
    audio.src = track.preview_url

    audio.play()
      .then(() => {
        console.log('✅ Preview playing successfully')
        setPlayingTrack(track.id)
      })
      .catch((error) => {
        console.error('❌ Failed to play preview:', error)
        console.error('URL:', track.preview_url)

        // Show user-friendly message for CORS issues
        if (track.preview_url && track.preview_url.includes('dzcdn.net')) {
          console.log('💡 This Deezer track preview cannot play due to browser restrictions. This is a known limitation.')
        }
        setPlayingTrack(null)
      })

    audio.onended = () => {
      console.log('🔚 Preview ended')
      setPlayingTrack(null)
    }

    audio.onerror = () => {
      console.error('🚫 Audio error occurred')
      setPlayingTrack(null)
    }
  }


  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const isTrackSelected = (track: SpotifyTrack) => {
    return selectedTracks.some(selected => selected.id === track.id)
  }

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search for songs, artists, or albums... 🎵"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        <Button onClick={handleSearch} disabled={loading || !query.trim()} className="btn-premium">
          {loading ? <Loading variant="spinner" size="sm" /> : "Search"}
        </Button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-2">
        <VolumeX className="h-4 w-4 text-muted-foreground" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={audioVolume}
          onChange={(e) => {
            const volume = parseFloat(e.target.value)
            setAudioVolume(volume)
            if (audioRef.current) {
              audioRef.current.volume = volume
            }
          }}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <Volume2 className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Search Results */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {loading ? (
          <MusicSearchSkeleton />
        ) : (
          tracks.map((track) => (
          <Card key={track.id} className="card-premium">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="h-12 w-12 rounded-md">
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
                    <div className="text-xs text-muted-foreground truncate">
                      {track.album.name} • {formatDuration(track.duration_ms)}
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
                    variant={isTrackSelected(track) ? "secondary" : "default"}
                    size="sm"
                    onClick={() => onTrackSelect(track)}
                    disabled={isTrackSelected(track)}
                    className="h-8"
                  >
                    {isTrackSelected(track) ? (
                      <Badge variant="secondary" className="h-6 px-2">
                        Added
                      </Badge>
                    ) : (
                      <>
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          ))
        )}

        {tracks.length === 0 && query && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            No tracks found for &quot;{query}&quot;. Try different keywords!
          </div>
        )}
      </div>
    </div>
  )
}