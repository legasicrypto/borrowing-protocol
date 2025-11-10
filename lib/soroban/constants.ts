// Client-safe contract constants. This file must NOT import Node-only modules.
import { DEMO_CONTRACT_IDS } from "../demo/contracts"

export const CONTRACTS = {
  loans: process.env.NEXT_PUBLIC_SOROBAN_LOANS_CONTRACT || DEMO_CONTRACT_IDS.LOANS,
  liquidationManager:
    process.env.NEXT_PUBLIC_SOROBAN_LIQUIDATION_CONTRACT || DEMO_CONTRACT_IDS.LIQUIDATION,
  policyRegistry: process.env.NEXT_PUBLIC_SOROBAN_POLICY_CONTRACT || DEMO_CONTRACT_IDS.POLICY,
  priceOracle: process.env.NEXT_PUBLIC_SOROBAN_ORACLE_CONTRACT || DEMO_CONTRACT_IDS.ORACLE,
  kycRegistry: process.env.NEXT_PUBLIC_SOROBAN_KYC_CONTRACT || DEMO_CONTRACT_IDS.KYC,
}

export default CONTRACTS
