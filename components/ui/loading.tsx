import { Music } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingProps {
  variant?: "spinner" | "waveform" | "music-note" | "skeleton"
  size?: "sm" | "md" | "lg"
  className?: string
  text?: string
}

export function Loading({
  variant = "waveform",
  size = "md",
  className,
  text
}: LoadingProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  }

  if (variant === "spinner") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className={cn(
          "border-2 border-primary/20 border-t-primary rounded-full spin-loader",
          sizeClasses[size]
        )} />
        {text && <span className="text-sm text-muted-foreground">{text}</span>}
      </div>
    )
  }

  if (variant === "music-note") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Music className={cn("text-primary music-note-loader", sizeClasses[size])} />
        {text && <span className="text-sm text-muted-foreground">{text}</span>}
      </div>
    )
  }

  if (variant === "waveform") {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="waveform-loader">
          <div className="waveform-bar"></div>
          <div className="waveform-bar"></div>
          <div className="waveform-bar"></div>
          <div className="waveform-bar"></div>
          <div className="waveform-bar"></div>
        </div>
        {text && <span className="text-sm text-muted-foreground">{text}</span>}
      </div>
    )
  }

  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="skeleton h-4 w-full rounded"></div>
        <div className="skeleton h-4 w-3/4 rounded"></div>
        <div className="skeleton h-4 w-1/2 rounded"></div>
      </div>
    )
  }

  return null
}

export function MusicSearchSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
          <div className="skeleton h-12 w-12 rounded-md flex-shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-3/4 rounded"></div>
            <div className="skeleton h-3 w-1/2 rounded"></div>
          </div>
          <div className="skeleton h-8 w-16 rounded"></div>
        </div>
      ))}
    </div>
  )
}

export function RoomCardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="skeleton h-5 w-24 rounded"></div>
        <div className="skeleton h-5 w-16 rounded-full"></div>
      </div>
      <div className="skeleton h-4 w-full rounded"></div>
      <div className="flex items-center gap-2">
        <div className="skeleton h-6 w-6 rounded-full"></div>
        <div className="skeleton h-4 w-20 rounded"></div>
      </div>
    </div>
  )
}