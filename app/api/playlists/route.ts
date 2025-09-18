import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PlaylistStatus } from "@prisma/client"
import type { Session } from "next-auth"

// GET /api/playlists - Get all published playlists
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where = {
      isPublished: true,
      status: PlaylistStatus.APPROVED,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } }
        ]
      })
    }

    const playlists = await prisma.playlist.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        _count: {
          select: {
            songs: true
          }
        }
      },
      orderBy: [
        { isOfficial: 'desc' },
        { rating: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    })

    const total = await prisma.playlist.count({ where })

    return NextResponse.json({
      playlists,
      total,
      hasMore: offset + limit < total
    })
  } catch (error) {
    console.error('Error fetching playlists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch playlists' },
      { status: 500 }
    )
  }
}

// POST /api/playlists - Create a new playlist
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
    const { name, description } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Playlist name is required' },
        { status: 400 }
      )
    }

    const playlist = await prisma.playlist.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        createdBy: session.user.id,
        isOfficial: false,
        isPublished: true, // Auto-publish user playlists
        status: PlaylistStatus.APPROVED // Auto-approve user playlists
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        _count: {
          select: {
            songs: true
          }
        }
      }
    })

    return NextResponse.json({ playlist })
  } catch (error) {
    console.error('Error creating playlist:', error)
    return NextResponse.json(
      { error: 'Failed to create playlist' },
      { status: 500 }
    )
  }
}