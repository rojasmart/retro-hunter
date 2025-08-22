/**
 * Utilitários para processamento OCR
 */

/**
 * Melhorar qualidade da imagem antes do OCR
 */
export function preprocessImage(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Converter para escala de cinza e aumentar contraste
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
    const contrast = gray > 128 ? 255 : 0; // Binarização
    
    data[i] = contrast;     // Red
    data[i + 1] = contrast; // Green
    data[i + 2] = contrast; // Blue
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Extrair possíveis nomes de jogos do texto
 */
export function extractGameNames(text: string): string[] {
  const lines = text.split("\n").map(line => line.trim());
  const gameNames = lines
    .filter(line => line.length > 3 && line.length < 100)
    .filter(line => !/^\d+$/.test(line)) // Remove linhas só com números
    .filter(line => !line.toLowerCase().includes("price")) // Remove linhas com "price"
    .filter(line => !line.toLowerCase().includes("€")) // Remove linhas com preços
    .filter(line => !line.toLowerCase().includes("$")) // Remove linhas com preços
    .filter(line => !line.toLowerCase().includes("£")) // Remove linhas com preços
    .slice(0, 5); // Máximo 5 possíveis nomes

  return gameNames;
}

/**
 * Limpar e normalizar texto extraído do OCR
 */
export function cleanOCRText(text: string): string {
  return text
    // Remove caracteres especiais mas mantém alguns importantes
    .replace(/[^\w\s\-:()&']/g, " ")
    // Corrige espaços múltiplos
    .replace(/\s+/g, " ")
    // Remove quebras de linha desnecessárias
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 2)
    .join(" ")
    // Normaliza case
    .toLowerCase()
    // Remove palavras comuns que não são nomes de jogos
    .replace(/\b(game|games|video|console|playstation|xbox|nintendo|pc|version|edition|new|used)\b/g, "")
    // Remove espaços extras novamente
    .replace(/\s+/g, " ")
    .trim()
    // Limita tamanho
    .substring(0, 150);
}

/**
 * Detectar se o texto contém nome de jogo válido
 */
export function isValidGameName(text: string): boolean {
  if (!text || text.length < 3 || text.length > 100) return false;
  
  // Remove se for só números
  if (/^\d+$/.test(text)) return false;
  
  // Remove se contiver muitos símbolos
  if ((text.match(/[^a-zA-Z0-9\s]/g) || []).length > text.length * 0.3) return false;
  
  // Deve ter pelo menos uma letra
  if (!/[a-zA-Z]/.test(text)) return false;
  
  return true;
}

/**
 * Sugerir múltiplas variações do nome do jogo
 */
export function generateGameNameVariations(text: string): string[] {
  const variations = new Set<string>();
  
  // Texto original limpo
  const cleaned = cleanOCRText(text);
  if (isValidGameName(cleaned)) {
    variations.add(cleaned);
  }
  
  // Tentar extrair nomes de linhas individuais
  const gameNames = extractGameNames(text);
  gameNames.forEach(name => {
    const cleanName = cleanOCRText(name);
    if (isValidGameName(cleanName)) {
      variations.add(cleanName);
    }
  });
  
  // Tentar remover palavras comuns do final/início
  const words = cleaned.split(" ");
  if (words.length > 1) {
    // Remover primeira palavra se for comum
    const withoutFirst = words.slice(1).join(" ");
    if (isValidGameName(withoutFirst)) {
      variations.add(withoutFirst);
    }
    
    // Remover última palavra se for comum
    const withoutLast = words.slice(0, -1).join(" ");
    if (isValidGameName(withoutLast)) {
      variations.add(withoutLast);
    }
    
    // Pegar apenas as primeiras palavras significativas
    const firstTwo = words.slice(0, 2).join(" ");
    if (isValidGameName(firstTwo)) {
      variations.add(firstTwo);
    }
  }
  
  return Array.from(variations).slice(0, 3); // Máximo 3 variações
}
