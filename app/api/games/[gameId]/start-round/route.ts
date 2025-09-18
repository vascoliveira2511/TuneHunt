import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Session } from "next-auth"

interface Params {
  gameId: string
}

// POST /api/games/[gameId]/start-round - Start the current round with server-side timer
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

    // Get the game
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        room: true
      }
    })

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    // Check if user is host
    const isHost = session.user.id === game.room.hostId
    if (!isHost) {
      return NextResponse.json(
        { error: 'Only the host can start rounds' },
        { status: 403 }
      )
    }

    if (game.status !== 'PLAYING') {
      return NextResponse.json(
        { error: 'Game is not currently playing' },
        { status: 400 }
      )
    }

    // Start the round with server-side timer
    const now = new Date()
    await prisma.game.update({
      where: { id: gameId },
      data: {
        roundStartedAt: now
      }
    })

    return NextResponse.json({
      success: true,
      roundStartedAt: now
    })
  } catch (error) {
    console.error('Error starting round:', error)
    return NextResponse.json(
      { error: 'Failed to start round' },
      { status: 500 }
    )
  }
}