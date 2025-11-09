/**
 * Calculate LTV (Loan-to-Value) ratio
 * @param borrowed - Amount borrowed in USDC
 * @param collateralValue - Total value of collateral in USD
 * @returns LTV ratio as a percentage
 */
export function calculateLTV(borrowed: number, collateralValue: number): number {
  if (collateralValue === 0) return 0;
  return (borrowed / collateralValue) * 100;
}

/**
 * Calculate Health Factor
 * Formula: (Collateral Value × Liquidation Threshold) / Borrowed Amount
 * Liquidation threshold is typically 80% (0.80)
 * @param collateralValue - Total value of collateral in USD
 * @param borrowed - Amount borrowed in USDC
 * @param liquidationThreshold - Liquidation threshold (default: 0.80)
 * @returns Health factor (>1 is healthy, <1 is at risk)
 */
export function calculateHealthFactor(
  collateralValue: number,
  borrowed: number,
  liquidationThreshold: number
): number {
  if (borrowed === 0) return 999; // No debt = infinite health
  return (collateralValue * liquidationThreshold) / borrowed;
}

/**
 * Calculate liquidation price for a crypto asset
 * @param borrowed - Amount borrowed in USDC
 * @param collateralAmount - Amount of crypto collateral
 * @param liquidationThreshold - Liquidation threshold (default: 0.80)
 * @returns Price at which liquidation occurs
 */
export function calculateLiquidationPrice(
  borrowed: number,
  collateralAmount: number,
  liquidationThreshold: number
): number {
  if (collateralAmount === 0) return 0;
  return borrowed / (collateralAmount * liquidationThreshold);
}

/**
 * Calculate maximum borrowable amount
 * @param collateralValue - Total value of collateral in USD
 * @param maxLTV - Maximum LTV allowed (default: 75%)
 * @returns Maximum amount that can be borrowed
 */
export function calculateMaxBorrowable(
  collateralValue: number,
  maxLTV: number = 75
): number {
  return (collateralValue * maxLTV) / 100;
}

/**
 * Calculate interest accrued
 * @param principal - Principal amount
 * @param rate - Annual interest rate (as percentage, e.g., 5.2 for 5.2%)
 * @param days - Number of days
 * @returns Interest accrued
 */
export function calculateInterest(
  principal: number,
  rate: number,
  days: number
): number {
  return (principal * (rate / 100) * days) / 365;
}

/**
 * Calculate accrued interest based on loan duration
 * @param borrowedAmount - Amount borrowed
 * @param annualRate - Annual interest rate (as percentage, e.g., 5.2 for 5.2%)
 * @param createdAt - Loan creation timestamp (ISO string)
 * @returns Interest accrued, prorated by days
 */
export function calculateAccruedInterest(
  borrowedAmount: number,
  annualRate: number,
  createdAt: string
): number {
  const now = Date.now();
  const created = new Date(createdAt).getTime();
  const daysElapsed = Math.max(1, Math.floor((now - created) / (1000 * 60 * 60 * 24)));
  const interestAccrued = (borrowedAmount * annualRate * daysElapsed) / (100 * 365);
  return Math.round(interestAccrued * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate monthly payment for a loan
 * @param principal - Principal amount
 * @param annualRate - Annual interest rate (as percentage)
 * @param months - Number of months
 * @returns Monthly payment amount
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  months: number = 12
): number {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / months;
  
  const payment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);
  
  return payment;
}

/**
 * Get risk level based on LTV ratio
 * @param ltv - LTV ratio as percentage
 * @returns Risk level
 */
export function getRiskLevel(ltv: number): "healthy" | "warning" | "critical" {
  if (ltv < 60) return "healthy";
  if (ltv < 75) return "warning";
  return "critical";
}

/**
 * Format currency value
 * @param value - Numeric value
 * @param decimals - Number of decimal places
 * @returns Formatted string
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format crypto amount
 * @param value - Numeric value
 * @param symbol - Crypto symbol
 * @param decimals - Number of decimal places
 * @returns Formatted string
 */
export function formatCrypto(value: number, symbol: string, decimals: number = 4): string {
  return `${value.toFixed(decimals)} ${symbol}`;
}

/**
 * Calculate all loan metrics at once
 * @param collateralAmount - Amount of crypto collateral
 * @param borrowAmount - Amount borrowed in USDC
 * @param cryptoPrice - Current price of the crypto asset
 * @returns Object with ltvRatio, healthFactor, and liquidationPrice
 */
export function calculateLoanMetrics(
  collateralAmount: number,
  borrowAmount: number,
  cryptoPrice: number,
  liquidationThreshold: number
) {
  const collateralValue = collateralAmount * cryptoPrice;
  const ltvRatio = calculateLTV(borrowAmount, collateralValue);
  const healthFactor = calculateHealthFactor(collateralValue, borrowAmount, liquidationThreshold);
  const liquidationPrice = calculateLiquidationPrice(borrowAmount, collateralAmount, liquidationThreshold);

  return {
    ltvRatio,
    healthFactor,
    liquidationPrice,
    collateralValue,
  };
}
