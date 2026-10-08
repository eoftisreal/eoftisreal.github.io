export function normalizeStock(stock: unknown): number | undefined {
  if (typeof stock !== 'number' && typeof stock !== 'string') {
    return undefined;
  }

  if (typeof stock === 'string' && stock.trim() === '') {
    return undefined;
  }

  const value = Number(stock);

  return Number.isSafeInteger(value) && value >= 0
    ? value
    : undefined;
}

export function productQuantity(
  items: { productId: string; quantity: number }[],
  productId: string
): number {
  return items.reduce(
    (total, item) =>
      total + (item.productId === productId ? item.quantity : 0),
    0
  );
}

export const inventoryQueryOptions = {
  staleTime: 0,
  refetchOnMount: 'always' as const,
  refetchOnWindowFocus: 'always' as const,
  refetchInterval: 30_000,
};
