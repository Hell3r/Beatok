export const applyCommission = (price: number | null, tariffType?: string): number | null => {
  if (price === null || price === undefined) return null;

  if (tariffType === 'leasing' || tariffType === 'exclusive') {
    return Math.ceil(price * 1.1);
  }

  return price;
};
