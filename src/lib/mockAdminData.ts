export interface AdminUser {
  id: string;
  wallet: string;
  name: string;
  email: string;
  kycStatus: "verified" | "pending" | "rejected";
  collateral: number;
  borrowed: number;
  ltv: number;
  healthFactor: number;
  joinedAt: string;
}

export interface AdminMetrics {
  tvl: number;
  activeLoans: number;
  totalBorrowed: number;
  revenue: number;
  tvlChange: number;
  loansChange: number;
  borrowedChange: number;
  revenueChange: number;
}

export interface AdminTransaction {
  id: string;
  wallet: string;
  type: "borrow" | "repay" | "add_collateral" | "withdraw_collateral" | "liquidation";
  amount: number;
  currency: string;
  timestamp: string;
  status: "success" | "pending" | "failed";
  txHash: string;
}

export const mockAdminMetrics: AdminMetrics = {
  tvl: 2400000,
  activeLoans: 143,
  totalBorrowed: 1800000,
  revenue: 24580,
  tvlChange: 12.5,
  loansChange: 8,
  borrowedChange: 5.2,
  revenueChange: 1240,
};

export const mockAdminUsers: AdminUser[] = [
  {
    id: "1",
    wallet: "7xKXtg2rCfVmXy9uTpq1hGkPZr8nM3",
    name: "John Doe",
    email: "john@example.com",
    kycStatus: "verified",
    collateral: 17100,
    borrowed: 10500,
    ltv: 61.4,
    healthFactor: 1.63,
    joinedAt: "2025-09-15",
  },
  {
    id: "2",
    wallet: "9aLMn5pQrSt8uVwXy2zAbCdEfGhI4j",
    name: "Alice Smith",
    email: "alice@example.com",
    kycStatus: "pending",
    collateral: 24500,
    borrowed: 15000,
    ltv: 61.2,
    healthFactor: 1.64,
    joinedAt: "2025-10-01",
  },
  {
    id: "3",
    wallet: "3bNpQr6sT9uVwXy1zAbCdEfGhI5jK",
    name: "Bob Johnson",
    email: "bob@example.com",
    kycStatus: "verified",
    collateral: 32000,
    borrowed: 20000,
    ltv: 62.5,
    healthFactor: 1.60,
    joinedAt: "2025-08-20",
  },
];

export const mockAdminTransactions: AdminTransaction[] = [
  {
    id: "tx-admin-001",
    wallet: "7xKXtg2rCfVmXy9uTpq1hGkPZr8nM3",
    type: "borrow",
    amount: 10500,
    currency: "USDC",
    timestamp: "2025-10-10T14:30:00Z",
    status: "success",
    txHash: "5FHneW46xGXgs5mUiveU4sbTy...",
  },
  {
    id: "tx-admin-002",
    wallet: "9aLMn5pQrSt8uVwXy2zAbCdEfGhI4j",
    type: "add_collateral",
    amount: 50,
    currency: "SOL",
    timestamp: "2025-10-10T12:15:00Z",
    status: "success",
    txHash: "3D4f7h9jKlMnOpQrStUvWxYz...",
  },
  {
    id: "tx-admin-003",
    wallet: "3bNpQr6sT9uVwXy1zAbCdEfGhI5jK",
    type: "repay",
    amount: 5000,
    currency: "USDC",
    timestamp: "2025-10-10T10:00:00Z",
    status: "success",
    txHash: "8GhI1jKl4mNoP6qRsTuVwX...",
  },
];

// Mock TVL history for charts (30 days)
export const mockTvlHistory = Array.from({ length: 30 }, (_, i) => ({
  date: `Oct ${i + 1}`,
  tvl: 2000000 + Math.random() * 500000,
}));

// Mock loan distribution
export const mockLoanDistribution = [
  { name: "Healthy", value: 78, color: "#14F195" },
  { name: "Warning", value: 15, color: "#EAB308" },
  { name: "At Risk", value: 7, color: "#EF4444" },
];

// Mock collateral distribution
export const mockCollateralDistribution = [
  { crypto: "SOL", amount: 1872000, percentage: 78 },
  { crypto: "BTC", amount: 360000, percentage: 15 },
  { crypto: "ETH", amount: 168000, percentage: 7 },
];
