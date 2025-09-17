"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Crown, Copy, Settings } from "lucide-react"
import TrackSelection from "@/components/Game/TrackSelection"
import GamePlay from "@/components/Game/GamePlay"

interface Room {
  id: string
  code: string
  name?: string
  maxPlayers: number
  status: string
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
      score: number
      user?: {
        id: string
        name: string
        image?: string
      }
    }>
  }>
}

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const roomCode = params.code as string

  useEffect(() => {
    if (!roomCode) return

    const fetchRoom = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomCode}`)
        if (response.ok) {
          const roomData = await response.json()
          setRoom(roomData)
        } else {
          setError("Room not found")
        }
      } catch (error) {
        console.error('Error fetching room:', error)
        setError("Failed to load room")
      } finally {
        setLoading(false)
      }
    }

    fetchRoom()
  }, [roomCode])

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode)
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy room code:', error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="text-lg">Loading room...</div>
        </div>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Room Not Found</CardTitle>
            <CardDescription>
              {error || "The room you're looking for doesn't exist."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')}>
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentGame = room.games[0]
  const participants = currentGame?.participants || []
  const isHost = session?.user && 'id' in session.user ? (session.user as any).id === room.host.id : false
  const gameId = currentGame?.id
  const gameStatus = currentGame?.status

  const handleStartGame = async () => {
    if (!gameId) return
    
    try {
      const response = await fetch(`/api/games/${gameId}/start`, {
        method: 'POST'
      })
      
      if (response.ok) {
        // Refresh room data to get updated game status
        const roomResponse = await fetch(`/api/rooms/${roomCode}`)
        if (roomResponse.ok) {
          const roomData = await roomResponse.json()
          setRoom(roomData)
        }
      } else {
        const error = await response.json()
        console.error('Failed to start game:', error.error)
        alert(error.error || 'Failed to start game')
      }
    } catch (error) {
      console.error('Failed to start game:', error)
      alert('Failed to start game')
    }
  }

  const handleGameEnd = () => {
    // Refresh room data when game ends
    const fetchRoom = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomCode}`)
        if (response.ok) {
          const roomData = await response.json()
          setRoom(roomData)
        }
      } catch (error) {
        console.error('Error fetching room:', error)
      }
    }
    fetchRoom()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Room Info */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {room.name || "Unnamed Room"}
                    <Badge variant="outline">{room.status}</Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={copyRoomCode}
                      className="h-auto p-1 font-mono text-lg"
                    >
                      {roomCode}
                      <Copy className="h-4 w-4 ml-2" />
                    </Button>
                  </CardDescription>
                </div>
                {isHost && (
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={room.host.image} />
                    <AvatarFallback>{room.host.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{room.host.name}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">
                    {participants.length}/{room.maxPlayers} players
                  </span>
                </div>
              </div>

              {room.status === 'WAITING' && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h3 className="font-medium mb-2">Waiting for players...</h3>
                  <p className="text-sm text-muted-foreground">
                    Share the room code <strong>{roomCode}</strong> with your friends to get started!
                  </p>
                  {isHost && participants.length >= 2 && (
                    <Button className="mt-4">
                      Start Game
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Players List */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Players ({participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={participant.user?.image} />
                    <AvatarFallback>
                      {participant.displayName?.[0] || participant.user?.name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {participant.displayName || participant.user?.name}
                      {participant.user?.id === room.host.id && (
                        <Crown className="h-3 w-3 text-yellow-500 inline ml-1" />
                      )}
                    </div>
                    {currentGame?.status !== 'SELECTING' && (
                      <div className="text-xs text-muted-foreground">
                        Score: {participant.score}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {participants.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  No players yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Track Selection for all players when game is in SELECTING status */}
      {gameStatus === 'SELECTING' && gameId && (
        <div className="mt-8">
          <TrackSelection 
            roomCode={roomCode}
            gameId={gameId}
            currentUserId={(session?.user as any)?.id || ''}
            isHost={isHost}
            participants={participants}
            onStartGame={handleStartGame}
          />
        </div>
      )}

      {/* Game Play when game is in PLAYING status */}
      {gameStatus === 'PLAYING' && gameId && (
        <div className="mt-8">
          <GamePlay 
            roomCode={roomCode}
            gameId={gameId}
            currentUserId={(session?.user as any)?.id || ''}
            isHost={isHost}
            participants={participants}
            onGameEnd={handleGameEnd}
          />
        </div>
      )}

      {/* Game Results when game is FINISHED */}
      {gameStatus === 'FINISHED' && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Game Complete!</CardTitle>
              <CardDescription>
                Here are the final results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {participants
                  .sort((a, b) => b.score - a.score)
                  .map((participant, index) => (
                    <div key={participant.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' : 
                          index === 1 ? 'bg-gray-400 text-white' : 
                          index === 2 ? 'bg-amber-600 text-white' : 
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={participant.user?.image} />
                          <AvatarFallback>
                            {participant.displayName?.[0] || participant.user?.name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {participant.displayName || participant.user?.name}
                        </span>
                      </div>
                      <span className="font-bold text-lg">
                        {participant.score} points
                      </span>
                    </div>
                  ))}
              </div>
              {isHost && (
                <div className="mt-6 pt-6 border-t">
                  <Button onClick={() => {
                    // TODO: Implement new game logic
                    console.log('Starting new game...')
                  }}>
                    Start New Game
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}