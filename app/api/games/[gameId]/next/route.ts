import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GameStatus } from "@prisma/client"
import type { Session } from "next-auth"

interface Params {
  gameId: string
}

// POST /api/games/[gameId]/next - Move to next song
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

    // Check if user is host
    const isHost = session.user.id === game.room.hostId
    if (!isHost) {
      return NextResponse.json(
        { error: 'Only the host can advance the game' },
        { status: 403 }
      )
    }

    const nextSongIndex = game.currentSongIndex + 1

    // Determine total songs based on game type
    let totalSongs: number
    if (game.playlistId) {
      const playlist = await prisma.playlist.findUnique({
        where: { id: game.playlistId },
        include: { songs: true }
      })
      totalSongs = playlist?.songs.length || 0
    } else {
      totalSongs = game.selectedSongs.length
    }

    // Check if this was the last song
    if (nextSongIndex >= totalSongs) {
      // Game is complete
      await prisma.game.update({
        where: { id: gameId },
        data: {
          status: GameStatus.FINISHED,
          finishedAt: new Date()
        }
      })

      return NextResponse.json({ gameComplete: true })
    }

    // Get next song based on game type
    let nextSong
    if (game.playlistId) {
      const playlist = await prisma.playlist.findUnique({
        where: { id: game.playlistId },
        include: {
          songs: {
            include: { song: true },
            orderBy: { position: 'asc' }
          }
        }
      })
      nextSong = playlist?.songs[nextSongIndex]
      if (!nextSong) {
        return NextResponse.json(
          { error: 'Song not found in playlist' },
          { status: 400 }
        )
      }
    } else {
      nextSong = game.selectedSongs[nextSongIndex]
      if (!nextSong) {
        return NextResponse.json(
          { error: 'Song not found in selections' },
          { status: 400 }
        )
      }
    }
    
    const songId = game.playlistId ? nextSong.song.id : nextSong.songId

    await prisma.game.update({
      where: { id: gameId },
      data: {
        currentSongIndex: nextSongIndex,
        currentSongId: songId,
        roundStartedAt: null // Reset round timer
      }
    })

    // Prepare new game state
    const song = game.playlistId ? nextSong.song : nextSong.song
    const gameState = {
      currentSongIndex: nextSongIndex,
      currentSong: {
        id: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        previewUrl: song.previewUrl,
        imageUrl: song.imageUrl,
        selectedBy: game.playlistId ? 'playlist' : ((nextSong as any).selectedBy || '')
      },
      timeRemaining: 30,
      isPlaying: false,
      guesses: [],
      roundScores: {}
    }

    return NextResponse.json({ gameState })
  } catch (error) {
    console.error('Error moving to next song:', error)
    return NextResponse.json(
      { error: 'Failed to move to next song' },
      { status: 500 }
    )
  }
}