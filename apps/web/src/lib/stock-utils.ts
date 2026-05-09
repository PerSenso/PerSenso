export const getStockColorClass = (stock: number): string => {
  if (stock <= 1) return "text-red-600 dark:text-red-400 font-semibold";
  if (stock <= 3) return "text-yellow-600 dark:text-yellow-400 font-medium";
  return "text-green-600 dark:text-green-400";
};

export const getStockLabel = (stock: number): string => {
  if (stock === 0) return "Agotado";
  if (stock === 1) return "¡Última unidad!";
  if (stock <= 3) return `¡Solo ${stock}!`;
  return `${stock} en stock`;
};
