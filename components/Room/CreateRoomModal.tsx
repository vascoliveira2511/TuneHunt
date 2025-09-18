"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Users, Settings } from "lucide-react"

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

interface CreateRoomModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateRoomModal({ open, onOpenChange }: CreateRoomModalProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)
  const [gameMode, setGameMode] = useState<'individual' | 'playlist'>('individual')
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>("")
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [formData, setFormData] = useState({
    name: "",
    maxPlayers: 8
  })

  // Load playlists when switching to playlist mode
  useEffect(() => {
    if (gameMode === 'playlist' && open) {
      loadPlaylists()
    }
  }, [gameMode, open])

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

  // Removed renderStars function as it's not used in the compact modal version

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return

    if (gameMode === 'playlist' && !selectedPlaylist) {
      alert('Please select a playlist')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim() || undefined,
          maxPlayers: formData.maxPlayers,
          playlistId: gameMode === 'playlist' ? selectedPlaylist : undefined
        }),
      })

      if (response.ok) {
        const room = await response.json()
        onOpenChange(false)
        router.push(`/room/${room.code}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create room')
      }
    } catch (error) {
      console.error('Error creating room:', error)
      alert('Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Sign In Required</DialogTitle>
            <DialogDescription>
              You need to sign in to create a room.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Create Room
          </DialogTitle>
          <DialogDescription>
            Set up a new room for your friends to join.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Room Name</Label>
              <Input
                id="name"
                placeholder="Enter room name (optional)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-3">
              <Label>Game Mode</Label>
              <div className="grid grid-cols-2 gap-2">
                <Card
                  className={`cursor-pointer transition-all ${gameMode === 'individual' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
                  onClick={() => setGameMode('individual')}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full border-2 ${gameMode === 'individual' ? 'bg-primary border-primary' : 'border-muted-foreground'}`} />
                      <div className="flex-1">
                        <h3 className="text-sm font-medium">Individual</h3>
                        <p className="text-xs text-muted-foreground">Players pick tracks</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all ${gameMode === 'playlist' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
                  onClick={() => setGameMode('playlist')}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full border-2 ${gameMode === 'playlist' ? 'bg-primary border-primary' : 'border-muted-foreground'}`} />
                      <div className="flex-1">
                        <h3 className="text-sm font-medium">Playlist</h3>
                        <p className="text-xs text-muted-foreground">Curated tracks</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {gameMode === 'playlist' && (
              <div className="space-y-2">
                <Label>Select Playlist</Label>
                {loadingPlaylists ? (
                  <div className="text-center py-2">
                    <div className="text-sm text-muted-foreground">Loading...</div>
                  </div>
                ) : playlists.length === 0 ? (
                  <div className="text-center py-2">
                    <p className="text-sm text-muted-foreground">No playlists available</p>
                  </div>
                ) : (
                  <Select value={selectedPlaylist} onValueChange={setSelectedPlaylist}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose playlist..." />
                    </SelectTrigger>
                    <SelectContent>
                      {playlists.map((playlist) => (
                        <SelectItem key={playlist.id} value={playlist.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{playlist.name}</span>
                            {playlist.isOfficial && (
                              <Badge variant="secondary" className="text-xs">Official</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              ({playlist._count?.songs || 0} songs)
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="maxPlayers" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Max Players
              </Label>
              <Input
                id="maxPlayers"
                type="number"
                min="2"
                max="16"
                value={formData.maxPlayers}
                onChange={(e) => setFormData({ ...formData, maxPlayers: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Room'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}