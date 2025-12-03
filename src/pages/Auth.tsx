"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { motion } from "framer-motion"
import { Wallet, Mail, LogOut } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GlowButton } from "@/components/ui/GlowButton"
import { OutlineButton } from "@/components/ui/OutlineButton"
import { Footer } from "@/components/layout/Footer"
import legasiLogo from "@/assets/legasi-logo.png"
import { useWallet } from "@/hooks/useWallet"
import bs58 from "bs58"

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://hjnzdgyjbymmgbgndhve.supabase.co"
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const authSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
})

export default function Auth() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup")
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const { address, isConnected, signMessage, connect, disconnect } = useWallet()

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard")
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard")
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  // Removed auto-auth on connect - let user click button explicitly

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    try {
      authSchema.parse({ email, password })

      if (!isLogin && password !== confirmPassword) {
        toast.error("Passwords do not match")
        return
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message)
        return
      }
    }

    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password")
          } else {
            toast.error(error.message)
          }
          return
        }

        toast.success("Welcome back!")
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        })

        if (error) {
          if (error.message.includes("User already registered")) {
            toast.error("This email is already registered. Please login instead.")
          } else {
            toast.error(error.message)
          }
          return
        }

        toast.success("Account created! Welcome to Legasi!")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
      console.error("Auth error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleWalletAuth = async () => {
    if (!address) {
      toast.error("No wallet connected")
      return
    }

    try {
      toast.info("Please sign the message to authenticate...")

      // Create message to sign
      const message = `Sign this message to authenticate with Legasi\n\nWallet: ${address}\nTimestamp: ${Date.now()}`

      // Request signature via WalletConnect
      const { signature, publicKey } = await signMessage(message)

      const signatureBase58 = bs58.encode(signature)

      console.log("[v0] Signature data:", {
        publicKey,
        signatureLength: signature.length,
        signatureBase58Length: signatureBase58.length,
      })

      toast.info("Verifying signature...")

      const response = await fetch(`${SUPABASE_URL}/functions/v1/wallet-auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          walletAddress: publicKey,
          signature: signatureBase58,
          message,
        }),
      })

      const data = await response.json()

      console.log("[v0] Edge function response:", { status: response.status, data })

      if (!response.ok) {
        console.error("[v0] Edge function error:", data)
        throw new Error(data.error || "Authentication failed")
      }

      if (!data?.token) {
        throw new Error("Failed to get authentication token")
      }

      // Verify the token with Supabase
      const { data: authData, error: authError } = await supabase.auth.verifyOtp({
        token_hash: data.token,
        type: "magiclink",
      })

      if (authError) {
        throw authError
      }

      toast.success(`Wallet connected: ${address.substring(0, 8)}...${address.slice(-6)}`)

      // Navigation will happen automatically via onAuthStateChange
    } catch (error: any) {
      console.error("[v0] Wallet authentication error:", error)

      if (error.message?.includes("User rejected") || error.message?.includes("rejected")) {
        toast.error("Authentication rejected by user")
      } else {
        toast.error(error.message || "Failed to authenticate. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleWalletConnect = async () => {
    setLoading(true)

    try {
      if (isConnected && address) {
        await handleWalletAuth()
      } else {
        // Open WalletConnect modal
        toast.info("Opening wallet connection...")
        await connect()
        setLoading(false)
      }
    } catch (error: any) {
      console.error("[v0] Wallet connection error:", error)
      toast.error(error.message || "Failed to connect wallet. Please try again.")
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
      toast.info("Wallet disconnected")
    } catch (error: any) {
      console.error("[v0] Disconnect error:", error)
    }
  }

  return (
    <div className="min-h-screen bg-legasi-dark flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <img
                src={legasiLogo || "/placeholder.svg"}
                alt="Legasi"
                className="h-12 mx-auto cursor-pointer"
                onClick={() => navigate("/")}
              />
            </div>
            <p className="text-muted-foreground">{isLogin ? "Welcome back" : "Create your account"}</p>
          </div>

          <div className="bg-legasi-card border border-border rounded-lg p-8 space-y-6">
            {/* Tab Switcher */}
            <div className="flex gap-2 p-1 bg-background rounded-lg">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 rounded-md font-medium transition-colors ${
                  isLogin ? "bg-legasi-orange text-white" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 rounded-md font-medium transition-colors ${
                  !isLogin ? "bg-legasi-orange text-white" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign Up
              </button>
            </div>

            <div className="space-y-2">
              {isConnected && address ? (
                <>
                  <div className="text-sm text-center text-muted-foreground mb-2">
                    Connected: {address.substring(0, 6)}...{address.slice(-4)}
                  </div>
                  <GlowButton onClick={handleWalletConnect} disabled={loading} className="w-full">
                    <Wallet className="w-5 h-5" />
                    {loading ? "Authenticating..." : "Sign to Authenticate"}
                  </GlowButton>
                  <button
                    onClick={handleDisconnect}
                    className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Disconnect & Use Different Wallet
                  </button>
                </>
              ) : (
                <>
                  <GlowButton onClick={handleWalletConnect} disabled={loading} className="w-full">
                    <Wallet className="w-5 h-5" />
                    Connect Wallet
                  </GlowButton>
                  <p className="text-xs text-muted-foreground text-center">
                    Supports Phantom, Solflare, and other Solana wallets
                  </p>
                </>
              )}
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-legasi-card text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              <OutlineButton type="submit" disabled={loading} className="w-full">
                {loading ? "Please wait..." : isLogin ? "Login" : "Create Account"}
              </OutlineButton>
            </form>

            {/* Footer */}
            <div className="text-center text-sm text-muted-foreground">
              {isLogin ? (
                <p>
                  Don't have an account?{" "}
                  <button onClick={() => setIsLogin(false)} className="text-legasi-orange hover:underline">
                    Sign up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button onClick={() => setIsLogin(true)} className="text-legasi-orange hover:underline">
                    Login
                  </button>
                </p>
              )}
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-6">
            <button
              onClick={() => navigate("/")}
              className="text-sm text-muted-foreground hover:text-legasi-orange transition-colors"
            >
              ← Back to home
            </button>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  )
}
