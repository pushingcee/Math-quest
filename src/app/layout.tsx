import type { Metadata } from "next";
import { Geist, Geist_Mono, Libre_Baskerville, Source_Sans_3 } from "next/font/google";
import { LanguageProvider } from "@/context/LanguageContext";
import { GameStateProvider } from "@/contexts/GameStateContext";
import NavBar from "@/components/NavBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-libre-baskerville",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const sourceSans3 = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Math Quest",
  description: "An educational board game combining quest-style gameplay with math challenges",
  manifest: "/Math-quest/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Math Quest",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#8b5cf6" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${libreBaskerville.variable} ${sourceSans3.variable} antialiased`}
      >
        <GameStateProvider>
          <LanguageProvider>
            <NavBar />
            {children}
          </LanguageProvider>
        </GameStateProvider>
      </body>
    </html>
  );
}
