import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Session } from "next-auth"

interface Params {
  gameId: string
}

// GET /api/games/[gameId]/songs - Get all songs played in this game
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

    // Get the game with selected songs
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        selectedSongs: {
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
        },
        room: true
      }
    })

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    let songs

    if (game.playlistId) {
      // For playlist games, get songs from the playlist
      const playlist = await prisma.playlist.findUnique({
        where: { id: game.playlistId },
        include: {
          songs: {
            include: {
              song: true
            },
            orderBy: { position: 'asc' }
          }
        }
      })

      if (!playlist) {
        return NextResponse.json({ songs: [] })
      }

      songs = playlist.songs.map((playlistSong) => ({
        id: playlistSong.song.id,
        title: playlistSong.song.title,
        artist: playlistSong.song.artist,
        album: playlistSong.song.album,
        imageUrl: playlistSong.song.imageUrl,
        selectedBy: 'Playlist'
      }))
    } else {
      // For individual selection games
      songs = game.selectedSongs.map((selectedSong) => ({
        id: selectedSong.song.id,
        title: selectedSong.song.title,
        artist: selectedSong.song.artist,
        album: selectedSong.song.album,
        imageUrl: selectedSong.song.imageUrl,
        selectedBy: selectedSong.selector?.name || 'Unknown'
      }))
    }

    return NextResponse.json({ songs })
  } catch (error) {
    console.error('Error getting game songs:', error)
    return NextResponse.json(
      { error: 'Failed to get game songs' },
      { status: 500 }
    )
  }
}