"use client"

import { motion } from "framer-motion"
import { Download, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function WhitepaperPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 gradient-text">Technical White Paper</h1>
          <p className="text-xl text-muted-foreground mb-8">Legasi × Stellar: Institutional Credit Infrastructure</p>
          <Button className="gap-2 bg-gradient-to-r from-primary to-accent">
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        </motion.div>

        {/* Executive Summary */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-8 mb-8"
        >
          <h2 className="text-3xl font-bold mb-4">Executive Summary</h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-4">
            Legasi is building an institutional-grade credit layer that enables users to borrow fiat-equivalent
            stablecoins against their digital assets, combining secure custody and programmable on-chain credit logic.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            The protocol is deployed on Stellar and powered by Soroban smart contracts, leveraging Stellar's liquidity,
            compliance-ready infrastructure, and built-in fiat rails.
          </p>
        </motion.section>

        {/* System Overview */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-8 mb-8"
        >
          <h2 className="text-3xl font-bold mb-4">System Overview</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Legasi operates as a crypto-backed Lombard loan protocol, enabling users to lock BTC or USDC as collateral
            and borrow USDC or EURC stablecoins directly on-chain under predefined conditions designed to support
            long-term financing.
          </p>

          <h3 className="text-xl font-bold mt-6 mb-3 text-primary">High-Level Workflow</h3>
          <ol className="space-y-3 text-muted-foreground">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                1
              </span>
              <span>Institutional LPs fund the liquidity pool via fiat-to-stablecoin conversion</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                2
              </span>
              <span>Users complete KYC verification through external providers</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                3
              </span>
              <span>Borrowers deposit collateral into segregated Fireblocks custody vaults</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                4
              </span>
              <span>Soroban smart contracts manage credit lines, repayments, and liquidation thresholds</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                5
              </span>
              <span>On-chain oracles feed real-time prices to monitor LTV ratios</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                6
              </span>
              <span>Progressive soft-liquidation protects borrowers during market volatility</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                7
              </span>
              <span>Borrowers can off-ramp stablecoins directly to fiat through Stellar anchors</span>
            </li>
          </ol>
        </motion.section>

        {/* Technical Architecture */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-8 mb-8"
        >
          <h2 className="text-3xl font-bold mb-4">Technical Architecture</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-2 text-primary">Smart Contracts (Soroban)</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    <strong>Loans Contract:</strong> Manages lending logic, principal, interest accrual, and repayments
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    <strong>LiquidationManager:</strong> Oversees collateral health and soft-liquidation logic
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    <strong>PolicyRegistry:</strong> Stores risk parameters, LTV bands, and interest formulas
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    <strong>PriceOracleAdapter:</strong> Integrates oracle feeds with price validation
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    <strong>KYCRegistry:</strong> Maintains borrower and LP eligibility status
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2 text-primary">Custody with Fireblocks</h3>
              <p className="text-muted-foreground leading-relaxed">
                Each borrower position corresponds to a dedicated Fireblocks MPC vault ensuring strict segregation, no
                rehypothecation, and controlled liquidation access. This hybrid custody design combines native asset
                safety, deep-market liquidity access, and on-chain transparency.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2 text-primary">Fiat Integration (SEPs)</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Leveraging Stellar's SEP standards for seamless fiat integration:
              </p>
              <ul className="space-y-1 text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    <strong>SEP-10:</strong> WebAuth authentication for secure user login
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    <strong>SEP-12:</strong> KYC verification with trusted anchors
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    <strong>SEP-24:</strong> Direct fiat off-ramp to bank accounts
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </motion.section>

        {/* Links */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold mb-4">Additional Resources</h2>
          <div className="space-y-3">
            <a
              href="https://github.com/legasi/contracts"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              View Soroban Smart Contracts on GitHub
            </a>
            <a
              href="https://docs.stellar.org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              Stellar Network Documentation
            </a>
            <a
              href="https://soroban.stellar.org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              Soroban Smart Contracts Guide
            </a>
          </div>
        </motion.section>
      </div>
    </div>
  )
}
