"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateRoomModal } from "@/components/Room/CreateRoomModal"
import { JoinRoomModal } from "@/components/Room/JoinRoomModal"
import { Music, Users, Headphones, Trophy } from "lucide-react"

export default function Home() {
  const [createRoomOpen, setCreateRoomOpen] = useState(false)
  const [joinRoomOpen, setJoinRoomOpen] = useState(false)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          TuneHunt
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          The ultimate multiplayer name-that-tune party game. Create rooms, challenge friends, 
          and see who can guess the most songs!
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" className="text-lg px-8" onClick={() => setCreateRoomOpen(true)}>
            Create Room
          </Button>
          <Button variant="outline" size="lg" className="text-lg px-8" onClick={() => setJoinRoomOpen(true)}>
            Join Room
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card>
          <CardHeader className="text-center">
            <Music className="h-12 w-12 mx-auto mb-2 text-primary" />
            <CardTitle>30-Second Clips</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Listen to 30-second previews and guess the song title and artist
            </CardDescription>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="text-center">
            <Users className="h-12 w-12 mx-auto mb-2 text-primary" />
            <CardTitle>Multiplayer Fun</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Play with up to 8 friends in real-time with live chat
            </CardDescription>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="text-center">
            <Headphones className="h-12 w-12 mx-auto mb-2 text-primary" />
            <CardTitle>Custom Playlists</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Create your own playlists or choose from curated collections
            </CardDescription>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="text-center">
            <Trophy className="h-12 w-12 mx-auto mb-2 text-primary" />
            <CardTitle>Competitive Scoring</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Points based on speed and accuracy - the faster you guess, the more you score!
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* How to Play Section */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-8">How to Play</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="text-xl font-semibold mb-2">Create or Join</h3>
            <p className="text-muted-foreground">
              Start a new room or join an existing one with a room code
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="text-xl font-semibold mb-2">Listen & Guess</h3>
            <p className="text-muted-foreground">
              Listen to 30-second clips and type your guesses for song titles and artists
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="text-xl font-semibold mb-2">Score Points</h3>
            <p className="text-muted-foreground">
              Earn points based on accuracy and speed - quick correct guesses score more!
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateRoomModal open={createRoomOpen} onOpenChange={setCreateRoomOpen} />
      <JoinRoomModal open={joinRoomOpen} onOpenChange={setJoinRoomOpen} />
    </div>
  );
}
