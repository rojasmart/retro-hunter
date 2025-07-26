export function formatPrice(priceText: string): number {
  if (!priceText) return 0;

  // Remove todos os caracteres exceto números, vírgulas e pontos
  const cleanPrice = priceText
    .replace(/[^\d,\.]/g, "")
    .replace(/\./g, "") // Remove pontos de milhares
    .replace(",", "."); // Substitui vírgula decimal por ponto

  return parseFloat(cleanPrice) || 0;
}

export function formatCurrency(price: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

export function cleanText(text: string): string {
  return text.trim().replace(/\s+/g, " ").replace(/\n+/g, " ");
}

export function isValidPrice(price: number): boolean {
  return price > 0 && price < 1000000; // Preço válido entre 0 e 1 milhão
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
