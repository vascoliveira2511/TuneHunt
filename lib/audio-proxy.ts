/**
 * Generates a proxy URL for Deezer audio streams to bypass CORS restrictions
 */
export function getProxyAudioUrl(originalUrl: string): string {
  // Only proxy Deezer URLs
  if (!originalUrl.includes('dzcdn.net')) {
    return originalUrl
  }

  const encodedUrl = encodeURIComponent(originalUrl)
  return `/api/audio/proxy?url=${encodedUrl}`
}

/**
 * Checks if a URL needs to be proxied
 */
export function needsAudioProxy(url: string): boolean {
  return url.includes('dzcdn.net')
}