import type React from "react"
import type { Metadata } from "next"
import { Inter, Manrope } from "next/font/google"
import "./globals.css"
import { Nav } from "@/components/nav"
import { Footer } from "@/components/footer"
import { WalletProvider } from "@/lib/context/wallet-context"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Legasi × Stellar | Institutional Credit Layer",
  description:
    "Build compliant crypto-backed lending with Soroban smart contracts, Fireblocks custody, and Supabase backend.",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${manrope.variable} font-sans antialiased`}>
        <WalletProvider>
          <div className="min-h-screen bg-background">
            <Nav />
            <main>{children}</main>
            <Footer />
          </div>
        </WalletProvider>
      </body>
    </html>
  )
}
