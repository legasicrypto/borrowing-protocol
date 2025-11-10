"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  DollarSign,
  FileText,
  Vault,
  AlertTriangle,
  Settings,
  HandCoins,
  Receipt,
  CreditCard,
  History,
} from "lucide-react"
import Image from "next/image"

const userNavItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/borrow", label: "Borrow", icon: HandCoins },
  { href: "/dashboard/positions", label: "My Positions", icon: Receipt },
  { href: "/dashboard/repay", label: "Repay", icon: CreditCard },
  { href: "/dashboard/history", label: "History", icon: History },
]

const adminNavItems = [
  { href: "/dashboard/prices", label: "Prices", icon: DollarSign },
  { href: "/dashboard/policies", label: "Policies", icon: FileText },
  { href: "/dashboard/vaults", label: "Vaults", icon: Vault },
  { href: "/dashboard/liquidations", label: "Liquidations", icon: AlertTriangle },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card/50 backdrop-blur-xl">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/legasi-logo-v3QGuhNk-mHOEKJWIY8d63nTjkCxbFV8jIkhcHb.png"
            alt="Legasi"
            width={100}
            height={32}
            className="h-7 w-auto"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-6 overflow-y-auto p-4">
          <div>
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lending</h3>
            <div className="space-y-1">
              {userNavItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary/10 text-primary shadow-sm glow-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-4 h-8 w-1 rounded-r-full bg-gradient-to-b from-primary to-accent" />
                    )}
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Management
            </h3>
            <div className="space-y-1">
              {adminNavItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary/10 text-primary shadow-sm glow-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-4 h-8 w-1 rounded-r-full bg-gradient-to-b from-primary to-accent" />
                    )}
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>

        {/* Footer - Powered by Stellar */}
        <div className="border-t border-border p-4">
          <div className="rounded-lg bg-primary/5 p-3 text-center">
            <p className="text-xs text-muted-foreground mb-2">Powered by</p>
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/502d9b1bbee8c2169cc0eb3d0982ba3bf02ce300-1776x548-ZkZuFs0UmldFjQztQRHaH2TjWuPHFu.avif"
              alt="Stellar"
              width={80}
              height={24}
              className="h-5 w-auto mx-auto"
            />
            <p className="text-xs text-muted-foreground mt-2">Testnet Active</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
