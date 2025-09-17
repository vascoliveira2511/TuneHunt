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

    // Check if this was the last song
    if (nextSongIndex >= game.selectedSongs.length) {
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

    // Move to next song
    const nextSong = game.selectedSongs[nextSongIndex]
    
    await prisma.game.update({
      where: { id: gameId },
      data: {
        currentSongIndex: nextSongIndex,
        currentSongId: nextSong.songId
      }
    })

    // Prepare new game state
    const gameState = {
      currentSongIndex: nextSongIndex,
      currentSong: {
        id: nextSong.song.id,
        title: nextSong.song.title,
        artist: nextSong.song.artist,
        album: nextSong.song.album,
        previewUrl: nextSong.song.previewUrl,
        imageUrl: nextSong.song.imageUrl,
        selectedBy: nextSong.selectedBy || ''
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