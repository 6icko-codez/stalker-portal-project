import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IPTV Player Pro - Advanced Stalker Portal Player",
  description: "Professional IPTV player with Stalker Portal support, EPG, subtitles, and advanced features. Built with Next.js and TypeScript.",
  keywords: ["IPTV", "Stalker Portal", "Live TV", "EPG", "Streaming", "HLS", "Video Player"],
  authors: [{ name: "IPTV Player Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "IPTV Player Pro",
    description: "Advanced IPTV player with Stalker Portal support",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "IPTV Player Pro",
    description: "Advanced IPTV player with Stalker Portal support",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <Sonner />
        </ThemeProvider>
      </body>
    </html>
  );
}
