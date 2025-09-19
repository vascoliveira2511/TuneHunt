"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Play, Pause, SkipForward, Trophy, Clock, Music, Send, User } from "lucide-react"
import { getProxyAudioUrl, needsAudioProxy } from "@/lib/audio-proxy"

interface GamePlayProps {
  gameId: string
  currentUserId: string
  isHost: boolean
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
  onGameEnd?: () => void
}

interface GameState {
  currentSongIndex: number
  currentSong: {
    id: string
    title: string
    artist: string
    album?: string
    previewUrl?: string
    imageUrl?: string
    selectedBy: string
  }
  timeRemaining: number
  isPlaying: boolean
  guesses: Array<{
    id: string
    userId: string
    userName: string
    guessType: 'TITLE' | 'ARTIST'
    guessText: string
    isCorrect: boolean
    pointsAwarded: number
  }>
  roundScores: Record<string, number>
}

export default function GamePlay({ gameId, currentUserId, isHost, participants, onGameEnd }: GamePlayProps) {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [loading, setLoading] = useState(true)
  const [titleGuess, setTitleGuess] = useState("")
  const [artistGuess, setArtistGuess] = useState("")
  // Remove guess limitations - allow unlimited attempts
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSongIntro, setShowSongIntro] = useState(false)
  const [showRoundEnd, setShowRoundEnd] = useState(false)
  const [isAdvancingRound, setIsAdvancingRound] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('connected')
  const [retryCount, setRetryCount] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playAudioRef = useRef<((url: string, serverStartTime?: number) => void) | null>(null)

  const ROUND_DURATION = 30 // seconds
  const POINTS_TITLE = 100
  const POINTS_ARTIST = 50

  const nextSong = async () => {
    if (!isHost) return

    try {
      const response = await fetch(`/api/games/${gameId}/next`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.gameComplete) {
          onGameEnd?.()
        } else {
          setGameState(data.gameState)
          // Game state will auto-start based on polling
        }
      }
    } catch (error) {
      console.error('Failed to advance to next song:', error)
    }
  }

  // Server now handles round timing automatically

  const startServerRound = async () => {
    if (!isHost) return

    try {
      const response = await fetch(`/api/games/${gameId}/start-round`, {
        method: 'POST'
      })

      if (response.ok) {
        console.log('🎮 Server round started successfully')
        // The polling will pick up the state change and start audio/UI automatically
      } else {
        console.error('Failed to start server round:', response.status)
      }
    } catch (error) {
      console.error('Failed to start server round:', error)
    }
  }

  // Load current game state and set up polling for real-time updates
  useEffect(() => {
    const loadGameState = async () => {
      try {
        console.log('🎮 GamePlay: Loading game state for gameId:', gameId)
        const response = await fetch(`/api/games/${gameId}/state`)

        if (response.ok) {
          const data = await response.json()
          console.log('🎮 GamePlay: Loaded game state:', data)
          setGameState(data.gameState)

          // Start playing if round has already started
          if (data.gameState.isPlaying && data.gameState.currentSong.previewUrl) {
            playAudio(data.gameState.currentSong.previewUrl)
          }
        } else {
          console.error('Failed to load game state:', response.status)
        }
      } catch (error) {
        console.error('Failed to load game state:', error)
      } finally {
        setLoading(false)
      }
    }

    // Poll for complete game state changes (including round progression)
    const pollGameState = async () => {
      try {
        const response = await fetch(`/api/games/${gameId}/state`)
        if (response.ok) {
          const data = await response.json()

          setGameState(prev => {
            if (!prev) {
              // First load
              if (data.gameState.isPlaying && data.gameState.currentSong.previewUrl) {
                playAudioRef.current?.(data.gameState.currentSong.previewUrl, data.gameState.roundStartTimestamp)
              }
              return data.gameState
            }

            // Check if round has changed
            if (prev.currentSongIndex !== data.gameState.currentSongIndex) {
              console.log('🔄 Round changed, updating state')

              // Auto-play new song if round is active
              if (data.gameState.isPlaying && data.gameState.currentSong.previewUrl) {
                playAudioRef.current?.(data.gameState.currentSong.previewUrl, data.gameState.roundStartTimestamp)
              }

              // Show song intro for new round
              setShowSongIntro(true)
              setTimeout(() => setShowSongIntro(false), 3000)

              return data.gameState
            }

            // Check if round just started
            if (!prev.isPlaying && data.gameState.isPlaying) {
              console.log('▶️ Round started')
              if (data.gameState.currentSong.previewUrl) {
                playAudioRef.current?.(data.gameState.currentSong.previewUrl, data.gameState.roundStartTimestamp)
              }
            }

            // Check if round ended
            if (prev.timeRemaining > 0 && data.gameState.timeRemaining === 0) {
              console.log('⏰ Round ended')
              if (audioRef.current) {
                audioRef.current.pause()
              }
              setShowRoundEnd(true)
              setTimeout(() => setShowRoundEnd(false), 5000)

              // Auto-advance to next round after 7 seconds (2s after modal closes)
              if (isHost && !isAdvancingRound) {
                setIsAdvancingRound(true)
                setTimeout(async () => {
                  try {
                    const nextResponse = await fetch(`/api/games/${gameId}/next`, {
                      method: 'POST'
                    })
                    if (nextResponse.ok) {
                      console.log('🎮 Auto-advanced to next round')
                    }
                  } catch (error) {
                    console.error('Failed to auto-advance:', error)
                  } finally {
                    setIsAdvancingRound(false)
                  }
                }, 7000)
              }
            }

            // Add debug logging for selectedBy sync
            console.log('🔍 Client - selectedBy:', data.gameState.currentSong.selectedBy, 'currentUserId:', currentUserId, 'matches:', data.gameState.currentSong.selectedBy === currentUserId)

            // Update the state with server timing
            return {
              ...prev,
              ...data.gameState
            }
          })
        }

        // Reset retry count on successful poll
        if (retryCount > 0) {
          setRetryCount(0)
          setConnectionStatus('connected')
        }
      } catch (error) {
        console.error('Failed to poll game state:', error)
        setConnectionStatus('error')

        // Implement exponential backoff for retries
        const newRetryCount = retryCount + 1
        setRetryCount(newRetryCount)

        if (newRetryCount < 5) {
          console.log(`🔄 Retrying in ${newRetryCount * 1000}ms...`)
          setTimeout(() => {
            pollGameState()
          }, newRetryCount * 1000)
        } else {
          setConnectionStatus('disconnected')
          console.error('⚠️ Max retries reached, stopping polling')
        }
      }
    }

    loadGameState()

    // Poll for complete game state more frequently for better sync (500ms during active play)
    const gameStateInterval = setInterval(pollGameState, 500)

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      clearInterval(gameStateInterval)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, isHost, currentUserId, isAdvancingRound, retryCount])

  const playAudio = useCallback((url: string, serverStartTime?: number) => {
    // Use proxy for Deezer URLs to avoid CORS issues
    const audioUrl = needsAudioProxy(url) ? getProxyAudioUrl(url) : url

    console.log('🎵 playAudio called with URL:', audioUrl, 'serverStartTime:', serverStartTime, needsAudioProxy(url) ? '(proxied)' : '(direct)')

    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause()
    }
    const audio = new Audio(audioUrl)
    audio.volume = 0.3
    audioRef.current = audio

    // Calculate audio sync offset if server start time is provided
    if (serverStartTime) {
      const clientTime = Date.now()
      const elapsedMs = clientTime - serverStartTime
      const elapsedSeconds = Math.max(0, elapsedMs / 1000)

      console.log('🎵 Audio sync - elapsed since server start:', elapsedSeconds, 'seconds')

      // Only apply offset if it's reasonable (not too far ahead)
      if (elapsedSeconds < 30) {
        audio.currentTime = elapsedSeconds
      }
    }

    console.log('🔊 Attempting to play audio...')
    audio.play()
      .then(() => {
        console.log('✅ Audio playing successfully')
      })
      .catch((error) => {
        console.error('❌ Audio play failed:', error)
      })
    
    setGameState(prev => prev ? { ...prev, isPlaying: true } : prev)

    audio.onended = () => {
      console.log('🔚 Audio ended')
      setGameState(prev => prev ? { ...prev, isPlaying: false } : prev)
    }
  }, [])

  // Assign to ref to avoid circular dependency
  playAudioRef.current = playAudio

  const toggleAudio = () => {
    if (!audioRef.current || !gameState) return

    if (gameState.isPlaying) {
      audioRef.current.pause()
      setGameState(prev => prev ? { ...prev, isPlaying: false } : prev)
    } else {
      audioRef.current.play().catch(console.error)
      setGameState(prev => prev ? { ...prev, isPlaying: true } : prev)
    }
  }

  const submitGuess = async (guessType: 'TITLE' | 'ARTIST', guessText: string) => {
    if (!gameState || isSubmitting || !guessText.trim()) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/games/${gameId}/guess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          songId: gameState.currentSong.id,
          guessType,
          guessText: guessText.trim(),
          secondsRemaining: gameState.timeRemaining
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Note: Removed guess limitations - players can guess multiple times

        // Update game state with new guess
        setGameState(prev => {
          if (!prev) return prev
          return {
            ...prev,
            guesses: [...prev.guesses, data.guess],
            roundScores: {
              ...prev.roundScores,
              [currentUserId]: (prev.roundScores[currentUserId] || 0) + data.guess.pointsAwarded
            }
          }
        })

        // Show success feedback for correct guesses
        if (data.guess.isCorrect) {
          console.log(`🎉 Correct ${guessType} guess! +${data.guess.pointsAwarded} points`)
        }

        // Clear the input
        if (guessType === 'TITLE') {
          setTitleGuess("")
        } else {
          setArtistGuess("")
        }
      } else {
        const errorData = await response.json()
        console.error('Guess failed:', errorData.error)
        // Could add toast notification here
      }
    } catch (error) {
      console.error('Failed to submit guess:', error)
    } finally {
      setIsSubmitting(false)
    }
  }


  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getPlayerScore = (participantId: string) => {
    const participant = participants.find(p => p.user?.id === participantId)
    if (!participant) return 0
    return participant.score + (gameState?.roundScores[participantId] || 0)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-lg">Starting game...</div>
      </div>
    )
  }

  if (!gameState) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-lg text-destructive">Failed to load game</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Game Area */}
      <div className="flex-1 space-y-6">
      {/* Game Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Round {gameState.currentSongIndex + 1}
              </CardTitle>
              <CardDescription>
                Guess the song title and artist
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-mono text-lg">
                  {formatTime(gameState.timeRemaining)}
                </span>
              </div>
              {gameState.timeRemaining === 0 && (
                <Badge variant="destructive">Time&apos;s up!</Badge>
              )}
              {connectionStatus !== 'connected' && (
                <Badge variant={connectionStatus === 'error' ? 'destructive' : 'secondary'}>
                  {connectionStatus === 'error' ? `Reconnecting... (${retryCount}/5)` : 'Disconnected'}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress 
            value={(gameState.timeRemaining / ROUND_DURATION) * 100} 
            className="w-full h-2"
          />
        </CardContent>
      </Card>

      {/* Current Song */}
      <Card>
        <CardHeader>
          <CardTitle>Current Song</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {/* Hide album cover during gameplay to prevent cheating */}
            {gameState.timeRemaining === 0 ? (
              <Avatar className="h-16 w-16 rounded-md">
                <AvatarImage
                  src={gameState.currentSong.imageUrl}
                  alt="Album cover"
                />
                <AvatarFallback className="rounded-md">
                  <Music className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center">
                <Music className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            
            <div className="flex-1">
              <div className="text-sm text-muted-foreground mb-1">
                Selected by {participants.find(p => p.user?.id === gameState.currentSong.selectedBy)?.displayName}
              </div>
              {gameState.timeRemaining === 0 && (
                <div className="space-y-1">
                  <div className="font-semibold">{gameState.currentSong.title}</div>
                  <div className="text-muted-foreground">{gameState.currentSong.artist}</div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {gameState.currentSong.previewUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAudio}
                  disabled={gameState.timeRemaining === 0}
                >
                  {gameState.isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              )}
              
              {isHost && !gameState.isPlaying && gameState.timeRemaining === 30 && (
                <Button onClick={startServerRound} size="sm" className="btn-premium">
                  <Play className="h-4 w-4 mr-2" />
                  Start Round
                </Button>
              )}

              {isHost && gameState.timeRemaining === 0 && (
                <Button onClick={nextSong} size="sm">
                  <SkipForward className="h-4 w-4 mr-2" />
                  Next Song
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guess Section */}
      {gameState.timeRemaining > 0 && (
        <>
          {/* Show message if user selected this song */}
          {gameState.currentSong.selectedBy && gameState.currentSong.selectedBy === currentUserId && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Music className="h-5 w-5" />
                  <span className="font-medium">This is your song! Enjoy watching others guess 🎵</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Guess inputs - disabled for song selector */}
          {(!gameState.currentSong.selectedBy || gameState.currentSong.selectedBy !== currentUserId) && (
            <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Guess the Title</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Song title..."
                  value={titleGuess}
                  onChange={(e) => setTitleGuess(e.target.value)}
                  disabled={isSubmitting || gameState.timeRemaining === 0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      submitGuess('TITLE', titleGuess)
                    }
                  }}
                />
                <Button
                  onClick={() => submitGuess('TITLE', titleGuess)}
                  disabled={isSubmitting || !titleGuess.trim() || gameState.timeRemaining === 0}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                You can guess multiple times!
              </div>
              <div className="text-sm text-muted-foreground">
                {POINTS_TITLE} points
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Guess the Artist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Artist name..."
                  value={artistGuess}
                  onChange={(e) => setArtistGuess(e.target.value)}
                  disabled={isSubmitting || gameState.timeRemaining === 0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      submitGuess('ARTIST', artistGuess)
                    }
                  }}
                />
                <Button
                  onClick={() => submitGuess('ARTIST', artistGuess)}
                  disabled={isSubmitting || !artistGuess.trim() || gameState.timeRemaining === 0}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                You can guess multiple times!
              </div>
              <div className="text-sm text-muted-foreground">
                {POINTS_ARTIST} points
              </div>
            </CardContent>
          </Card>
        </div>
          )}
        </>
      )}


      </div>

      {/* Right Sidebar - Chat & Scores */}
      <div className="w-full lg:w-80 space-y-4">
        {/* Live Guesses */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Live Guesses</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {gameState.guesses.length > 0 ? (
                gameState.guesses.slice(-20).reverse().map((guess, index) => (
                  <div
                    key={`${guess.id}-${index}`}
                    className={`flex items-start gap-2 p-2 rounded text-sm ${
                      guess.isCorrect ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                    }`}
                  >
                    <Avatar className="h-6 w-6 mt-0.5">
                      <AvatarFallback className="text-xs">
                        {guess.userName?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="font-medium truncate">{guess.userName}</span>
                        <Badge variant={guess.isCorrect ? "default" : "outline"} className="text-xs">
                          {guess.guessType === 'TITLE' ? 'Title' : 'Artist'}
                        </Badge>
                        {guess.isCorrect && (
                          <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">
                            +{guess.pointsAwarded}
                          </Badge>
                        )}
                      </div>
                      <div className={`text-xs ${guess.isCorrect ? 'font-medium text-primary' : 'text-muted-foreground'} truncate`}>
                        {guess.isCorrect && gameState.timeRemaining > 0
                          ? '✓ Correct!'
                          : guess.guessText
                        }
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  No guesses yet. Be the first to guess!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live Scores */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5" />
              Live Scores
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-2">
              {participants
                .sort((a, b) => getPlayerScore(b.user?.id || '') - getPlayerScore(a.user?.id || ''))
                .map((participant, index) => (
                  <div
                    key={participant.user?.id || index}
                    className={`flex items-center justify-between p-2 rounded ${
                      index === 0 ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono w-6">
                        #{index + 1}
                      </span>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={participant.user?.image} />
                        <AvatarFallback className="text-xs">
                          {participant.displayName?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm truncate">
                        {participant.displayName}
                      </span>
                    </div>
                    <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs">
                      {getPlayerScore(participant.user?.id || '')}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat Input */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Chat</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target as HTMLFormElement)
                const message = formData.get('message') as string
                if (message.trim()) {
                  // For now, we'll add it as a guess with special type
                  console.log('Chat message:', message)
                  ;(e.target as HTMLFormElement).reset()
                }
              }}
              className="flex gap-2"
            >
              <Input
                name="message"
                placeholder="Type a message..."
                className="flex-1 text-sm"
                disabled={!gameState}
              />
              <Button type="submit" size="sm" variant="outline">
                <Send className="h-3 w-3" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Song Intro Modal */}
      <Dialog open={showSongIntro} onOpenChange={setShowSongIntro}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">🎵 Next Song</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4 py-4">
            <div className="flex items-center justify-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={participants.find(p => p.user?.id === gameState?.currentSong.selectedBy)?.user?.image}
                />
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm text-muted-foreground">Selected by</div>
                <div className="font-semibold">
                  {gameState?.currentSong.selectedBy === 'playlist'
                    ? 'Playlist'
                    : participants.find(p => p.user?.id === gameState?.currentSong.selectedBy)?.displayName || 'Unknown'
                  }
                </div>
              </div>
            </div>
            <div className="text-lg">
              Round {(gameState?.currentSongIndex || 0) + 1}
            </div>
            <div className="text-sm text-muted-foreground">
              Get ready to guess the song title and artist!
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Round End Modal */}
      <Dialog open={showRoundEnd} onOpenChange={setShowRoundEnd}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">🎵 Round Complete!</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Song Details */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 rounded-md">
                <AvatarImage
                  src={gameState?.currentSong.imageUrl}
                  alt="Album cover"
                />
                <AvatarFallback className="rounded-md">
                  <Music className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-bold text-lg">{gameState?.currentSong.title}</div>
                <div className="text-muted-foreground text-base">{gameState?.currentSong.artist}</div>
                {gameState?.currentSong.album && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Album: {gameState.currentSong.album}
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-2">
                  Selected by: {gameState?.currentSong.selectedBy === 'playlist'
                    ? 'Playlist'
                    : participants.find(p => p.user?.id === gameState?.currentSong.selectedBy)?.displayName || 'Unknown'
                  }
                </div>
              </div>
            </div>

            {/* Round Winners */}
            {gameState?.guesses.filter(g => g.isCorrect).length > 0 && (
              <div>
                <div className="font-semibold mb-2">🏆 Correct Guesses:</div>
                <div className="space-y-1">
                  {gameState.guesses
                    .filter(g => g.isCorrect)
                    .reduce((acc, guess) => {
                      const existing = acc.find(item => item.userId === guess.userId)
                      if (existing) {
                        existing.totalPoints += guess.pointsAwarded
                        existing.guesses.push(guess)
                      } else {
                        acc.push({
                          userId: guess.userId,
                          userName: guess.userName,
                          totalPoints: guess.pointsAwarded,
                          guesses: [guess]
                        })
                      }
                      return acc
                    }, [] as Array<{userId: string, userName: string, totalPoints: number, guesses: Array<{guessType: string, pointsAwarded: number}>}>)
                    .sort((a, b) => b.totalPoints - a.totalPoints)
                    .map((winner) => (
                      <div key={winner.userId} className="flex items-center justify-between p-2 bg-primary/10 rounded dark:bg-primary/10">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{winner.userName}</span>
                          <div className="text-xs text-muted-foreground">
                            {winner.guesses.map(g => g.guessType).join(', ')}
                          </div>
                        </div>
                        <Badge variant="secondary">+{winner.totalPoints}</Badge>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            <div className="text-center text-sm text-muted-foreground">
              Next round starting automatically...
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}