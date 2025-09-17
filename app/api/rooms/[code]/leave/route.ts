import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { RoomStatus } from "@prisma/client"
import type { Session } from "next-auth"

interface Params {
  code: string
}

// POST /api/rooms/[code]/leave - Leave a room
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

    // Find the room
    const room = await prisma.room.findUnique({
      where: { code },
      include: {
        games: {
          where: {
            status: {
              in: ['SELECTING', 'PLAYING']
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

    const currentGame = room.games[0]
    
    if (currentGame) {
      // Remove user from current game
      await prisma.gameParticipant.deleteMany({
        where: {
          gameId: currentGame.id,
          userId: session.user.id
        }
      })

      // Check if this was the host leaving
      if (room.hostId === session.user.id) {
        // Get remaining participants
        const remainingParticipants = await prisma.gameParticipant.findMany({
          where: {
            gameId: currentGame.id
          },
          include: {
            user: true
          }
        })

        if (remainingParticipants.length === 0) {
          // No participants left, delete the room
          await prisma.room.delete({
            where: { code }
          })
          
          return NextResponse.json({ 
            message: 'Room deleted - no participants remaining',
            roomDeleted: true 
          })
        } else {
          // Transfer host to another participant
          const newHost = remainingParticipants[0]
          await prisma.room.update({
            where: { code },
            data: {
              hostId: newHost.userId
            }
          })
          
          return NextResponse.json({ 
            message: 'Left room successfully - host transferred',
            newHostId: newHost.userId 
          })
        }
      } else {
        // Regular participant leaving
        return NextResponse.json({ 
          message: 'Left room successfully' 
        })
      }
    } else {
      // No active game, just remove from room if host
      if (room.hostId === session.user.id) {
        // Host leaving with no active game, delete the room
        await prisma.room.delete({
          where: { code }
        })
        
        return NextResponse.json({ 
          message: 'Room deleted',
          roomDeleted: true 
        })
      } else {
        return NextResponse.json({ 
          message: 'Left room successfully' 
        })
      }
    }
  } catch (error) {
    console.error('Error leaving room:', error)
    return NextResponse.json(
      { error: 'Failed to leave room' },
      { status: 500 }
    )
  }
}