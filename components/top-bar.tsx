"use client"

import { useWallet } from "@/lib/context/wallet-context"
import { Search, Bell, User } from "lucide-react"
import { Button } from "@/components/ui/button"

export function TopBar() {
  const { connected, publicKey } = useWallet()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-6">
      {/* Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search positions or transactions..."
            className="w-full rounded-lg bg-muted/50 py-2 pl-10 pr-4 text-sm outline-none ring-1 ring-transparent transition-all focus:ring-primary"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        <div className="h-8 w-px bg-border" />

        <Button variant="ghost" className="gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium">{connected ? "Connected" : "Admin"}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {connected && publicKey ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}` : "Not Connected"}
            </p>
          </div>
        </Button>
      </div>
    </header>
  )
}
