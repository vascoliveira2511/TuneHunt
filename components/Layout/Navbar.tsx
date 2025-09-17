"use client"

import Link from "next/link"
import { Music } from "lucide-react"
import { ThemeToggle } from "./ThemeToggle"
import { AuthButton } from "@/components/Auth/AuthButton"
import { Button } from "@/components/ui/button"

export function Navbar() {
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
          <div className="hidden lg:block">
            <Button variant="outline" className="w-64 justify-start text-sm font-normal">
              <span>Search rooms...</span>
            </Button>
          </div>
          
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Auth Button */}
          <AuthButton />
        </div>
      </div>
    </header>
  )
}