"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Users, Crown, Copy, Settings, Trash2, LogOut, Play } from "lucide-react"
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
    playlistId?: string
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
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [roomName, setRoomName] = useState("")
  const [maxPlayers, setMaxPlayers] = useState([8])
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false)
  const [isDeletingRoom, setIsDeletingRoom] = useState(false)
  const [isLeavingRoom, setIsLeavingRoom] = useState(false)

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
    
    // Set up polling to refresh room data every 5 seconds
    const pollInterval = setInterval(fetchRoom, 5000)
    
    return () => {
      clearInterval(pollInterval)
    }
  }, [roomCode])

  // Initialize settings when room data is loaded
  useEffect(() => {
    if (room) {
      setRoomName(room.name || "")
      setMaxPlayers([room.maxPlayers])
    }
  }, [room])

  // Handle leaving room when page unloads
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (session?.user && 'id' in session.user && session.user.id && roomCode) {
        try {
          // Use sendBeacon for reliable cleanup when page unloads
          const data = JSON.stringify({});
          navigator.sendBeacon(`/api/rooms/${roomCode}/leave`, data);
        } catch (error) {
          console.error('Failed to leave room on page unload:', error);
        }
      }
    };

    const handleUnload = () => handleBeforeUnload();
    
    window.addEventListener('beforeunload', handleUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      // Also cleanup when component unmounts
      handleBeforeUnload();
    };
  }, [session?.user, roomCode])

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode)
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy room code:', error)
    }
  }

  const handleUpdateSettings = async () => {
    if (!room) return
    
    setIsUpdatingSettings(true)
    try {
      const response = await fetch(`/api/rooms/${roomCode}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: roomName.trim() || undefined,
          maxPlayers: maxPlayers[0]
        }),
      })

      if (response.ok) {
        const updatedRoom = await response.json()
        setRoom(updatedRoom)
        setSettingsOpen(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update room settings')
      }
    } catch (error) {
      console.error('Failed to update room settings:', error)
      alert('Failed to update room settings')
    } finally {
      setIsUpdatingSettings(false)
    }
  }

  const handleDeleteRoom = async () => {
    if (!room || !confirm('Are you sure you want to delete this room? This action cannot be undone.')) return
    
    setIsDeletingRoom(true)
    try {
      const response = await fetch(`/api/rooms/${roomCode}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/rooms')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete room')
      }
    } catch (error) {
      console.error('Failed to delete room:', error)
      alert('Failed to delete room')
    } finally {
      setIsDeletingRoom(false)
    }
  }

  const handleLeaveRoom = async () => {
    if (!room) return
    
    setIsLeavingRoom(true)
    try {
      const response = await fetch(`/api/rooms/${roomCode}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        router.push('/rooms')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to leave room')
      }
    } catch (error) {
      console.error('Failed to leave room:', error)
      alert('Failed to leave room')
    } finally {
      setIsLeavingRoom(false)
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
  const isHost = session?.user && 'id' in session.user ? (session.user as { id: string }).id === room.host.id : false
  const gameId = currentGame?.id
  const gameStatus = currentGame?.status
  const isPlaylistGame = currentGame?.playlistId != null

  const handleStartGame = async () => {
    console.log('handleStartGame called, gameId:', gameId)
    if (!gameId) {
      console.error('No gameId available')
      return
    }
    
    try {
      console.log('Calling start game API for gameId:', gameId)
      const response = await fetch(`/api/games/${gameId}/start`, {
        method: 'POST'
      })
      
      console.log('Start game response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Start game success:', data)
        
        // Refresh room data to get updated game status
        const roomResponse = await fetch(`/api/rooms/${roomCode}`)
        if (roomResponse.ok) {
          const roomData = await roomResponse.json()
          console.log('Room data after start:', roomData)
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
                  <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Room Settings</DialogTitle>
                        <DialogDescription>
                          Manage your room settings and preferences.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-6 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="roomName">Room Name</Label>
                          <Input
                            id="roomName"
                            placeholder="Enter room name..."
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                          />
                        </div>
                        
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
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-end gap-3">
                          <Button
                            variant="outline"
                            onClick={() => setSettingsOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleUpdateSettings}
                            disabled={isUpdatingSettings}
                          >
                            {isUpdatingSettings ? 'Updating...' : 'Save Changes'}
                          </Button>
                        </div>
                        
                        <div className="border-t pt-3 space-y-3">
                          <Button
                            variant="outline"
                            onClick={handleLeaveRoom}
                            disabled={isLeavingRoom}
                            className="w-full"
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            {isLeavingRoom ? 'Leaving...' : 'Leave Room'}
                          </Button>
                          
                          {isHost && (
                            <Button
                              variant="destructive"
                              onClick={handleDeleteRoom}
                              disabled={isDeletingRoom}
                              className="w-full"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {isDeletingRoom ? 'Deleting...' : 'Delete Room'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                {!isHost && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLeaveRoom}
                    disabled={isLeavingRoom}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {isLeavingRoom ? 'Leaving...' : 'Leave Room'}
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
                  {/* Debug info - remove later */}
                  <span className="text-xs bg-red-100 px-1 rounded">
                    Game: {currentGame?.id ? 'exists' : 'missing'}, 
                    Participants: {participants.length}
                  </span>
                </div>
              </div>

              {room.status === 'WAITING' && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h3 className="font-medium mb-2">Waiting for players...</h3>
                  <p className="text-sm text-muted-foreground">
                    Share the room code <strong>{roomCode}</strong> with your friends to get started!
                  </p>
                  {isHost && participants.length >= 1 && (
                    <Button className="mt-4" onClick={handleStartGame}>
                      {participants.length === 1 ? 'Waiting for more players...' : 'Start Game'}
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

      {/* Waiting for host to start (playlist mode) */}
      {gameStatus === 'SELECTING' && isPlaylistGame && gameId && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Ready to Start</CardTitle>
              <CardDescription>
                {isHost 
                  ? "All players have joined. Start the game when ready!"
                  : "Waiting for the host to start the game..."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isHost && (
                <Button onClick={handleStartGame} size="lg">
                  <Play className="h-4 w-4 mr-2" />
                  Start Game
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Track Selection for all players when game is in SELECTING status */}
      {gameStatus === 'SELECTING' && !isPlaylistGame && gameId && (
        <div className="mt-8">
          <TrackSelection 
            gameId={gameId}
            currentUserId={(session?.user as { id: string })?.id || ''}
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
            gameId={gameId}
            currentUserId={(session?.user as { id: string })?.id || ''}
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