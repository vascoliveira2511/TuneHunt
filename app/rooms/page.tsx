"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Plus, Crown, Play, Clock, Music } from "lucide-react"

interface Room {
  id: string
  code: string
  name?: string
  maxPlayers: number
  status: string
  createdAt: string
  host: {
    id: string
    name: string
    image?: string
  }
  games: Array<{
    id: string
    status: string
    participants: Array<{
      id: string
      displayName: string
      user?: {
        id: string
        name: string
        image?: string
      }
    }>
  }>
}

export default function RoomsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [joinCode, setJoinCode] = useState("")

  // Initialize search query from URL params
  useEffect(() => {
    const urlSearch = searchParams.get('search')
    if (urlSearch) {
      setSearchQuery(urlSearch)
    }
  }, [searchParams])

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch('/api/rooms')
        if (response.ok) {
          const data = await response.json()
          setRooms(data.rooms)
        }
      } catch (error) {
        console.error('Failed to fetch rooms:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRooms()
    
    // Set up polling to refresh rooms every 10 seconds
    const pollInterval = setInterval(fetchRooms, 10000)
    
    return () => {
      clearInterval(pollInterval)
    }
  }, [])

  const handleCreateRoom = () => {
    router.push('/create-room')
  }

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) return

    try {
      const response = await fetch(`/api/rooms/${joinCode.trim()}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: session?.user?.name || 'Anonymous'
        }),
      })

      if (response.ok) {
        router.push(`/room/${joinCode.trim()}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to join room')
      }
    } catch (error) {
      console.error('Failed to join room:', error)
      alert('Failed to join room')
    }
  }

  const filteredRooms = rooms.filter(room =>
    (room.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    room.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.host.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WAITING':
        return 'bg-blue-100 text-blue-800'
      case 'SELECTING':
        return 'bg-yellow-100 text-yellow-800'
      case 'PLAYING':
        return 'bg-primary/10 text-primary'
      case 'FINISHED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'WAITING':
        return 'Waiting for Players'
      case 'SELECTING':
        return 'Selecting Tracks'
      case 'PLAYING':
        return 'Game in Progress'
      case 'FINISHED':
        return 'Game Finished'
      default:
        return status
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="text-lg">Loading rooms...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Game Rooms</h1>
          <p className="text-muted-foreground">
            Join active games or create your own room
          </p>
        </div>
        
        <Button onClick={handleCreateRoom}>
          <Plus className="h-4 w-4 mr-2" />
          Create Room
        </Button>
      </div>

      {/* Join Room Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Join a Room</CardTitle>
          <CardDescription>
            Enter a room code to join an existing game
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 max-w-sm">
            <Input
              placeholder="Enter room code..."
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleJoinRoom()
                }
              }}
            />
            <Button onClick={handleJoinRoom} disabled={!joinCode.trim()}>
              Join
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Search rooms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Rooms List */}
      {filteredRooms.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No rooms found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try a different search term' : 'No active rooms at the moment'}
            </p>
            <Button onClick={handleCreateRoom}>
              <Plus className="h-4 w-4 mr-2" />
              Create the First Room
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRooms.map((room) => {
            const currentGame = room.games[0]
            const participantCount = currentGame?.participants?.length || 0
            const canJoin = currentGame ? 
              (currentGame.status === 'SELECTING' && participantCount < room.maxPlayers) :
              (room.status === 'WAITING')
            
            return (
              <Card key={room.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          {room.name || 'Unnamed Room'}
                        </h3>
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(currentGame?.status || room.status)}
                        >
                          {getStatusText(currentGame?.status || room.status)}
                        </Badge>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {room.code}
                        </code>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-yellow-500" />
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={room.host.image} />
                            <AvatarFallback className="text-xs">
                              {room.host.name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span>{room.host.name}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{participantCount}/{room.maxPlayers}</span>
                        </div>
                        
                        {currentGame?.status === 'PLAYING' && (
                          <div className="flex items-center gap-1">
                            <Music className="h-4 w-4" />
                            <span>In Game</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatTimeAgo(room.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {canJoin ? (
                        <Button
                          onClick={() => {
                            setJoinCode(room.code)
                            handleJoinRoom()
                          }}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Join Game
                        </Button>
                      ) : (
                        <Button variant="outline" disabled>
                          {currentGame?.status === 'FINISHED' || room.status === 'FINISHED' ? 'Game Ended' : 
                           participantCount >= room.maxPlayers ? 'Room Full' : 
                           currentGame?.status === 'PLAYING' ? 'Game in Progress' :
                           'Not Available'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}