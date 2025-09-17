"use client"

import Link from "next/link"
import { Music } from "lucide-react"
import { ThemeToggle } from "./ThemeToggle"
import { AuthButton } from "@/components/Auth/AuthButton"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link className="mr-6 flex items-center space-x-2" href="/">
            <Music className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">TuneHunt</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
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
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Button variant="outline" className="w-full justify-start text-sm font-normal md:w-40 lg:w-64">
              <span className="hidden lg:inline-flex">Search rooms...</span>
              <span className="inline-flex lg:hidden">Search...</span>
            </Button>
          </div>
          <nav className="flex items-center">
            <ThemeToggle />
            <AuthButton />
          </nav>
        </div>
      </div>
    </header>
  )
}