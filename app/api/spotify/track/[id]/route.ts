import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { spotify } from "@/lib/spotify"
import type { Session } from "next-auth"

interface Params {
  id: string
}

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

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Track ID is required' },
        { status: 400 }
      )
    }

    const track = await spotify.getTrack(id)
    
    return NextResponse.json({ track })
  } catch (error) {
    console.error('Error getting Spotify track:', error)
    return NextResponse.json(
      { error: 'Failed to get track' },
      { status: 500 }
    )
  }
}