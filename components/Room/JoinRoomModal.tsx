"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Hash, User } from "lucide-react"

interface JoinRoomModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function JoinRoomModal({ open, onOpenChange }: JoinRoomModalProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    roomCode: "",
    displayName: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session || !formData.roomCode.trim()) return

    setLoading(true)
    setError("")

    try {
      // First check if room exists
      const roomResponse = await fetch(`/api/rooms/${formData.roomCode.toUpperCase()}`)
      
      if (!roomResponse.ok) {
        setError("Room not found. Please check the room code.")
        setLoading(false)
        return
      }

      // Join the room
      const joinResponse = await fetch(`/api/rooms/${formData.roomCode.toUpperCase()}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: formData.displayName || session.user?.name
        }),
      })

      if (joinResponse.ok) {
        onOpenChange(false)
        router.push(`/room/${formData.roomCode.toUpperCase()}`)
      } else {
        const errorData = await joinResponse.json()
        setError(errorData.error || "Failed to join room")
      }
    } catch (error) {
      console.error('Error joining room:', error)
      setError("An error occurred while joining the room")
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Sign In Required</DialogTitle>
            <DialogDescription>
              You need to sign in to join a room.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Join Room
          </DialogTitle>
          <DialogDescription>
            Enter the room code to join an existing game.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="roomCode" className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Room Code
              </Label>
              <Input
                id="roomCode"
                placeholder="Enter 6-character room code"
                value={formData.roomCode}
                onChange={(e) => setFormData({ ...formData, roomCode: e.target.value.toUpperCase() })}
                maxLength={6}
                className="uppercase"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="displayName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Display Name (Optional)
              </Label>
              <Input
                id="displayName"
                placeholder={session.user?.name || "Your display name"}
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              />
            </div>
            {error && (
              <div className="text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.roomCode.trim()}>
              {loading ? 'Joining...' : 'Join Room'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}