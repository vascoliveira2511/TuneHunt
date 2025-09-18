import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GameStatus, RoomStatus } from "@prisma/client"
import type { Session } from "next-auth"

interface Params {
  code: string
}

// POST /api/rooms/[code]/new-game - Create a new game for the room
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

    const { code } = await params

    // Get the room
    const room = await prisma.room.findUnique({
      where: { code },
      include: {
        games: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    // Check if user is host
    if (session.user.id !== room.hostId) {
      return NextResponse.json(
        { error: 'Only the host can start a new game' },
        { status: 403 }
      )
    }

    // Check if current game is finished
    const currentGame = room.games[0]
    if (currentGame && currentGame.status !== GameStatus.FINISHED) {
      return NextResponse.json(
        { error: 'Current game is not finished yet' },
        { status: 400 }
      )
    }

    // Get participants from the current finished game
    let previousParticipants: any[] = []
    if (currentGame) {
      const gameWithParticipants = await prisma.game.findUnique({
        where: { id: currentGame.id },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true
                }
              }
            }
          }
        }
      })
      previousParticipants = gameWithParticipants?.participants || []
    }

    // Create new game
    const newGame = await prisma.game.create({
      data: {
        roomId: room.id,
        status: GameStatus.SELECTING,
        playlistId: (room as any).playlistId || null,
        participants: {
          create: previousParticipants.map((participant: any) => ({
            userId: participant.userId,
            displayName: participant.displayName,
            score: 0
          }))
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        }
      }
    })

    // Update room status to PLAYING
    await prisma.room.update({
      where: { id: room.id },
      data: {
        status: RoomStatus.PLAYING
      }
    })

    return NextResponse.json({
      success: true,
      gameId: newGame.id
    })
  } catch (error) {
    console.error('Error creating new game:', error)
    return NextResponse.json(
      { error: 'Failed to create new game' },
      { status: 500 }
    )
  }
}