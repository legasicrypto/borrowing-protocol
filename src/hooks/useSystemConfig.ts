"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

export const useSystemConfig = () => {
  const [maxLtvBtc, setMaxLtvBtc] = useState(50)
  const [maxLtvUsdc, setMaxLtvUsdc] = useState(75)
  const [liquidationThreshold, setLiquidationThreshold] = useState(0.8)
  const [interestRate, setInterestRate] = useState(5.2)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let channel: RealtimeChannel

    const setupConfig = async () => {
      // Fetch initial config values
      const { data, error } = await supabase.from("system_config").select("*")

      if (!error && data) {
        data.forEach((config) => {
          switch (config.config_key) {
            case "max_ltv_sol":
            case "max_ltv_btc":
              setMaxLtvBtc(Number.parseFloat(config.config_value))
              break
            case "max_ltv_usdc":
              setMaxLtvUsdc(Number.parseFloat(config.config_value))
              break
            case "liquidation_threshold":
              setLiquidationThreshold(Number.parseFloat(config.config_value))
              break
            case "interest_rate":
              setInterestRate(Number.parseFloat(config.config_value))
              break
          }
        })
      }
      setLoading(false)

      // Subscribe to realtime changes
      channel = supabase
        .channel("system-config-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "system_config",
          },
          (payload) => {
            const config = payload.new as { config_key: string; config_value: string }
            switch (config.config_key) {
              case "max_ltv_sol":
              case "max_ltv_btc":
                setMaxLtvBtc(Number.parseFloat(config.config_value))
                break
              case "max_ltv_usdc":
                setMaxLtvUsdc(Number.parseFloat(config.config_value))
                break
              case "liquidation_threshold":
                setLiquidationThreshold(Number.parseFloat(config.config_value))
                break
              case "interest_rate":
                setInterestRate(Number.parseFloat(config.config_value))
                break
            }
          },
        )
        .subscribe()
    }

    setupConfig()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [])

  return { maxLtvBtc, maxLtvUsdc, liquidationThreshold, interestRate, loading }
}
