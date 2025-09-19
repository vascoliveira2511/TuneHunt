import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GuessType } from "@prisma/client"
import type { Session } from "next-auth"

interface Params {
  gameId: string
}

// POST /api/games/[gameId]/guess - Submit a guess
export async function POST(
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
    const body = await request.json()
    const { songId, guessType, guessText, secondsRemaining } = body

    if (!songId || !guessType || !guessText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get the game and song
    const [game, song] = await Promise.all([
      prisma.game.findUnique({
        where: { id: gameId },
        include: {
          participants: {
            where: { userId: session.user.id }
          },
          selectedSongs: {
            where: { songId },
            include: { selector: true }
          }
        }
      }),
      prisma.song.findUnique({
        where: { id: songId }
      })
    ])

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    if (!song) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      )
    }

    // Check if user is in the game
    if (game.participants.length === 0) {
      return NextResponse.json(
        { error: 'User not in game' },
        { status: 403 }
      )
    }

    // Check if user selected this song (prevent guessing own song)
    const selectedSong = game.selectedSongs[0]
    if (selectedSong && selectedSong.selectedBy === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot guess your own song!' },
        { status: 400 }
      )
    }

    // Allow unlimited guessing - removed restriction
    // Check if user already got this one correct to avoid duplicate points
    const existingCorrectGuess = await prisma.guess.findFirst({
      where: {
        gameId,
        userId: session.user.id,
        songId,
        guessType: guessType as GuessType,
        isCorrect: true
      }
    })

    if (existingCorrectGuess) {
      return NextResponse.json(
        { error: 'Already guessed this category correctly' },
        { status: 400 }
      )
    }

    // Check if guess is correct
    let isCorrect = false
    let pointsAwarded = 0

    const normalizeText = (text: string) =>
      text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ')

    // Enhanced fuzzy matching function
    const fuzzyMatch = (guess: string, correct: string): boolean => {
      const normalizedGuess = normalizeText(guess)
      const normalizedCorrect = normalizeText(correct)

      // Exact match
      if (normalizedGuess === normalizedCorrect) return true

      // Handle common variations
      const variations = [
        normalizedCorrect.replace(/^the\s+/, ''), // Remove "the" from beginning
        normalizedCorrect.replace(/\s+the\s+/, ' '), // Remove "the" from middle
        normalizedCorrect.replace(/\s+&\s+/, ' and '), // & to and
        normalizedCorrect.replace(/\s+and\s+/, ' & '), // and to &
        normalizedCorrect.replace(/\s+feat\.?\s+.*/, ''), // Remove feat. parts
        normalizedCorrect.replace(/\s+ft\.?\s+.*/, ''), // Remove ft. parts
      ]

      for (const variation of variations) {
        if (normalizedGuess === variation) return true
      }

      // Check if guess contains most of the correct answer (for partial matches)
      const words = normalizedCorrect.split(' ')
      if (words.length > 1) {
        const guessWords = normalizedGuess.split(' ')
        const matchingWords = words.filter(word =>
          guessWords.some(guessWord =>
            guessWord.includes(word) || word.includes(guessWord)
          )
        )
        // Accept if 80% of words match
        if (matchingWords.length / words.length >= 0.8) return true
      }

      return false
    }

    if (guessType === 'TITLE') {
      isCorrect = fuzzyMatch(guessText, song.title)
      pointsAwarded = isCorrect ? 100 : 0
    } else if (guessType === 'ARTIST') {
      isCorrect = fuzzyMatch(guessText, song.artist)
      pointsAwarded = isCorrect ? 50 : 0
    }

    // Apply time bonus for correct answers
    if (isCorrect && secondsRemaining > 0) {
      const timeBonus = Math.floor(secondsRemaining * 2) // 2 points per second remaining
      pointsAwarded += timeBonus
    }

    // Create the guess
    const guess = await prisma.guess.create({
      data: {
        gameId,
        userId: session.user.id,
        songId,
        guessType: guessType as GuessType,
        guessText,
        isCorrect,
        pointsAwarded,
        secondsRemaining: secondsRemaining || 0
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    })

    // Update participant score if correct
    if (isCorrect && pointsAwarded > 0) {
      // Award points to the guesser
      await prisma.gameParticipant.update({
        where: {
          gameId_userId: {
            gameId,
            userId: session.user.id
          }
        },
        data: {
          score: {
            increment: pointsAwarded
          }
        }
      })

      // Award points to the song selector (if not playlist)
      if (selectedSong && selectedSong.selectedBy && selectedSong.selectedBy !== 'playlist') {
        const selectorPoints = guessType === 'TITLE' ? 20 : 10 // 20 for title, 10 for artist

        await prisma.gameParticipant.update({
          where: {
            gameId_userId: {
              gameId,
              userId: selectedSong.selectedBy
            }
          },
          data: {
            score: {
              increment: selectorPoints
            }
          }
        })
      }
    }

    return NextResponse.json({
      guess: {
        id: guess.id,
        userId: guess.userId,
        userName: guess.user?.name || 'Anonymous',
        guessType: guess.guessType,
        guessText: guess.guessText,
        isCorrect: guess.isCorrect,
        pointsAwarded: guess.pointsAwarded
      }
    })
  } catch (error) {
    console.error('Error submitting guess:', error)
    return NextResponse.json(
      { error: 'Failed to submit guess' },
      { status: 500 }
    )
  }
}