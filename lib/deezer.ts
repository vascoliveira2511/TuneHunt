interface DeezerTrack {
  id: string
  title: string
  title_short: string
  duration: string
  preview: string
  artist: {
    id: string
    name: string
  }
  album: {
    id: string
    title: string
    cover: string
    cover_small: string
    cover_medium: string
    cover_big: string
    cover_xl: string
  }
  explicit_lyrics: boolean
  link: string
  rank: number
}

interface DeezerSearchResponse {
  data: DeezerTrack[]
  total: number
}

export interface UnifiedTrack {
  id: string
  name: string
  artists: Array<{ name: string }>
  album: {
    name: string
    images: Array<{
      url: string
      height: number
      width: number
    }>
  }
  preview_url: string | null
  external_urls: {
    spotify?: string
    deezer?: string
  }
  duration_ms: number
  source: 'spotify' | 'deezer'
}

class DeezerAPI {
  private baseUrl = 'https://api.deezer.com'

  async searchTracks(query: string, limit = 20): Promise<UnifiedTrack[]> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString()
    })

    const response = await fetch(`${this.baseUrl}/search?${params}`)

    if (!response.ok) {
      throw new Error('Failed to search Deezer tracks')
    }

    const data: DeezerSearchResponse = await response.json()

    console.log(`🎵 Deezer returned ${data.data.length} total tracks`)
    const tracksWithPreviews = data.data.filter(track => track.preview && track.preview.length > 0)
    console.log(`🎧 ${tracksWithPreviews.length} tracks have preview URLs`)

    return data.data.map(track => this.convertToUnifiedFormat(track))
  }

  async getTrack(trackId: string): Promise<UnifiedTrack> {
    // Handle both deezer IDs and unified IDs
    const deezerTrackId = trackId.startsWith('deezer_') ? trackId.replace('deezer_', '') : trackId

    const response = await fetch(`${this.baseUrl}/track/${deezerTrackId}`)

    if (!response.ok) {
      throw new Error('Failed to get Deezer track')
    }

    const track: DeezerTrack = await response.json()
    return this.convertToUnifiedFormat(track)
  }

  convertToUnifiedFormat(track: DeezerTrack): UnifiedTrack {
    return {
      id: `deezer_${track.id}`,
      name: track.title,
      artists: [{ name: track.artist.name }],
      album: {
        name: track.album.title,
        images: [
          {
            url: track.album.cover_xl || track.album.cover_big,
            height: 1000,
            width: 1000
          },
          {
            url: track.album.cover_big || track.album.cover_medium,
            height: 640,
            width: 640
          },
          {
            url: track.album.cover_medium || track.album.cover,
            height: 300,
            width: 300
          },
          {
            url: track.album.cover_small || track.album.cover,
            height: 64,
            width: 64
          }
        ]
      },
      preview_url: track.preview || null,
      external_urls: {
        deezer: track.link
      },
      duration_ms: parseInt(track.duration) * 1000,
      source: 'deezer'
    }
  }
}

export const deezer = new DeezerAPI()
export type { DeezerTrack }