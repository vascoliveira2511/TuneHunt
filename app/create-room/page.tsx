"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Users, Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CreateRoomPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [roomName, setRoomName] = useState("")
  const [maxPlayers, setMaxPlayers] = useState([8])
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateRoom = async () => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: roomName.trim() || undefined,
          maxPlayers: maxPlayers[0]
        }),
      })

      if (response.ok) {
        const room = await response.json()
        
        // Auto-join the room as host
        const joinResponse = await fetch(`/api/rooms/${room.code}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            displayName: session.user?.name || 'Host'
          }),
        })

        if (joinResponse.ok) {
          router.push(`/room/${room.code}`)
        } else {
          console.error('Failed to join created room')
          router.push(`/room/${room.code}`)
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create room')
      }
    } catch (error) {
      console.error('Failed to create room:', error)
      alert('Failed to create room')
    } finally {
      setIsCreating(false)
    }
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              You need to be signed in to create a room
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/auth/signin')} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/rooms" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Rooms
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Room
            </CardTitle>
            <CardDescription>
              Set up a new TuneHunt game room for you and your friends
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="roomName">Room Name (Optional)</Label>
              <Input
                id="roomName"
                placeholder="Enter a name for your room..."
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                If left empty, your room will be called &quot;Unnamed Room&quot;
              </p>
            </div>

            <div className="space-y-4">
              <Label>Maximum Players: {maxPlayers[0]}</Label>
              <Slider
                value={maxPlayers}
                onValueChange={setMaxPlayers}
                min={2}
                max={16}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>2 players</span>
                <span>16 players</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateRoom}
                  disabled={isCreating}
                  className="flex-1"
                >
                  {isCreating ? (
                    <>Creating...</>
                  ) : (
                    <>
                      <Users className="h-4 w-4 mr-2" />
                      Create Room
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Once created, you&apos;ll be redirected to your room where you can share the room code with friends
          </p>
        </div>
      </div>
    </div>
  )
}