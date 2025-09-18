import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Session } from "next-auth"

interface Params {
  gameId: string
}

// GET /api/games/[gameId]/selections - Get all track selections for a game
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

    const selections = await prisma.gameSelectedSong.findMany({
      where: { gameId },
      include: {
        song: true,
        selector: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ selections })
  } catch (error) {
    console.error('Error fetching game selections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch selections' },
      { status: 500 }
    )
  }
}

// POST /api/games/[gameId]/selections - Add a track selection for the current user
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
    const { spotifyTrack } = body

    if (!spotifyTrack) {
      return NextResponse.json(
        { error: 'Track data is required' },
        { status: 400 }
      )
    }

    // Check if user already selected a track for this game
    const existingSelection = await prisma.gameSelectedSong.findFirst({
      where: {
        gameId,
        selectedBy: session.user.id
      }
    })

    if (existingSelection) {
      return NextResponse.json(
        { error: 'You have already selected a track for this game' },
        { status: 400 }
      )
    }

    // Create or find the song in our database
    let song = await prisma.song.findUnique({
      where: { spotifyId: spotifyTrack.id }
    })

    if (!song) {
      // Song doesn't exist, create it
      song = await prisma.song.create({
        data: {
          spotifyId: spotifyTrack.id,
          title: spotifyTrack.name,
          artist: spotifyTrack.artists.map((a: { name: string }) => a.name).join(', '),
          album: spotifyTrack.album.name,
          previewUrl: spotifyTrack.preview_url,
          imageUrl: spotifyTrack.album.images[0]?.url,
          durationMs: spotifyTrack.duration_ms
        }
      })
    } else if (!song.previewUrl && spotifyTrack.preview_url) {
      // Song exists but missing preview URL - update it with fresh Spotify data
      console.log(`🔄 Updating song "${song.title}" with preview URL: ${spotifyTrack.preview_url}`)
      
      song = await prisma.song.update({
        where: { id: song.id },
        data: {
          previewUrl: spotifyTrack.preview_url,
          // Also update other fields in case they've changed
          title: spotifyTrack.name,
          artist: spotifyTrack.artists.map((a: { name: string }) => a.name).join(', '),
          album: spotifyTrack.album.name,
          imageUrl: spotifyTrack.album.images[0]?.url,
          durationMs: spotifyTrack.duration_ms
        }
      })
    }

    // Create the game selection
    const selection = await prisma.gameSelectedSong.create({
      data: {
        gameId,
        songId: song.id,
        selectedBy: session.user.id
      },
      include: {
        song: true,
        selector: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    })

    return NextResponse.json({ selection })
  } catch (error) {
    console.error('Error creating track selection:', error)
    return NextResponse.json(
      { error: 'Failed to save track selection' },
      { status: 500 }
    )
  }
}

// DELETE /api/games/[gameId]/selections - Remove current user's track selection
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

    const { gameId } = await params

    // Find and delete the user's selection
    const deleted = await prisma.gameSelectedSong.deleteMany({
      where: {
        gameId,
        selectedBy: session.user.id
      }
    })

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'No selection found to delete' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Selection removed successfully' })
  } catch (error) {
    console.error('Error deleting track selection:', error)
    return NextResponse.json(
      { error: 'Failed to remove selection' },
      { status: 500 }
    )
  }
}