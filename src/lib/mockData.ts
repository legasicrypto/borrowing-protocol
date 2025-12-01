export interface CryptoPrice {
  symbol: string
  name: string
  price: number
  change24h: number
  icon: string
}

export interface LoanPosition {
  id: string
  collateralType: string
  collateralAmount: number
  borrowedUsdc: number
  ltvRatio: number
  healthFactor: number
  liquidationPrice: number
  interestRate: number
  status: "active" | "closed" | "liquidated"
}

export interface Transaction {
  id: string
  type: "borrow" | "repay" | "add_collateral" | "withdraw_collateral"
  amount: number
  currency: string
  timestamp: string
  status: "success" | "pending" | "failed"
}

export const mockCryptoPrices: CryptoPrice[] = [
  { symbol: "BTC", name: "Bitcoin", price: 67840, change24h: -1.5, icon: "₿" },
  { symbol: "ETH", name: "Ethereum", price: 3245, change24h: 2.1, icon: "Ξ" },
  { symbol: "USDC", name: "USD Coin", price: 1.0, change24h: 0.0, icon: "$" },
]

export const mockWallet = {
  address: "7xKXtg2rCfVmXy9uTpq1hGkPZr8nM3",
  verified: true,
  balance: {
    BTC: 1.5,
    ETH: 2.3,
    USDC: 15000,
  },
}

export const mockLoanPosition: LoanPosition = {
  id: "loan-001",
  collateralType: "BTC",
  collateralAmount: 0.5,
  borrowedUsdc: 10500,
  ltvRatio: 61.4,
  healthFactor: 1.63,
  liquidationPrice: 45000,
  interestRate: 5.2,
  status: "active",
}

export const mockTransactions: Transaction[] = [
  {
    id: "tx-001",
    type: "borrow",
    amount: 10500,
    currency: "USDC",
    timestamp: "2025-10-10T14:30:00Z",
    status: "success",
  },
  {
    id: "tx-002",
    type: "add_collateral",
    amount: 0.1,
    currency: "BTC",
    timestamp: "2025-10-09T10:15:00Z",
    status: "success",
  },
]

// Mock LTV history data (for charts)
export const mockLtvHistory = [
  { date: "Oct 1", ltv: 55 },
  { date: "Oct 2", ltv: 58 },
  { date: "Oct 3", ltv: 56 },
  { date: "Oct 4", ltv: 60 },
  { date: "Oct 5", ltv: 62 },
  { date: "Oct 6", ltv: 59 },
  { date: "Oct 7", ltv: 61.4 },
]

export const mockBtcPriceHistory = [
  { time: "00:00", price: 66500 },
  { time: "04:00", price: 67000 },
  { time: "08:00", price: 66800 },
  { time: "12:00", price: 67500 },
  { time: "16:00", price: 68000 },
  { time: "20:00", price: 67840 },
]
