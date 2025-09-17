import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GameStatus } from "@prisma/client"
import type { Session } from "next-auth"

interface Params {
  gameId: string
}

// POST /api/games/[gameId]/start - Start the game and return first song
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

    // Check if user is host
    const isHost = session.user.id === game.room.hostId
    if (!isHost) {
      return NextResponse.json(
        { error: 'Only the host can start the game' },
        { status: 403 }
      )
    }

    // Check if this is a playlist game or individual selection game
    if (game.playlistId) {
      // For playlist games, we need to get songs from the playlist
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

      // Use first song from playlist as the current song
      const firstSong = playlist.songs[0].song
      
      // Update game status to PLAYING
      await prisma.game.update({
        where: { id: gameId },
        data: {
          status: GameStatus.PLAYING,
          startedAt: new Date(),
          currentSongIndex: 0,
          currentSongId: firstSong.id
        }
      })

      // Prepare game state for playlist mode
      const gameState = {
        currentSongIndex: 0,
        currentSong: {
          id: firstSong.id,
          title: firstSong.title,
          artist: firstSong.artist,
          album: firstSong.album,
          previewUrl: firstSong.previewUrl,
          imageUrl: firstSong.imageUrl,
          selectedBy: 'playlist'
        },
        timeRemaining: 30,
        isPlaying: false,
        guesses: [],
        roundScores: {},
        totalSongs: playlist.songs.length
      }

      return NextResponse.json({ gameState })
    } else {
      // For individual selection games, allow starting with at least 1 song
      if (game.selectedSongs.length === 0) {
        return NextResponse.json(
          { error: 'At least one player must select a song to start the game' },
          { status: 400 }
        )
      }
      
      // If not all players have selected songs, that's okay - we'll use the available songs
      if (game.selectedSongs.length < game.participants.length) {
        console.log(`Starting game with ${game.selectedSongs.length} songs from ${game.participants.length} participants`)
      }
    }

    // Update game status to PLAYING
    await prisma.game.update({
      where: { id: gameId },
      data: {
        status: GameStatus.PLAYING,
        startedAt: new Date(),
        currentSongIndex: 0,
        currentSongId: game.selectedSongs[0].songId
      }
    })

    // Prepare game state
    const gameState = {
      currentSongIndex: 0,
      currentSong: {
        id: game.selectedSongs[0].song.id,
        title: game.selectedSongs[0].song.title,
        artist: game.selectedSongs[0].song.artist,
        album: game.selectedSongs[0].song.album,
        previewUrl: game.selectedSongs[0].song.previewUrl,
        imageUrl: game.selectedSongs[0].song.imageUrl,
        selectedBy: game.selectedSongs[0].selectedBy || ''
      },
      timeRemaining: 30,
      isPlaying: false,
      guesses: [],
      roundScores: {},
      totalSongs: game.selectedSongs.length
    }

    return NextResponse.json({ gameState })
  } catch (error) {
    console.error('Error starting game:', error)
    return NextResponse.json(
      { error: 'Failed to start game' },
      { status: 500 }
    )
  }
}