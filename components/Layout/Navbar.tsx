"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Music, Search } from "lucide-react"
import { ThemeToggle } from "./ThemeToggle"
import { AuthButton } from "@/components/Auth/AuthButton"
import { Input } from "@/components/ui/input"

export function Navbar() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/rooms?search=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      router.push('/rooms')
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        {/* Left side - Logo and Navigation */}
        <div className="flex items-center">
          <Link className="flex items-center space-x-2 mr-8" href="/">
            <Music className="h-6 w-6 flex-shrink-0" />
            <span className="font-bold text-lg">TuneHunt</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              href="/playlists"
            >
              Playlists
            </Link>
            <Link
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              href="/rooms"
            >
              Rooms
            </Link>
          </nav>
        </div>

        {/* Right side - Search, Theme Toggle, and Auth */}
        <div className="flex items-center space-x-3">
          {/* Search - Hidden on mobile */}
          <form onSubmit={handleSearch} className="hidden lg:block">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
          </form>
          
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Auth Button */}
          <AuthButton />
        </div>
      </div>
    </header>
  )
}