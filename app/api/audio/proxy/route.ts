import { NextRequest, NextResponse } from "next/server"

// GET /api/audio/proxy?url=<encoded_deezer_url>
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const audioUrl = searchParams.get('url')

    if (!audioUrl) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      )
    }

    // Validate that it's a Deezer URL
    if (!audioUrl.includes('dzcdn.net')) {
      return NextResponse.json(
        { error: 'Only Deezer URLs are supported' },
        { status: 400 }
      )
    }

    console.log('🎵 Proxying audio URL:', audioUrl)

    // Fetch the audio from Deezer
    const response = await fetch(audioUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.deezer.com/',
        'Accept': 'audio/*,*/*;q=0.9'
      }
    })

    if (!response.ok) {
      console.error('❌ Failed to fetch audio:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Failed to fetch audio' },
        { status: response.status }
      )
    }

    // Get the audio data
    const audioBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'audio/mpeg'

    console.log('✅ Successfully proxied audio, size:', audioBuffer.byteLength, 'bytes')

    // Return the audio with proper headers
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  } catch (error) {
    console.error('💥 Audio proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}