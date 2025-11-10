"use client"

import Link from "next/link"
import { ArrowRight, Shield, Zap, Lock, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import Image from "next/image"
import { useWallet } from "@/lib/context/wallet-context"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { WalletSelectorModal } from "@/components/wallet-selector-modal"
import type { WalletType } from "@/lib/stellar/wallet"

export default function HomePage() {
  const { address, connected } = useWallet()
  const router = useRouter()
  const [showWalletSelector, setShowWalletSelector] = useState(false)

  useEffect(() => {
    if (address) {
      router.push("/dashboard")
    }
  }, [address, router])

  const handleWalletSelect = async (walletType: WalletType) => {
    try {
      const { stellarWallet } = await import("@/lib/stellar/wallet")
      await stellarWallet.connect(walletType)
      window.location.reload()
    } catch (error) {
      console.error("Wallet connection error:", error)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative flex min-h-[90vh] items-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-background to-background" />

        {/* Animated background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f12_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f12_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

        <div className="container relative mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto text-center"
          >
            {/* Network Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-strong mb-8"
            >
              <div className="relative">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <div className="absolute inset-0 h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <span className="text-sm font-medium">Stellar Testnet Active</span>
              <Link href="/apply" className="text-sm text-primary hover:text-primary/80 font-semibold">
                Apply Now →
              </Link>
            </motion.div>

            <h1 className="text-balance text-[clamp(3rem,8vw,6rem)] font-black leading-[0.95] tracking-tight">
              The Institutional
              <br />
              <span className="gradient-text">Credit Layer</span>
              <br />
              on Stellar
            </h1>

            <p className="mt-8 text-balance text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Borrow fiat-backed stablecoins instantly against your digital assets.
              <br className="hidden md:block" />
              Secure custody. Transparent rates. Built on Soroban.
            </p>

            <div className="mt-12 flex flex-col items-center gap-6">
              <div className="flex gap-4 justify-center flex-wrap">
                <Button
                  size="lg"
                  onClick={() => setShowWalletSelector(true)}
                  className="gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white text-lg rounded-full px-12 h-16 glow-primary"
                >
                  Connect Wallet
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Link href="/simulator">
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 glass-strong text-lg rounded-full px-12 h-16 bg-transparent"
                  >
                    Try Simulator
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
            >
              {[
                { value: "$2.5M", label: "Total Value Locked" },
                { value: "450+", label: "Active Loans" },
                { value: "5.2%", label: "Starting APY" },
                { value: "<1s", label: "Approval Time" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  className="glass-strong rounded-2xl p-6"
                >
                  <div className="text-3xl md:text-4xl font-bold gradient-text">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-2">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-violet-950/10 to-background" />

        <div className="container relative mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-black mb-6">Why Legasi?</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Institutional-grade lending infrastructure powered by Stellar and Soroban smart contracts
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
            {[
              {
                icon: Shield,
                title: "Secure Custody",
                description: "Assets secured in Fireblocks vaults with MPC technology and segregated storage",
                gradient: "from-violet-600 to-purple-600",
              },
              {
                icon: Zap,
                title: "Instant Settlement",
                description: "Sub-second finality on Stellar with transparent, on-chain loan execution",
                gradient: "from-cyan-600 to-blue-600",
              },
              {
                icon: Lock,
                title: "Non-Custodial",
                description: "Your keys, your assets. No rehypothecation or pooling of collateral",
                gradient: "from-emerald-600 to-teal-600",
              },
              {
                icon: TrendingUp,
                title: "Competitive Rates",
                description: "Access institutional liquidity pools with rates starting from 5.2% APY",
                gradient: "from-orange-600 to-red-600",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group"
              >
                <div className="glass-strong rounded-3xl p-8 h-full hover:scale-105 transition-transform duration-300">
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6`}
                  >
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-black mb-6">How It Works</h2>
            <p className="text-xl text-muted-foreground">Get started in three simple steps</p>
          </motion.div>

          <div className="grid gap-12 md:grid-cols-3 max-w-6xl mx-auto">
            {[
              {
                step: "01",
                title: "Connect Wallet",
                description: "Link your Rabet wallet to access the platform. Your wallet stays secure throughout.",
              },
              {
                step: "02",
                title: "Deposit Collateral",
                description: "Choose your digital assets (BTC, XLM, or USDC) and deposit into segregated vaults.",
              },
              {
                step: "03",
                title: "Borrow Instantly",
                description: "Receive USDC or EURC stablecoins instantly with transparent terms and competitive rates.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative"
              >
                <div className="glass-strong rounded-3xl p-10 h-full">
                  <div className="text-6xl font-black gradient-text mb-6 opacity-50">{item.step}</div>
                  <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">{item.description}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-6 w-12 h-0.5 bg-gradient-to-r from-violet-600 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link href="/connect">
              <Button
                size="lg"
                className="gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white rounded-full px-12 h-14 text-lg"
              >
                Get Started Now
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Borrow Against Your Crypto */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/10 via-background to-background" />

        <div className="container relative mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-4xl text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-black mb-6">Borrow Against Your Crypto</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Get instant liquidity without selling your assets
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            {[
              {
                name: "Bitcoin",
                symbol: "BTC",
                image:
                  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Bitcoin.svg%20%281%29-rtTEQeg8dzEsSiPC2OQTzX0Nww6gly.webp",
                maxLtv: "70%",
                description: "Use your BTC as collateral",
              },
              {
                name: "USD Coin",
                symbol: "USDC",
                image:
                  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/USD_Coin_logo_%28cropped%29-rWtia6AhuOWCyDdD5afreKnmDMh2Ye.png",
                maxLtv: "90%",
                description: "Stable asset, high loan value",
              },
              {
                name: "Stellar Lumens",
                symbol: "XLM",
                image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/512-IPxhI79CPXHRY7pyzfpzvOX7tfl8f2.png",
                maxLtv: "50%",
                description: "Native Stellar network asset",
              },
            ].map((crypto, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="group"
              >
                <div className="glass-strong rounded-3xl p-8 h-full hover:scale-105 transition-all duration-300 hover:glow-primary">
                  <div className="flex justify-center mb-6">
                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-violet-600/20 to-cyan-600/20 p-4 group-hover:scale-110 transition-transform duration-300">
                      <Image
                        src={crypto.image || "/placeholder.svg"}
                        alt={crypto.name}
                        width={96}
                        height={96}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold mb-2 text-center">{crypto.symbol}</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">{crypto.name}</p>

                  <div className="glass rounded-xl p-4 mb-4">
                    <div className="text-sm text-muted-foreground mb-1">Max LTV</div>
                    <div className="text-2xl font-bold gradient-text">{crypto.maxLtv}</div>
                  </div>

                  <p className="text-muted-foreground text-center leading-relaxed">{crypto.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link href="/simulator">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 glass-strong rounded-full px-12 h-14 text-lg bg-transparent hover:bg-white/5"
              >
                Explore Loan Options
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Powered by Stellar */}
      <section className="py-20 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-center gap-6">
            <p className="text-sm text-muted-foreground uppercase tracking-wider">Built on</p>
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/stellar%20logo-p5hq9AV9z4XuQrSSnIOajetCw7pUrV.png"
              alt="Stellar Network"
              width={180}
              height={56}
              className="h-12 w-auto opacity-80 hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      </section>

      <WalletSelectorModal
        open={showWalletSelector}
        onOpenChange={setShowWalletSelector}
        onWalletSelect={handleWalletSelect}
      />
    </div>
  )
}
