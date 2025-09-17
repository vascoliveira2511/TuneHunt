import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { RoomStatus } from "@prisma/client"
import type { Session } from "next-auth"

// Generate a unique room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// GET /api/rooms - Get all active rooms
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where = {
      status: {
        in: [RoomStatus.WAITING, RoomStatus.SELECTING, RoomStatus.PLAYING]
      },
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { code: { contains: search, mode: 'insensitive' as const } },
          { host: { name: { contains: search, mode: 'insensitive' as const } } }
        ]
      })
    }

    const rooms = await prisma.room.findMany({
      where,
      include: {
        host: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        games: {
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
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: [
        { status: 'asc' }, // WAITING first, then SELECTING, then PLAYING
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    })

    const total = await prisma.room.count({ where })

    return NextResponse.json({
      rooms,
      total,
      hasMore: offset + limit < total
    })
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    )
  }
}

// POST /api/rooms - Create a new room
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, maxPlayers = 8, settings = {} } = body

    // Generate unique room code
    let roomCode = generateRoomCode()
    let codeExists = await prisma.room.findUnique({
      where: { code: roomCode }
    })

    // Keep generating until we get a unique code
    while (codeExists) {
      roomCode = generateRoomCode()
      codeExists = await prisma.room.findUnique({
        where: { code: roomCode }
      })
    }

    const room = await prisma.room.create({
      data: {
        code: roomCode,
        hostId: session.user.id,
        name,
        maxPlayers,
        settings: JSON.stringify(settings),
        status: RoomStatus.WAITING
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        }
      }
    })

    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    )
  }
}