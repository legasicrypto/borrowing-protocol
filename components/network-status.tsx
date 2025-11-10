"use client"

import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { motion } from "framer-motion"

export function NetworkStatus() {
  const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK || "TESTNET"
  const isTestnet = network === "TESTNET"

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass">
        <div className="relative">
          <div className={`h-2 w-2 rounded-full ${isTestnet ? "bg-emerald-500" : "bg-blue-500"} animate-pulse`} />
          <div
            className={`absolute inset-0 h-2 w-2 rounded-full ${isTestnet ? "bg-emerald-500" : "bg-blue-500"} animate-ping`}
          />
        </div>
        <span className="text-xs font-medium">{isTestnet ? "Testnet" : "Mainnet"}</span>
      </div>
      {isTestnet && (
        <Link href="/apply">
          <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 transition-colors">
            Apply Now
          </Badge>
        </Link>
      )}
    </motion.div>
  )
}
