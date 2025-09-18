import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Session } from "next-auth"

interface Params {
  gameId: string
}

function calculateSimilarity(str1: string, str2: string): number {
  const cleanStr1 = str1.toLowerCase().trim()
  const cleanStr2 = str2.toLowerCase().trim()

  // Exact match
  if (cleanStr1 === cleanStr2) return 1.0

  // Simple substring check for "too close" detection
  if (cleanStr1.includes(cleanStr2) || cleanStr2.includes(cleanStr1)) {
    return 0.8
  }

  // Levenshtein distance for similarity
  const matrix = []
  for (let i = 0; i <= cleanStr2.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= cleanStr1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= cleanStr2.length; i++) {
    for (let j = 1; j <= cleanStr1.length; j++) {
      if (cleanStr2.charAt(i - 1) === cleanStr1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  const maxLength = Math.max(cleanStr1.length, cleanStr2.length)
  return 1 - matrix[cleanStr2.length][cleanStr1.length] / maxLength
}

function shouldHideGuess(guess: string, correctAnswer: string): boolean {
  const similarity = calculateSimilarity(guess, correctAnswer)
  // Hide guesses that are too close (similarity > 0.7) but not exact matches
  return similarity > 0.7 && similarity < 1.0
}

// GET /api/games/[gameId]/guesses - Get current round guesses
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { gameId } = await params

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        selectedSongs: {
          include: {
            song: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    // Get current song
    const currentSongIndex = game.currentSongIndex || 0
    let currentSong

    if (game.playlistId) {
      const playlist = await prisma.playlist.findUnique({
        where: { id: game.playlistId },
        include: {
          songs: {
            include: { song: true },
            orderBy: { position: 'asc' }
          }
        }
      })
      currentSong = playlist?.songs[currentSongIndex]?.song
    } else {
      currentSong = game.selectedSongs[currentSongIndex]?.song
    }

    if (!currentSong) {
      return NextResponse.json({ guesses: [] })
    }

    // Get all guesses for current song
    const allGuesses = await prisma.guess.findMany({
      where: {
        gameId,
        songId: currentSong.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // Filter out guesses that are too close to the correct answer
    const filteredGuesses = allGuesses.map(guess => {
      const hideTitle = shouldHideGuess(guess.guessText, currentSong.title)
      const hideArtist = shouldHideGuess(guess.guessText, currentSong.artist)

      return {
        id: guess.id,
        userId: guess.userId,
        userName: guess.user?.name || 'Unknown',
        guessType: guess.guessType,
        guessText: (hideTitle || hideArtist) ? '[Hidden - too close]' : guess.guessText,
        isCorrect: guess.isCorrect,
        pointsAwarded: guess.pointsAwarded,
        createdAt: guess.createdAt
      }
    })

    return NextResponse.json({ guesses: filteredGuesses })
  } catch (error) {
    console.error('Error getting guesses:', error)
    return NextResponse.json(
      { error: 'Failed to get guesses' },
      { status: 500 }
    )
  }
}