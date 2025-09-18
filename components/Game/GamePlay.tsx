"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, SkipForward, Trophy, Clock, Music, Send } from "lucide-react"

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
  const [hasGuessedTitle, setHasGuessedTitle] = useState(false)
  const [hasGuessedArtist, setHasGuessedArtist] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

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
          startRound(data.gameState)
        }
      }
    } catch (error) {
      console.error('Failed to advance to next song:', error)
    }
  }

  const endRound = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    if (audioRef.current) {
      audioRef.current.pause()
    }

    // Show results for a moment, then move to next song
    setTimeout(() => {
      nextSong()
    }, 3000)
  }

  const startRound = (state: GameState) => {
    // Reset round state
    setTitleGuess("")
    setArtistGuess("")
    setHasGuessedTitle(false)
    setHasGuessedArtist(false)

    // Start timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    timerRef.current = setInterval(() => {
      setGameState(prev => {
        if (!prev) return prev
        const newTime = prev.timeRemaining - 1
        
        if (newTime <= 0) {
          endRound()
          return { ...prev, timeRemaining: 0, isPlaying: false }
        }
        
        return { ...prev, timeRemaining: newTime }
      })
    }, 1000)

    // Start audio if available
    console.log('🎵 Checking for audio:', {
      previewUrl: state.currentSong.previewUrl,
      currentSong: state.currentSong
    })
    
    if (state.currentSong.previewUrl) {
      console.log('🎵 Preview URL found, starting audio...')
      playAudio(state.currentSong.previewUrl)
    } else {
      console.log('❌ No preview URL available for current song')
      // TODO: Handle no-audio mode - could show lyrics, album art, or skip to answer
    }
  }

  // Load current game state
  useEffect(() => {
    const loadGameState = async () => {
      try {
        console.log('🎮 GamePlay: Loading game state for gameId:', gameId)
        const response = await fetch(`/api/games/${gameId}/state`)
        
        if (response.ok) {
          const data = await response.json()
          console.log('🎮 GamePlay: Loaded game state:', data)
          setGameState(data.gameState)
          startRound(data.gameState)
        } else {
          console.error('Failed to load game state:', response.status)
        }
      } catch (error) {
        console.error('Failed to load game state:', error)
      } finally {
        setLoading(false)
      }
    }

    loadGameState()

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [gameId]) // eslint-disable-line react-hooks/exhaustive-deps

  const playAudio = (url: string) => {
    console.log('🎵 playAudio called with URL:', url)
    
    if (audioRef.current) {
      audioRef.current.pause()
    }

    const audio = new Audio(url)
    audio.volume = 0.3
    audioRef.current = audio

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
  }

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
        
        if (guessType === 'TITLE') {
          setHasGuessedTitle(true)
        } else {
          setHasGuessedArtist(true)
        }

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

        // Clear the input
        if (guessType === 'TITLE') {
          setTitleGuess("")
        } else {
          setArtistGuess("")
        }
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
    <div className="space-y-6">
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
            <Avatar className="h-16 w-16 rounded-md">
              <AvatarImage 
                src={gameState.currentSong.imageUrl} 
                alt="Album cover"
              />
              <AvatarFallback className="rounded-md">
                <Music className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            
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
                  disabled={hasGuessedTitle || isSubmitting}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      submitGuess('TITLE', titleGuess)
                    }
                  }}
                />
                <Button
                  onClick={() => submitGuess('TITLE', titleGuess)}
                  disabled={hasGuessedTitle || isSubmitting || !titleGuess.trim()}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {hasGuessedTitle && (
                <Badge variant="secondary">Title guess submitted</Badge>
              )}
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
                  disabled={hasGuessedArtist || isSubmitting}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      submitGuess('ARTIST', artistGuess)
                    }
                  }}
                />
                <Button
                  onClick={() => submitGuess('ARTIST', artistGuess)}
                  disabled={hasGuessedArtist || isSubmitting || !artistGuess.trim()}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {hasGuessedArtist && (
                <Badge variant="secondary">Artist guess submitted</Badge>
              )}
              <div className="text-sm text-muted-foreground">
                {POINTS_ARTIST} points
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Live Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Live Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {participants
              .sort((a, b) => getPlayerScore(b.user?.id || '') - getPlayerScore(a.user?.id || ''))
              .map((participant, index) => (
                <div key={participant.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
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
                  <div className="flex items-center gap-3">
                    {gameState.roundScores[participant.user?.id || ''] > 0 && (
                      <Badge variant="secondary">
                        +{gameState.roundScores[participant.user?.id || '']}
                      </Badge>
                    )}
                    <span className="font-bold text-lg">
                      {getPlayerScore(participant.user?.id || '')}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Guesses */}
      {gameState.guesses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Guesses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {gameState.guesses.slice(-5).reverse().map((guess) => (
                <div key={guess.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{guess.userName}</span>
                    <Badge variant={guess.isCorrect ? "default" : "outline"}>
                      {guess.guessType === 'TITLE' ? 'Title' : 'Artist'}
                    </Badge>
                    <span className="text-sm">{guess.guessText}</span>
                  </div>
                  {guess.isCorrect && (
                    <Badge variant="secondary">+{guess.pointsAwarded}</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}