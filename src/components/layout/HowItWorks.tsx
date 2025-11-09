import { motion } from "framer-motion";
import { Wallet, FileCheck, Coins } from "lucide-react";

const STEPS = [
  {
    icon: Wallet,
    title: "Connect Your Wallet",
    description: "Link your crypto wallet or sign up with email to get started in seconds",
    color: "legasi-orange",
  },
  {
    icon: FileCheck,
    title: "Complete KYC Verification",
    description: "Quick 5-step verification process with instant approval",
    color: "legasi-purple",
  },
  {
    icon: Coins,
    title: "Borrow & Manage",
    description: "Choose your collateral and get stablecoins or fiat instantly",
    color: "legasi-green",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-6 bg-legasi-card">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get your crypto-backed loan in three simple steps
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="relative"
            >
              {/* Step Number */}
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-legasi-orange flex items-center justify-center font-bold text-xl text-white z-10">
                {index + 1}
              </div>

              {/* Card */}
              <div className="bg-legasi-dark border border-border rounded-lg p-8 h-full hover:border-legasi-orange/50 transition-all">
                <div className={`w-16 h-16 rounded-full bg-${step.color}/10 flex items-center justify-center mb-6`}>
                  <step.icon className={`w-8 h-8 text-${step.color}`} />
                </div>
                <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Connector Line (hidden on last item) */}
              {index < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-legasi-orange to-transparent" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
