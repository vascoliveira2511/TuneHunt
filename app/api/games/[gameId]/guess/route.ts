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

    // Check if user already guessed this type for this song
    const existingGuess = await prisma.guess.findFirst({
      where: {
        gameId,
        userId: session.user.id,
        songId,
        guessType: guessType as GuessType
      }
    })

    if (existingGuess) {
      return NextResponse.json(
        { error: 'Already guessed this category for this song' },
        { status: 400 }
      )
    }

    // Check if guess is correct
    let isCorrect = false
    let pointsAwarded = 0

    const normalizeText = (text: string) => 
      text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ')

    if (guessType === 'TITLE') {
      isCorrect = normalizeText(guessText) === normalizeText(song.title)
      pointsAwarded = isCorrect ? 100 : 0
    } else if (guessType === 'ARTIST') {
      isCorrect = normalizeText(guessText) === normalizeText(song.artist)
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