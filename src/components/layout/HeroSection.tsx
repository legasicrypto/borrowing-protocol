import { GlowButton } from "@/components/ui/GlowButton";
import { motion } from "framer-motion";
import { TrendingUp, Lock, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-8">
          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              The institutional-grade{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-legasi-orange to-orange-400">
                credit layer
              </span>
              <br />
              for digital assets.
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Borrow fiat instantly against your crypto, without selling it.
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <GlowButton
              className="text-lg px-10 py-4"
              onClick={() => navigate("/auth")}
            >
              Launch App
            </GlowButton>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12"
          >
            <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-legasi-card border border-border">
              <div className="w-12 h-12 rounded-full bg-legasi-orange/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-legasi-orange" />
              </div>
              <h3 className="font-semibold text-lg">Instant Approval</h3>
              <p className="text-sm text-muted-foreground">Get your loan approved in seconds</p>
            </div>

            <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-legasi-card border border-border">
              <div className="w-12 h-12 rounded-full bg-legasi-green/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-legasi-green" />
              </div>
              <h3 className="font-semibold text-lg">Competitive Rates</h3>
              <p className="text-sm text-muted-foreground">Starting from 5.2% APY</p>
            </div>

            <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-legasi-card border border-border">
              <div className="w-12 h-12 rounded-full bg-legasi-purple/10 flex items-center justify-center">
                <Lock className="w-6 h-6 text-legasi-purple" />
              </div>
              <h3 className="font-semibold text-lg">Secure & Transparent</h3>
              <p className="text-sm text-muted-foreground">Your assets stay safe</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
