import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { spotify } from "@/lib/spotify"
import type { Session } from "next-auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    const tracks = await spotify.searchTracks(query, limit)
    
    return NextResponse.json({ tracks })
  } catch (error) {
    console.error('Error searching Spotify tracks:', error)
    return NextResponse.json(
      { error: 'Failed to search tracks' },
      { status: 500 }
    )
  }
}