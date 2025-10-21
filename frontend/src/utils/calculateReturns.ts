/**
 * Calculate profit/loss amount
 * @param currentValue - Current market value
 * @param investedValue - Original invested amount
 * @returns Profit or loss amount
 */
export const calculateProfitLoss = (
  currentValue: number,
  investedValue: number
): number => {
  return currentValue - investedValue;
};

/**
 * Calculate profit/loss percentage
 * @param currentValue - Current market value
 * @param investedValue - Original invested amount
 * @returns Profit or loss percentage
 */
export const calculateProfitLossPercent = (
  currentValue: number,
  investedValue: number
): number => {
  if (investedValue === 0) return 0;
  return ((currentValue - investedValue) / investedValue) * 100;
};

/**
 * Calculate current value from shares and market price
 * @param shares - Number of shares
 * @param marketPrice - Current market price per share
 * @returns Total current value
 */
export const calculateCurrentValue = (shares: number, marketPrice: number): number => {
  return shares * marketPrice;
};

/**
 * Calculate invested value from shares and average price
 * @param shares - Number of shares
 * @param avgPrice - Average purchase price per share
 * @returns Total invested value
 */
export const calculateInvestedValue = (shares: number, avgPrice: number): number => {
  return shares * avgPrice;
};

/**
 * Check if a return is positive
 * @param value - The return value (amount or percentage)
 * @returns True if positive, false otherwise
 */
export const isPositiveReturn = (value: number): boolean => {
  return value >= 0;
};
