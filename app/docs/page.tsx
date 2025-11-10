"use client"

import { Book, Code2, Shield, Zap, FileText, ExternalLink } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"

export default function DocumentationPage() {
  const sections = [
    {
      title: "Getting Started",
      icon: Zap,
      description: "Quick start guide for integrating Legasi credit layer",
      links: [
        { title: "Introduction", href: "#intro" },
        { title: "Setup & Installation", href: "#setup" },
        { title: "Connect Rabet Wallet", href: "#wallet" },
        { title: "First Loan", href: "#first-loan" },
      ],
    },
    {
      title: "Smart Contracts",
      icon: Code2,
      description: "Soroban contract architecture and integration",
      links: [
        { title: "Loans Contract", href: "#loans" },
        { title: "Liquidation Manager", href: "#liquidation" },
        { title: "Policy Registry", href: "#policy" },
        { title: "Price Oracle", href: "#oracle" },
      ],
    },
    {
      title: "Compliance & Security",
      icon: Shield,
      description: "KYC, custody, and regulatory compliance",
      links: [
        { title: "KYC Integration", href: "#kyc" },
        { title: "Fireblocks Custody", href: "#custody" },
        { title: "Risk Management", href: "#risk" },
        { title: "Audit Reports", href: "#audits" },
      ],
    },
    {
      title: "Resources",
      icon: FileText,
      description: "Additional documentation and external resources",
      links: [
        { title: "White Paper", href: "/whitepaper" },
        { title: "API Reference", href: "/api" },
        { title: "Stellar Docs", href: "https://stellar.org/developers" },
        { title: "Soroban Guide", href: "https://soroban.stellar.org" },
      ],
    },
  ]

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Documentation
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Complete guide to building institutional-grade credit applications on Stellar with Soroban smart contracts
          </p>
        </motion.div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {sections.map((section, idx) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="glass h-full hover:glow-primary transition-all">
                <CardHeader>
                  <section.icon className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {section.links.map((link) => (
                      <li key={link.title}>
                        {link.href.startsWith("http") ? (
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                          >
                            {link.title}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <Link
                            href={link.href}
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            {link.title}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Documentation Content */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle className="text-2xl">Overview</CardTitle>
              <CardDescription>
                Legasi is an institutional-grade credit layer built on the Stellar blockchain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">What is Legasi?</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Legasi enables users to borrow fiat-equivalent stablecoins (USDC, EURC) against digital assets like
                  BTC and native XLM, leveraging Stellar's compliance-ready infrastructure and Soroban's programmable
                  smart contracts. All custody is managed through Fireblocks MPC vaults, ensuring institutional-grade
                  security and segregation.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Key Features</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      <strong>Crypto-Backed Lending:</strong> Borrow stablecoins against BTC, XLM, or USDC collateral
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      <strong>Soroban Smart Contracts:</strong> On-chain logic for lending, liquidations, and risk
                      management
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      <strong>Fireblocks Custody:</strong> Institutional-grade asset segregation and security
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      <strong>Fiat On/Off-Ramps:</strong> Direct conversion via Stellar anchors and Circle
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      <strong>Soft Liquidation:</strong> Progressive risk management to protect borrowers
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Architecture</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The Legasi protocol consists of five core Soroban smart contracts deployed on Stellar:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass p-4 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">Loans Contract</h4>
                    <p className="text-xs text-muted-foreground">
                      Manages borrower positions, interest accrual, and repayment flows
                    </p>
                  </div>
                  <div className="glass p-4 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">Liquidation Manager</h4>
                    <p className="text-xs text-muted-foreground">
                      Monitors collateral health and executes soft liquidations
                    </p>
                  </div>
                  <div className="glass p-4 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">Policy Registry</h4>
                    <p className="text-xs text-muted-foreground">Stores risk parameters and governance configuration</p>
                  </div>
                  <div className="glass p-4 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">Price Oracle</h4>
                    <p className="text-xs text-muted-foreground">
                      Provides real-time price feeds with validation and fallbacks
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button asChild>
                  <Link href="/api">
                    <Code2 className="h-4 w-4 mr-2" />
                    API Reference
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/whitepaper">
                    <Book className="h-4 w-4 mr-2" />
                    Read White Paper
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
