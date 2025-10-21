/**
 * Format a number as Indian currency
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
};

/**
 * Format a number with Indian numbering system (lakhs, crores)
 * @param amount - The amount to format
 * @returns Formatted number string
 */
export const formatIndianNumber = (amount: number): string => {
  return new Intl.NumberFormat('en-IN').format(amount);
};

/**
 * Format a percentage change
 * @param percent - The percentage value
 * @param showSign - Whether to show + for positive values (default: true)
 * @returns Formatted percentage string
 */
export const formatPercent = (percent: number, showSign: boolean = true): string => {
  const sign = showSign && percent > 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
};
