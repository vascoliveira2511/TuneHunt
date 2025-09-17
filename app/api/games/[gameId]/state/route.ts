import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Session } from "next-auth"

interface Params {
  gameId: string
}

// GET /api/games/[gameId]/state - Get current game state for playing
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

    // Get the game with current state
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

    if (game.status !== 'PLAYING') {
      return NextResponse.json(
        { error: 'Game is not currently playing' },
        { status: 400 }
      )
    }

    let currentSong;
    let totalSongs;

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

      if (!playlist || playlist.songs.length === 0) {
        return NextResponse.json(
          { error: 'Playlist not found or has no songs' },
          { status: 400 }
        )
      }

      const songIndex = game.currentSongIndex || 0
      if (songIndex >= playlist.songs.length) {
        return NextResponse.json(
          { error: 'Game has ended' },
          { status: 400 }
        )
      }

      const playlistSong = playlist.songs[songIndex]
      currentSong = {
        id: playlistSong.song.id,
        title: playlistSong.song.title,
        artist: playlistSong.song.artist,
        album: playlistSong.song.album,
        previewUrl: playlistSong.song.previewUrl,
        imageUrl: playlistSong.song.imageUrl,
        selectedBy: 'playlist'
      }
      totalSongs = playlist.songs.length
    } else {
      // For individual selection games
      if (game.selectedSongs.length === 0) {
        return NextResponse.json(
          { error: 'No songs selected for this game' },
          { status: 400 }
        )
      }

      const songIndex = game.currentSongIndex || 0
      if (songIndex >= game.selectedSongs.length) {
        return NextResponse.json(
          { error: 'Game has ended' },
          { status: 400 }
        )
      }

      const selectedSong = game.selectedSongs[songIndex]
      currentSong = {
        id: selectedSong.song.id,
        title: selectedSong.song.title,
        artist: selectedSong.song.artist,
        album: selectedSong.song.album,
        previewUrl: selectedSong.song.previewUrl,
        imageUrl: selectedSong.song.imageUrl,
        selectedBy: selectedSong.selectedBy || ''
      }
      totalSongs = game.selectedSongs.length
    }

    // Prepare game state
    const gameState = {
      currentSongIndex: game.currentSongIndex || 0,
      currentSong,
      timeRemaining: 30, // Reset timer for current round
      isPlaying: false,
      guesses: [],
      roundScores: {},
      totalSongs
    }

    return NextResponse.json({ gameState })
  } catch (error) {
    console.error('Error getting game state:', error)
    return NextResponse.json(
      { error: 'Failed to get game state' },
      { status: 500 }
    )
  }
}