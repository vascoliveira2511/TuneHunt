import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Session } from "next-auth"

interface Params {
  code: string
}

// GET /api/rooms/[code] - Get room by code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { code } = await params

    const room = await prisma.room.findUnique({
      where: { code },
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
                    image: true,
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
      }
    })

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(room)
  } catch (error) {
    console.error('Error fetching room:', error)
    return NextResponse.json(
      { error: 'Failed to fetch room' },
      { status: 500 }
    )
  }
}

// PUT /api/rooms/[code] - Update room (host only)
export async function PUT(
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
    const body = await request.json()

    // Find the room and verify the user is the host
    const room = await prisma.room.findUnique({
      where: { code }
    })

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    if (room.hostId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the host can update room settings' },
        { status: 403 }
      )
    }

    const updatedRoom = await prisma.room.update({
      where: { code },
      data: {
        name: body.name,
        maxPlayers: body.maxPlayers,
        settings: body.settings ? JSON.stringify(body.settings) : undefined,
        status: body.status
      },
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
                    image: true,
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
      }
    })

    return NextResponse.json(updatedRoom)
  } catch (error) {
    console.error('Error updating room:', error)
    return NextResponse.json(
      { error: 'Failed to update room' },
      { status: 500 }
    )
  }
}

// DELETE /api/rooms/[code] - Delete room (host only)
export async function DELETE(
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

    // Find the room and verify the user is the host
    const room = await prisma.room.findUnique({
      where: { code }
    })

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    if (room.hostId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the host can delete the room' },
        { status: 403 }
      )
    }

    await prisma.room.delete({
      where: { code }
    })

    return NextResponse.json({ message: 'Room deleted successfully' })
  } catch (error) {
    console.error('Error deleting room:', error)
    return NextResponse.json(
      { error: 'Failed to delete room' },
      { status: 500 }
    )
  }
}