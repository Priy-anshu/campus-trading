/**
 * Formats a number to display in millions with "M" suffix
 * @param value - The number to format
 * @returns Formatted string (e.g., "1.5M", "25M", "0.1M")
 */
export const formatVolume = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  
  if (isNaN(num) || num === 0) return '0';
  
  // Convert to millions
  const millions = num / 1000000;
  
  // Format with appropriate decimal places
  if (millions >= 100) {
    return `${Math.round(millions)}M`;
  } else if (millions >= 10) {
    return `${millions.toFixed(1)}M`;
  } else {
    return `${millions.toFixed(2)}M`;
  }
};
