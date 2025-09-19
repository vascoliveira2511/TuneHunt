import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/Layout/ThemeProvider";
import { Layout } from "@/components/Layout/Layout";
import { SessionProvider } from "@/components/Auth/SessionProvider";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TuneHunt - Name That Tune Game",
    template: "%s | TuneHunt"
  },
  description: "A multiplayer name-that-tune party game where players guess songs and compete for points. Create rooms, invite friends, and test your music knowledge!",
  keywords: ["music game", "name that tune", "multiplayer", "party game", "music quiz", "song guessing"],
  authors: [{ name: "TuneHunt Team" }],
  creator: "TuneHunt",
  publisher: "TuneHunt",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://tunehunt.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "TuneHunt - Name That Tune Game",
    description: "A multiplayer name-that-tune party game where players guess songs and compete for points",
    url: 'https://tunehunt.app',
    siteName: 'TuneHunt',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TuneHunt - Multiplayer Music Game',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TuneHunt - Name That Tune Game',
    description: 'A multiplayer name-that-tune party game where players guess songs and compete for points',
    images: ['/og-image.png'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#8B5CF6' },
    { media: '(prefers-color-scheme: dark)', color: '#A855F7' }
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <ThemeProvider
            defaultTheme="system"
            storageKey="tunehunt-ui-theme"
          >
            <Layout>
              {children}
            </Layout>
          </ThemeProvider>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
