"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Wallet, Shield, Zap, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/lib/context/wallet-context"
import Image from "next/image"

export default function ConnectPage() {
  const { address, connect, loading } = useWallet()
  const router = useRouter()

  useEffect(() => {
    if (address) {
      router.push("/dashboard")
    }
  }, [address, router])

  const handleConnect = async () => {
    try {
      await connect()
    } catch (error) {
      console.error("Connection failed:", error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-background to-background" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-2xl"
      >
        <div className="glass-strong rounded-3xl p-12 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/legasi-logo-v3QGuhNk-mHOEKJWIY8d63nTjkCxbFV8jIkhcHb.png"
              alt="Legasi"
              width={180}
              height={60}
              className="h-12 w-auto"
            />
          </div>

          <h1 className="text-4xl md:text-5xl font-black mb-4">Connect Your Wallet</h1>
          <p className="text-xl text-muted-foreground mb-12">
            Connect your Rabet wallet to access the Legasi credit platform
          </p>

          {/* Wallet Card */}
          <div className="glass rounded-2xl p-8 mb-8 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center">
                  <Wallet className="h-7 w-7 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold">Rabet Wallet</h3>
                  <p className="text-sm text-muted-foreground">Stellar Network</p>
                </div>
              </div>
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>

          <Button
            onClick={handleConnect}
            disabled={loading}
            size="lg"
            className="w-full gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white rounded-full h-14 text-lg glow-primary"
          >
            {loading ? "Connecting..." : "Connect Rabet Wallet"}
            {!loading && <Wallet className="h-5 w-5" />}
          </Button>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 mt-12 pt-8 border-t border-white/10">
            {[
              { icon: Shield, text: "Secure" },
              { icon: Zap, text: "Instant" },
              { icon: Wallet, text: "Non-Custodial" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <item.icon className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Network Badge */}
        <div className="flex justify-center mt-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-strong">
            <div className="relative">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="absolute inset-0 h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <span className="text-sm font-medium">Stellar Testnet Active</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
