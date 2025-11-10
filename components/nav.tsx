"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Menu, X } from "lucide-react"
import { WalletConnectButton } from "./wallet-connect-button"
import { Button } from "./ui/button"
import { useState } from "react"
import { useWallet } from "@/lib/context/wallet-context"
import Image from "next/image"

export function Nav() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isConnected } = useWallet()

  const publicLinks = [
    { href: "/simulator", label: "Simulator" },
    { href: "/about", label: "About Us" },
    { href: "/whitepaper", label: "White Paper" },
    { href: "/docs", label: "Documentation" },
    { href: "/api-docs", label: "API Reference" },
  ]

  return (
    <nav className="sticky top-0 z-50 glass-strong border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/legasi-logo-v3QGuhNk-mHOEKJWIY8d63nTjkCxbFV8jIkhcHb.png"
              alt="Legasi"
              width={120}
              height={40}
              className="h-8 w-auto"
            />
            <span className="hidden sm:inline text-xs text-muted-foreground">×</span>
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/stellar%20logo-p5hq9AV9z4XuQrSSnIOajetCw7pUrV.png"
              alt="Stellar"
              width={100}
              height={30}
              className="h-7 w-auto hidden sm:block"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {publicLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === item.href ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {isConnected && (
              <Link
                href="/dashboard"
                className={`text-sm font-medium transition-colors ${
                  pathname?.startsWith("/dashboard") ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* Wallet Connect */}
          <div className="hidden md:block">
            <WalletConnectButton />
          </div>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden py-4 space-y-2"
          >
            {publicLinks.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                <div
                  className={`px-4 py-3 rounded-lg transition-all ${
                    pathname === item.href
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </div>
              </Link>
            ))}
            {isConnected && (
              <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                <div
                  className={`px-4 py-3 rounded-lg transition-all ${
                    pathname?.startsWith("/dashboard")
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  Dashboard
                </div>
              </Link>
            )}
            <div className="pt-4">
              <WalletConnectButton />
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  )
}
