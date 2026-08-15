/**
 * Formats a numeric price into Indian Rupee (₹) format
 * e.g. 99 -> ₹99, 1000 -> ₹1,000, 10000 -> ₹10,000, 100000 -> ₹1,00,000, 1.99 -> ₹1.99
 */
export const formatINR = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '₹0';
  }
  const num = Number(amount);
  const isInt = Number.isInteger(num);
  const formatted = num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: isInt ? 0 : 2,
  });
  return `₹${formatted}`;
};
