// Database types for Legasi protocol

export interface User {
  id: string
  stellar_address: string
  email?: string
  kyc_status: "pending" | "approved" | "rejected"
  kyc_provider?: string
  kyc_completed_at?: string
  created_at: string
  updated_at: string
}

export interface Vault {
  id: string
  user_id: string
  vault_id: string
  asset_type: string
  balance: number
  locked_balance: number
  status: "active" | "locked" | "liquidating"
  created_at: string
  updated_at: string
}

export interface Position {
  id: string
  user_id: string
  vault_id: string
  position_id: string
  collateral_asset: string
  collateral_amount: number
  borrowed_asset: string
  borrowed_amount: number
  interest_rate: number
  ltv_ratio: number
  liquidation_threshold: number
  status: "active" | "repaid" | "liquidated"
  created_at: string
  updated_at: string
}

export interface PriceFeed {
  id: string
  asset_pair: string
  price: number
  source: string
  confidence?: number
  published_at: string
  pushed_to_chain: boolean
  tx_hash?: string
  created_at: string
}

export interface LiquidationIntent {
  id: string
  position_id: string
  intent_id: string
  collateral_to_sell: number
  min_output: number
  deadline: string
  status: "pending" | "executed" | "cancelled" | "expired"
  created_at: string
  executed_at?: string
}

export interface LPDeposit {
  id: string
  user_id: string
  asset: string
  amount: number
  lp_tokens: number
  apy?: number
  status: "active" | "withdrawn"
  deposited_at: string
  withdrawn_at?: string
}

export interface PolicyParameter {
  id: string
  parameter_name: string
  parameter_value: string
  description?: string
  updated_at: string
}

export interface SystemMetric {
  id: string
  metric_name: string
  metric_value: number
  metric_type: "tvl" | "volume" | "count" | "ratio"
  recorded_at: string
}
