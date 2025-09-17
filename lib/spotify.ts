interface SpotifyTrack {
  id: string
  name: string
  artists: Array<{
    name: string
  }>
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
    spotify: string
  }
  duration_ms: number
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[]
    total: number
  }
}

class SpotifyAPI {
  private clientId: string
  private clientSecret: string
  private accessToken: string | null = null
  private tokenExpiresAt: number | null = null

  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID!
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET!
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
      return this.accessToken
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    })

    if (!response.ok) {
      throw new Error('Failed to get Spotify access token')
    }

    const data = await response.json()
    this.accessToken = data.access_token
    this.tokenExpiresAt = Date.now() + (data.expires_in * 1000)

    return this.accessToken!
  }

  async searchTracks(query: string, limit = 20): Promise<SpotifyTrack[]> {
    const token = await this.getAccessToken()
    
    const params = new URLSearchParams({
      q: query,
      type: 'track',
      limit: limit.toString(),
      market: 'US'
    })

    const response = await fetch(`https://api.spotify.com/v1/search?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to search Spotify tracks')
    }

    const data: SpotifySearchResponse = await response.json()
    
    console.log(`🎵 Spotify returned ${data.tracks.items.length} total tracks`)
    const tracksWithPreviews = data.tracks.items.filter(track => track.preview_url !== null)
    console.log(`🎧 ${tracksWithPreviews.length} tracks have preview URLs`)
    
    // Return all tracks for now, we'll handle preview availability in the UI
    return data.tracks.items
  }

  async getTrack(trackId: string): Promise<SpotifyTrack> {
    const token = await this.getAccessToken()

    const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to get Spotify track')
    }

    return await response.json()
  }
}

export const spotify = new SpotifyAPI()
export type { SpotifyTrack }