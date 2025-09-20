import { deezer } from './deezer'

/**
 * Checks if a Deezer preview URL is expired and fetches a fresh one if needed
 */
export async function refreshPreviewUrl(trackId: string, currentUrl: string | null): Promise<string | null> {
  // For Deezer URLs, always try to fetch a fresh one using the track ID
  try {
    if (trackId.startsWith('deezer_')) {
      console.log(`🔄 Fetching fresh preview URL for track ${trackId}`)

      const freshTrack = await deezer.getTrack(trackId)

      if (freshTrack.preview_url) {
        console.log(`✅ Got fresh preview URL for ${trackId}: ${freshTrack.preview_url}`)
        return freshTrack.preview_url
      } else {
        console.log(`❌ No preview URL available for ${trackId}`)
        return null
      }
    }

    // If not a Deezer track, return the current URL
    console.log(`ℹ️ Not a Deezer track, returning current URL: ${currentUrl}`)
    return currentUrl

  } catch (error) {
    console.error(`❌ Failed to refresh preview URL for ${trackId}:`, error)
    // Return the current URL as fallback
    return currentUrl
  }
}

/**
 * Checks if a Deezer URL appears to be expired based on the hdnea parameter
 */
export function isDeezerUrlExpired(url: string): boolean {
  if (!url.includes('dzcdn.net') || !url.includes('hdnea=')) {
    return false
  }

  try {
    const urlObj = new URL(url)
    const hdnea = urlObj.searchParams.get('hdnea')

    if (hdnea) {
      // Extract expiration timestamp from hdnea parameter
      const expMatch = hdnea.match(/exp=(\d+)/)
      if (expMatch) {
        const expTime = parseInt(expMatch[1]) * 1000 // Convert to milliseconds
        const now = Date.now()

        // Consider expired if within 5 minutes of expiration to be safe
        const buffer = 5 * 60 * 1000 // 5 minutes
        const isExpired = now >= (expTime - buffer)

        console.log(`🕐 URL expiration check: exp=${expTime}, now=${now}, buffer=${buffer}, expired=${isExpired}`)
        return isExpired
      }
    }
  } catch (error) {
    console.error('Error checking URL expiration:', error)
  }

  return false
}