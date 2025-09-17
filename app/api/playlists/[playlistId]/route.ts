import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PlaylistStatus } from "@prisma/client"
import type { Session } from "next-auth"

interface Params {
  playlistId: string
}

// GET /api/playlists/[playlistId] - Get a specific playlist
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { playlistId } = await params

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        songs: {
          include: {
            song: true
          },
          orderBy: { position: 'asc' }
        },
        _count: {
          select: {
            songs: true
          }
        }
      }
    })

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      )
    }

    // Check if playlist is accessible
    const session = await getServerSession(authOptions) as Session | null
    const isOwner = session?.user && 'id' in session.user && playlist.createdBy === (session.user as any).id

    if (!playlist.isPublished && !playlist.isOfficial && !isOwner) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ playlist })
  } catch (error) {
    console.error('Error fetching playlist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch playlist' },
      { status: 500 }
    )
  }
}

// PATCH /api/playlists/[playlistId] - Update playlist
export async function PATCH(
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

    const { playlistId } = await params
    const body = await request.json()
    const { name, description, isPublished } = body

    // Check if playlist exists and user owns it
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId }
    })

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      )
    }

    if (playlist.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own playlists' },
        { status: 403 }
      )
    }

    const updatedPlaylist = await prisma.playlist.update({
      where: { id: playlistId },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isPublished !== undefined && { isPublished })
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

    return NextResponse.json({ playlist: updatedPlaylist })
  } catch (error) {
    console.error('Error updating playlist:', error)
    return NextResponse.json(
      { error: 'Failed to update playlist' },
      { status: 500 }
    )
  }
}

// DELETE /api/playlists/[playlistId] - Delete playlist
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

    const { playlistId } = await params

    // Check if playlist exists and user owns it
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId }
    })

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      )
    }

    if (playlist.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own playlists' },
        { status: 403 }
      )
    }

    // Delete playlist (cascade will delete related playlist songs)
    await prisma.playlist.delete({
      where: { id: playlistId }
    })

    return NextResponse.json({ message: 'Playlist deleted successfully' })
  } catch (error) {
    console.error('Error deleting playlist:', error)
    return NextResponse.json(
      { error: 'Failed to delete playlist' },
      { status: 500 }
    )
  }
}