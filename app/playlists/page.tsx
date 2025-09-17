"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Music, Plus, Star, Users, Play } from "lucide-react"

interface Playlist {
  id: string
  name: string
  description?: string
  createdBy?: string
  isOfficial: boolean
  isPublished: boolean
  rating: number
  ratingCount: number
  creator?: {
    id: string
    name: string
    image?: string
  }
  songs: Array<{
    id: string
    title: string
    artist: string
  }>
  _count?: {
    songs: number
  }
}

export default function PlaylistsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const response = await fetch('/api/playlists')
        if (response.ok) {
          const data = await response.json()
          setPlaylists(data.playlists)
        }
      } catch (error) {
        console.error('Failed to fetch playlists:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPlaylists()
  }, [])

  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    playlist.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreatePlaylist = () => {
    router.push('/playlists/create')
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ))
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="text-lg">Loading playlists...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Playlists</h1>
          <p className="text-muted-foreground">
            Discover curated music collections for your TuneHunt games
          </p>
        </div>
        
        {session && (
          <Button onClick={handleCreatePlaylist}>
            <Plus className="h-4 w-4 mr-2" />
            Create Playlist
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Search playlists..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Playlists Grid */}
      {filteredPlaylists.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No playlists found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try a different search term' : 'Be the first to create a playlist!'}
            </p>
            {session && !searchQuery && (
              <Button onClick={handleCreatePlaylist}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Playlist
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlaylists.map((playlist) => (
            <Card key={playlist.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1">{playlist.name}</CardTitle>
                    {playlist.description && (
                      <CardDescription className="line-clamp-2 mt-1">
                        {playlist.description}
                      </CardDescription>
                    )}
                  </div>
                  {playlist.isOfficial && (
                    <Badge variant="secondary" className="ml-2">
                      Official
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Creator Info */}
                  {playlist.creator && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={playlist.creator.image} />
                        <AvatarFallback className="text-xs">
                          {playlist.creator.name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        by {playlist.creator.name}
                      </span>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Music className="h-4 w-4" />
                      <span>{playlist._count?.songs || playlist.songs?.length || 0} songs</span>
                    </div>
                    
                    {playlist.ratingCount > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="flex">{renderStars(playlist.rating)}</div>
                        <span>({playlist.ratingCount})</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => router.push(`/playlists/${playlist.id}`)}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        // TODO: Create room with this playlist
                        router.push(`/create-room?playlist=${playlist.id}`)
                      }}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Play
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}