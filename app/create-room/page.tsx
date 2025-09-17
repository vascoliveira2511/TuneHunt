"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Plus, ArrowLeft, Music, Star } from "lucide-react"
import Link from "next/link"

interface Playlist {
  id: string
  name: string
  description?: string
  isOfficial: boolean
  rating: number
  ratingCount: number
  creator?: {
    id: string
    name: string
    image?: string
  }
  _count?: {
    songs: number
  }
}

export default function CreateRoomPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [roomName, setRoomName] = useState("")
  const [maxPlayers, setMaxPlayers] = useState([8])
  const [gameMode, setGameMode] = useState<'individual' | 'playlist'>('individual')
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>("")
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)

  // Check if playlist ID is provided in URL
  useEffect(() => {
    const playlistId = searchParams.get('playlist')
    if (playlistId) {
      setGameMode('playlist')
      setSelectedPlaylist(playlistId)
    }
  }, [searchParams])

  // Load playlists when switching to playlist mode
  useEffect(() => {
    if (gameMode === 'playlist') {
      loadPlaylists()
    }
  }, [gameMode])

  const loadPlaylists = async () => {
    setLoadingPlaylists(true)
    try {
      const response = await fetch('/api/playlists')
      if (response.ok) {
        const data = await response.json()
        setPlaylists(data.playlists)
      }
    } catch (error) {
      console.error('Failed to load playlists:', error)
    } finally {
      setLoadingPlaylists(false)
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ))
  }

  const handleCreateRoom = async () => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (gameMode === 'playlist' && !selectedPlaylist) {
      alert('Please select a playlist')
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: roomName.trim() || undefined,
          maxPlayers: maxPlayers[0],
          playlistId: gameMode === 'playlist' ? selectedPlaylist : undefined
        }),
      })

      if (response.ok) {
        const room = await response.json()
        
        // Auto-join the room as host
        const joinResponse = await fetch(`/api/rooms/${room.code}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            displayName: session.user?.name || 'Host'
          }),
        })

        if (joinResponse.ok) {
          router.push(`/room/${room.code}`)
        } else {
          console.error('Failed to join created room')
          router.push(`/room/${room.code}`)
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create room')
      }
    } catch (error) {
      console.error('Failed to create room:', error)
      alert('Failed to create room')
    } finally {
      setIsCreating(false)
    }
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              You need to be signed in to create a room
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
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/rooms" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Rooms
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Room
            </CardTitle>
            <CardDescription>
              Set up a new TuneHunt game room for you and your friends
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="roomName">Room Name (Optional)</Label>
              <Input
                id="roomName"
                placeholder="Enter a name for your room..."
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                If left empty, your room will be called &quot;Unnamed Room&quot;
              </p>
            </div>

            <div className="space-y-4">
              <Label>Game Mode</Label>
              <div className="grid grid-cols-2 gap-3">
                <Card 
                  className={`cursor-pointer transition-all ${gameMode === 'individual' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
                  onClick={() => setGameMode('individual')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded-full border-2 ${gameMode === 'individual' ? 'bg-primary border-primary' : 'border-muted-foreground'}`} />
                      <div className="flex-1">
                        <h3 className="font-medium">Individual Selection</h3>
                        <p className="text-xs text-muted-foreground">Each player picks their own track</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className={`cursor-pointer transition-all ${gameMode === 'playlist' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
                  onClick={() => setGameMode('playlist')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded-full border-2 ${gameMode === 'playlist' ? 'bg-primary border-primary' : 'border-muted-foreground'}`} />
                      <div className="flex-1">
                        <h3 className="font-medium">Playlist Mode</h3>
                        <p className="text-xs text-muted-foreground">Use a curated playlist</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {gameMode === 'playlist' && (
              <div className="space-y-3">
                <Label>Select Playlist</Label>
                {loadingPlaylists ? (
                  <div className="text-center py-4">
                    <div className="text-sm text-muted-foreground">Loading playlists...</div>
                  </div>
                ) : playlists.length === 0 ? (
                  <div className="text-center py-4 border border-dashed rounded-lg">
                    <Music className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">No playlists available</p>
                    <Button variant="outline" size="sm" onClick={() => router.push('/playlists/create')}>
                      Create First Playlist
                    </Button>
                  </div>
                ) : (
                  <Select value={selectedPlaylist} onValueChange={setSelectedPlaylist}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a playlist..." />
                    </SelectTrigger>
                    <SelectContent>
                      {playlists.map((playlist) => (
                        <SelectItem key={playlist.id} value={playlist.id}>
                          <div className="flex items-center gap-2 w-full">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{playlist.name}</span>
                                {playlist.isOfficial && (
                                  <Badge variant="secondary" className="text-xs">Official</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>{playlist._count?.songs || 0} songs</span>
                                {playlist.creator && (
                                  <span>by {playlist.creator.name}</span>
                                )}
                                {playlist.ratingCount > 0 && (
                                  <div className="flex items-center gap-1">
                                    <div className="flex">{renderStars(playlist.rating)}</div>
                                    <span>({playlist.ratingCount})</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <div className="space-y-4">
              <Label>Maximum Players: {maxPlayers[0]}</Label>
              <Slider
                value={maxPlayers}
                onValueChange={setMaxPlayers}
                min={2}
                max={16}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>2 players</span>
                <span>16 players</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateRoom}
                  disabled={isCreating}
                  className="flex-1"
                >
                  {isCreating ? (
                    <>Creating...</>
                  ) : (
                    <>
                      <Users className="h-4 w-4 mr-2" />
                      Create Room
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Once created, you&apos;ll be redirected to your room where you can share the room code with friends
          </p>
        </div>
      </div>
    </div>
  )
}