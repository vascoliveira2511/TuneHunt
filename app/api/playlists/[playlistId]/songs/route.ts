import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Session } from "next-auth"
import type { SpotifyTrack } from "@/lib/spotify"

interface Params {
  playlistId: string
}

// POST /api/playlists/[playlistId]/songs - Add songs to playlist
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

    const { playlistId } = await params
    const body = await request.json()
    const { tracks }: { tracks: SpotifyTrack[] } = body

    if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
      return NextResponse.json(
        { error: 'Tracks array is required' },
        { status: 400 }
      )
    }

    // Check if playlist exists and user owns it
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        songs: {
          orderBy: { position: 'desc' },
          take: 1
        }
      }
    })

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      )
    }

    if (playlist.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only add songs to your own playlists' },
        { status: 403 }
      )
    }

    // Get the last position in the playlist
    const lastPosition = playlist.songs[0]?.position || 0

    // Process each track
    const addedSongs = []
    let currentPosition = lastPosition

    for (const track of tracks) {
      currentPosition++

      // Create or find the song in our database
      let song = await prisma.song.findUnique({
        where: { spotifyId: track.id }
      })

      if (!song) {
        song = await prisma.song.create({
          data: {
            spotifyId: track.id,
            title: track.name,
            artist: track.artists.map((a: { name: string }) => a.name).join(', '),
            album: track.album.name,
            previewUrl: track.preview_url,
            imageUrl: track.album.images[0]?.url,
            durationMs: track.duration_ms
          }
        })
      }

      // Check if song is already in this playlist
      const existingPlaylistSong = await prisma.playlistSong.findFirst({
        where: {
          playlistId,
          songId: song.id
        }
      })

      if (!existingPlaylistSong) {
        const playlistSong = await prisma.playlistSong.create({
          data: {
            playlistId,
            songId: song.id,
            position: currentPosition
          },
          include: {
            song: true
          }
        })
        addedSongs.push(playlistSong)
      }
    }

    return NextResponse.json({
      message: `Added ${addedSongs.length} songs to playlist`,
      addedSongs: addedSongs.length,
      skipped: tracks.length - addedSongs.length
    })
  } catch (error) {
    console.error('Error adding songs to playlist:', error)
    return NextResponse.json(
      { error: 'Failed to add songs to playlist' },
      { status: 500 }
    )
  }
}

// GET /api/playlists/[playlistId]/songs - Get playlist songs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { playlistId } = await params

    const playlistSongs = await prisma.playlistSong.findMany({
      where: { playlistId },
      include: {
        song: true
      },
      orderBy: { position: 'asc' }
    })

    return NextResponse.json({ songs: playlistSongs })
  } catch (error) {
    console.error('Error fetching playlist songs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch playlist songs' },
      { status: 500 }
    )
  }
}

// DELETE /api/playlists/[playlistId]/songs - Remove songs from playlist
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
    const body = await request.json()
    const { songIds }: { songIds: string[] } = body

    if (!songIds || !Array.isArray(songIds)) {
      return NextResponse.json(
        { error: 'Song IDs array is required' },
        { status: 400 }
      )
    }

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
        { error: 'You can only remove songs from your own playlists' },
        { status: 403 }
      )
    }

    // Remove songs from playlist
    const deleted = await prisma.playlistSong.deleteMany({
      where: {
        playlistId,
        songId: {
          in: songIds
        }
      }
    })

    return NextResponse.json({
      message: `Removed ${deleted.count} songs from playlist`,
      removedCount: deleted.count
    })
  } catch (error) {
    console.error('Error removing songs from playlist:', error)
    return NextResponse.json(
      { error: 'Failed to remove songs from playlist' },
      { status: 500 }
    )
  }
}