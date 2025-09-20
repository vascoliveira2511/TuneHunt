import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { refreshPreviewUrl, isDeezerUrlExpired } from "@/lib/refresh-preview-url"
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

      // Check if preview URL needs refreshing
      let previewUrl = playlistSong.song.previewUrl
      if (previewUrl && isDeezerUrlExpired(previewUrl)) {
        console.log(`🔄 Preview URL expired for playlist song ${playlistSong.song.id}, refreshing...`)
        const freshUrl = await refreshPreviewUrl(playlistSong.song.id, previewUrl)
        if (freshUrl && freshUrl !== previewUrl) {
          previewUrl = freshUrl
          // Update database with fresh URL
          await prisma.song.update({
            where: { id: playlistSong.song.id },
            data: { previewUrl: freshUrl }
          })
        }
      }

      currentSong = {
        id: playlistSong.song.id,
        title: playlistSong.song.title,
        artist: playlistSong.song.artist,
        album: playlistSong.song.album,
        previewUrl: previewUrl,
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

      // Always refresh Deezer URLs for gameplay to ensure they're fresh
      let previewUrl = selectedSong.song.previewUrl
      console.log(`🔍 State API - Song: ${selectedSong.song.title}`)
      console.log(`🔍 State API - Song ID: ${selectedSong.song.id}`)
      console.log(`🔍 State API - SpotifyId: ${selectedSong.song.spotifyId}`)
      console.log(`🔍 State API - Preview URL: ${previewUrl}`)

      // Check both the song ID and spotifyId for Deezer tracks
      const isDeezerTrack = selectedSong.song.id.startsWith('deezer_') ||
                           (selectedSong.song.spotifyId && selectedSong.song.spotifyId.startsWith('deezer_'))

      if (previewUrl && isDeezerTrack) {
        const trackId = selectedSong.song.spotifyId || selectedSong.song.id
        console.log(`🔄 State API - Refreshing Deezer URL for track: ${trackId}`)
        try {
          const freshUrl = await refreshPreviewUrl(trackId, previewUrl)
          if (freshUrl && freshUrl !== previewUrl) {
            previewUrl = freshUrl
            console.log(`✅ State API - Updated with fresh URL: ${freshUrl}`)
            // Update database with fresh URL
            await prisma.song.update({
              where: { id: selectedSong.song.id },
              data: { previewUrl: freshUrl }
            })
          } else {
            console.log(`⚠️ State API - No fresh URL available, keeping: ${previewUrl}`)
          }
        } catch (error) {
          console.error(`❌ State API - Error refreshing URL:`, error)
        }
      } else {
        console.log(`✅ State API - Not a Deezer track (isDeezer: ${isDeezerTrack})`)
      }

      currentSong = {
        id: selectedSong.song.id,
        title: selectedSong.song.title,
        artist: selectedSong.song.artist,
        album: selectedSong.song.album,
        previewUrl: previewUrl,
        imageUrl: selectedSong.song.imageUrl,
        selectedBy: selectedSong.selectedBy || null
      }
      totalSongs = game.selectedSongs.length
    }

    // Calculate time remaining based on server-side round timer
    const now = new Date()
    const serverTimestamp = now.getTime()
    let timeRemaining = 30 // default
    let roundStartTimestamp = null

    if (game.roundStartedAt) {
      roundStartTimestamp = game.roundStartedAt.getTime()
      const elapsedSeconds = Math.floor((serverTimestamp - roundStartTimestamp) / 1000)
      timeRemaining = Math.max(0, game.roundDuration - elapsedSeconds)
    }

    // Get all guesses for current round
    const guesses = await prisma.guess.findMany({
      where: {
        gameId: gameId,
        songId: currentSong.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Add debug logging for selectedBy field
    console.log('🔍 State API - selectedBy:', currentSong.selectedBy, 'for song:', currentSong.title)

    // Prepare game state
    const gameState = {
      currentSongIndex: game.currentSongIndex || 0,
      currentSong,
      timeRemaining,
      isPlaying: game.roundStartedAt !== null,
      guesses: guesses.map(guess => ({
        id: guess.id,
        userId: guess.userId,
        userName: guess.user?.name || 'Unknown',
        guessType: guess.guessType,
        guessText: guess.guessText,
        isCorrect: guess.isCorrect,
        pointsAwarded: guess.pointsAwarded
      })),
      roundScores: {},
      totalSongs,
      roundStartedAt: game.roundStartedAt,
      roundStartTimestamp,
      serverTimestamp
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