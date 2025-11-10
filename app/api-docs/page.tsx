"use client"

import { Code, Terminal, Key, Database, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"

export default function APIReferencePage() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            API Reference
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            REST API and Soroban contract interfaces for the Legasi credit protocol
          </p>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: "REST Endpoints", value: "12+", icon: Terminal },
            { label: "Smart Contracts", value: "5", icon: Code },
            { label: "Response Time", value: "<100ms", icon: Zap },
            { label: "Uptime", value: "99.9%", icon: Database },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="glass text-center">
                <CardContent className="pt-6">
                  <stat.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold mb-1">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* API Documentation */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Terminal className="h-6 w-6" />
                REST API
              </CardTitle>
              <CardDescription>HTTP endpoints for interacting with the Legasi protocol</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="positions" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="positions">Positions</TabsTrigger>
                  <TabsTrigger value="prices">Prices</TabsTrigger>
                  <TabsTrigger value="vaults">Vaults</TabsTrigger>
                  <TabsTrigger value="liquidations">Liquidations</TabsTrigger>
                </TabsList>

                <TabsContent value="positions" className="space-y-4">
                  <div className="glass p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded font-mono">GET</span>
                      <code className="text-sm">/api/positions</code>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Fetch all loan positions for a wallet</p>
                    <div className="bg-black/30 p-3 rounded text-xs font-mono">
                      <div className="text-gray-400">// Query Parameters</div>
                      <div>
                        <span className="text-blue-400">wallet</span>
                        <span className="text-gray-500">: string</span>{" "}
                        <span className="text-gray-600">// Stellar public key</span>
                      </div>
                    </div>
                  </div>

                  <div className="glass p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded font-mono">POST</span>
                      <code className="text-sm">/api/positions/open</code>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Create a new loan position</p>
                    <div className="bg-black/30 p-3 rounded text-xs font-mono">
                      <div className="text-gray-400">// Request Body</div>
                      <div>{"{"}</div>
                      <div className="pl-4">
                        <span className="text-blue-400">&quot;wallet&quot;</span>:{" "}
                        <span className="text-green-400">&quot;G...&quot;</span>,
                      </div>
                      <div className="pl-4">
                        <span className="text-blue-400">&quot;collateralAsset&quot;</span>:{" "}
                        <span className="text-green-400">&quot;BTC&quot;</span>,
                      </div>
                      <div className="pl-4">
                        <span className="text-blue-400">&quot;collateralAmount&quot;</span>:{" "}
                        <span className="text-orange-400">1.5</span>,
                      </div>
                      <div className="pl-4">
                        <span className="text-blue-400">&quot;borrowAsset&quot;</span>:{" "}
                        <span className="text-green-400">&quot;USDC&quot;</span>,
                      </div>
                      <div className="pl-4">
                        <span className="text-blue-400">&quot;borrowAmount&quot;</span>:{" "}
                        <span className="text-orange-400">50000</span>
                      </div>
                      <div>{"}"}</div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="prices" className="space-y-4">
                  <div className="glass p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded font-mono">GET</span>
                      <code className="text-sm">/api/prices</code>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Get all oracle price feeds</p>
                    <div className="bg-black/30 p-3 rounded text-xs font-mono">
                      <div className="text-gray-400">// Response</div>
                      <div>[</div>
                      <div className="pl-4">{"{"}</div>
                      <div className="pl-8">
                        <span className="text-blue-400">&quot;symbol&quot;</span>:{" "}
                        <span className="text-green-400">&quot;BTC/USD&quot;</span>,
                      </div>
                      <div className="pl-8">
                        <span className="text-blue-400">&quot;price&quot;</span>:{" "}
                        <span className="text-orange-400">95234.50</span>,
                      </div>
                      <div className="pl-8">
                        <span className="text-blue-400">&quot;source&quot;</span>:{" "}
                        <span className="text-green-400">&quot;aggregated&quot;</span>,
                      </div>
                      <div className="pl-8">
                        <span className="text-blue-400">&quot;timestamp&quot;</span>:{" "}
                        <span className="text-green-400">&quot;2025-01-08T...&quot;</span>
                      </div>
                      <div className="pl-4">{"},"}</div>
                      <div className="pl-4 text-gray-600">...</div>
                      <div>]</div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="vaults" className="space-y-4">
                  <div className="glass p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded font-mono">GET</span>
                      <code className="text-sm">/api/vaults</code>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">List Fireblocks custody vaults</p>
                    <div className="bg-black/30 p-3 rounded text-xs font-mono">
                      <div className="text-gray-400">// Query Parameters</div>
                      <div>
                        <span className="text-blue-400">wallet</span>
                        <span className="text-gray-500">: string</span>{" "}
                        <span className="text-gray-600">// Owner address</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="liquidations" className="space-y-4">
                  <div className="glass p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded font-mono">GET</span>
                      <code className="text-sm">/api/liquidations</code>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Fetch liquidation intents and receipts</p>
                    <div className="bg-black/30 p-3 rounded text-xs font-mono">
                      <div className="text-gray-400">// Query Parameters</div>
                      <div>
                        <span className="text-blue-400">wallet</span>
                        <span className="text-gray-500">?: string</span>
                      </div>
                      <div>
                        <span className="text-blue-400">status</span>
                        <span className="text-gray-500">
                          ?: &quot;pending&quot; | &quot;executed&quot; | &quot;failed&quot;
                        </span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Smart Contracts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12"
        >
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Code className="h-6 w-6" />
                Soroban Contracts
              </CardTitle>
              <CardDescription>On-chain smart contract interfaces deployed on Stellar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Loans Contract</h3>
                  <code className="text-xs text-muted-foreground block mb-2">
                    Contract ID: {process.env.NEXT_PUBLIC_SOROBAN_LOANS_CONTRACT || "CXXXXXXXX..."}
                  </code>
                  <p className="text-sm text-muted-foreground">
                    Manages loan positions, interest accrual, and repayments
                  </p>
                </div>

                <div className="glass p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Liquidation Manager</h3>
                  <code className="text-xs text-muted-foreground block mb-2">
                    Contract ID: {process.env.NEXT_PUBLIC_SOROBAN_LIQUIDATION_CONTRACT || "CXXXXXXXX..."}
                  </code>
                  <p className="text-sm text-muted-foreground">
                    Monitors health factors and executes soft liquidations
                  </p>
                </div>

                <div className="glass p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Price Oracle</h3>
                  <code className="text-xs text-muted-foreground block mb-2">
                    Contract ID: {process.env.NEXT_PUBLIC_SOROBAN_ORACLE_CONTRACT || "CXXXXXXXX..."}
                  </code>
                  <p className="text-sm text-muted-foreground">Provides validated real-time price feeds</p>
                </div>

                <div className="glass p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Policy Registry</h3>
                  <code className="text-xs text-muted-foreground block mb-2">
                    Contract ID: {process.env.NEXT_PUBLIC_SOROBAN_POLICY_CONTRACT || "CXXXXXXXX..."}
                  </code>
                  <p className="text-sm text-muted-foreground">Stores governance parameters and risk configuration</p>
                </div>
              </div>

              <div className="glass p-4 rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Environment Variables
                </h3>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NEXT_PUBLIC_STELLAR_NETWORK</span>
                    <span>{process.env.NEXT_PUBLIC_STELLAR_NETWORK || "testnet"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NEXT_PUBLIC_SOROBAN_RPC_URL</span>
                    <span className="text-xs">https://soroban-testnet.stellar.org</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
