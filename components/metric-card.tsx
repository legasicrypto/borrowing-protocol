"use client"

import type { LucideIcon } from "lucide-react"
import { motion } from "framer-motion"

interface MetricCardProps {
  title: string
  value: string
  change?: string
  icon: LucideIcon
  gradient?: string
}

export function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  gradient = "from-violet-500 to-cyan-400",
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={`mt-2 text-3xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
            {value}
          </p>
          {change && <p className="mt-1 text-xs text-success">{change}</p>}
        </div>
        <div className="rounded-xl bg-primary/10 p-3">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </motion.div>
  )
}
