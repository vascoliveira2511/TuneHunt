import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { RoomStatus, GameStatus } from "@prisma/client"

interface Params {
  code: string
}

// POST /api/rooms/[code]/join - Join a room
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { code } = params
    const body = await request.json()
    const { displayName } = body

    // Find the room
    const room = await prisma.room.findUnique({
      where: { code },
      include: {
        games: {
          where: {
            status: {
              in: [GameStatus.SELECTING, GameStatus.PLAYING]
            }
          },
          include: {
            participants: true
          },
          orderBy: {
            createdAt: 'desc'
          },
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

    // Check if room is joinable
    if (room.status === RoomStatus.FINISHED) {
      return NextResponse.json(
        { error: 'Room has ended' },
        { status: 400 }
      )
    }

    // Get current game if exists
    const currentGame = room.games[0]

    if (currentGame) {
      // Check if user is already in the game
      const existingParticipant = await prisma.gameParticipant.findFirst({
        where: {
          gameId: currentGame.id,
          userId: session.user.id
        }
      })

      if (existingParticipant) {
        return NextResponse.json(
          { error: 'Already joined this game' },
          { status: 400 }
        )
      }

      // Check if game is full
      if (currentGame.participants.length >= room.maxPlayers) {
        return NextResponse.json(
          { error: 'Room is full' },
          { status: 400 }
        )
      }

      // Join existing game
      const participant = await prisma.gameParticipant.create({
        data: {
          gameId: currentGame.id,
          userId: session.user.id,
          displayName: displayName || session.user.name || 'Anonymous'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          }
        }
      })

      return NextResponse.json({
        room,
        participant,
        gameId: currentGame.id
      })
    } else {
      // No active game, create a new one
      const game = await prisma.game.create({
        data: {
          roomId: room.id,
          status: GameStatus.SELECTING,
          participants: {
            create: {
              userId: session.user.id,
              displayName: displayName || session.user.name || 'Anonymous'
            }
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                }
              }
            }
          }
        }
      })

      return NextResponse.json({
        room,
        participant: game.participants[0],
        gameId: game.id
      })
    }
  } catch (error) {
    console.error('Error joining room:', error)
    return NextResponse.json(
      { error: 'Failed to join room' },
      { status: 500 }
    )
  }
}