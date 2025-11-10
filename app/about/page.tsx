"use client"

import { motion } from "framer-motion"
import { Shield, Users, Globe, Zap } from "lucide-react"
import Image from "next/image"

export default function AboutPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 gradient-text">About Legasi</h1>
          <p className="text-xl text-muted-foreground flex items-center justify-center gap-2 flex-wrap">
            Building institutional-grade credit infrastructure on
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/502d9b1bbee8c2169cc0eb3d0982ba3bf02ce300-1776x548-ZkZuFs0UmldFjQztQRHaH2TjWuPHFu.avif"
              alt="Stellar"
              width={80}
              height={24}
              className="h-6 w-auto"
            />
          </p>
        </motion.div>

        {/* Mission */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-8 mb-8"
        >
          <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-4">
            Legasi is building an institutional-grade credit layer that enables users to borrow fiat-equivalent
            stablecoins against their digital assets, combining secure custody and programmable on-chain credit logic.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed flex items-center gap-2 flex-wrap">
            The protocol is deployed on
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/502d9b1bbee8c2169cc0eb3d0982ba3bf02ce300-1776x548-ZkZuFs0UmldFjQztQRHaH2TjWuPHFu.avif"
              alt="Stellar"
              width={70}
              height={22}
              className="h-5 w-auto inline-block"
            />
            and powered by Soroban smart contracts, leveraging Stellar's liquidity, compliance-ready infrastructure, and
            built-in fiat rails.
          </p>
        </motion.section>

        {/* Why Stellar */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-3xl font-bold">Why</h2>
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/502d9b1bbee8c2169cc0eb3d0982ba3bf02ce300-1776x548-ZkZuFs0UmldFjQztQRHaH2TjWuPHFu.avif"
              alt="Stellar"
              width={90}
              height={28}
              className="h-7 w-auto"
            />
            <h2 className="text-3xl font-bold">?</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-bold mb-2">Native Fiat Rails</h3>
                <p className="text-sm text-muted-foreground">
                  Anchors and SEPs enable seamless fiat to stablecoin conversion for institutional LPs
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-bold mb-2">Programmability</h3>
                <p className="text-sm text-muted-foreground">
                  Soroban provides modern WASM-based contracts for lending logic and liquidations
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-bold mb-2">Network Performance</h3>
                <p className="text-sm text-muted-foreground">
                  Low transaction costs, sub-second finality, and trusted regulated anchors
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-bold mb-2">Mission Alignment</h3>
                <p className="text-sm text-muted-foreground">
                  Connecting real-world financial institutions with on-chain credit
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Ecosystem Impact */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-8"
        >
          <h2 className="text-3xl font-bold mb-4">Ecosystem Impact</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-primary mb-2">DeFi Primitives on Soroban</h3>
              <p className="text-muted-foreground">
                Introducing lending, borrowing, and liquidation mechanisms natively on Stellar, laying the foundation
                for a broader DeFi ecosystem.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-primary mb-2">Institutional Liquidity</h3>
              <p className="text-muted-foreground">
                Channeling institutional capital into on-chain liquidity pools through regulated fiat on-ramps and
                stablecoin issuers.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-primary mb-2">Open-Source Contributions</h3>
              <p className="text-muted-foreground">
                All Soroban contracts and developer tools will be open-sourced, serving as shared infrastructure for
                future builders.
              </p>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  )
}
