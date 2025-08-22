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

  // Primeiro passo: converter para escala de cinza
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    data[i] = gray;     // Red
    data[i + 1] = gray; // Green
    data[i + 2] = gray; // Blue
  }

  // Segundo passo: aplicar filtro de sharpening
  const sharpenedData = applySharpenFilter(data, canvas.width, canvas.height);
  
  // Terceiro passo: ajustar contraste e brilho
  for (let i = 0; i < sharpenedData.length; i += 4) {
    // Aumentar contraste (fator 1.5) e brilho (+20)
    let value = Math.round((sharpenedData[i] - 128) * 1.5 + 128 + 20);
    value = Math.max(0, Math.min(255, value));
    
    sharpenedData[i] = value;     // Red
    sharpenedData[i + 1] = value; // Green
    sharpenedData[i + 2] = value; // Blue
  }

  // Aplicar os dados processados de volta
  const newImageData = new ImageData(sharpenedData, canvas.width, canvas.height);
  ctx.putImageData(newImageData, 0, 0);
  
  return canvas;
}

/**
 * Aplicar filtro de sharpening para melhorar bordas do texto
 */
function applySharpenFilter(data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
  const result = new Uint8ClampedArray(data);
  
  // Kernel de sharpening
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;
      
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixelIndex = ((y + ky) * width + (x + kx)) * 4;
          const kernelIndex = (ky + 1) * 3 + (kx + 1);
          sum += data[pixelIndex] * kernel[kernelIndex];
        }
      }
      
      const currentIndex = (y * width + x) * 4;
      const value = Math.max(0, Math.min(255, sum));
      result[currentIndex] = value;
      result[currentIndex + 1] = value;
      result[currentIndex + 2] = value;
    }
  }
  
  return result;
}

/**
 * Redimensionar imagem para melhor OCR
 */
export function resizeImageForOCR(canvas: HTMLCanvasElement, targetWidth = 1200): HTMLCanvasElement {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const originalWidth = canvas.width;
  const originalHeight = canvas.height;
  
  // Se a imagem já é grande o suficiente, não redimensionar
  if (originalWidth >= targetWidth) return canvas;
  
  const scale = targetWidth / originalWidth;
  const newHeight = Math.round(originalHeight * scale);
  
  // Criar novo canvas com tamanho maior
  const newCanvas = document.createElement("canvas");
  const newCtx = newCanvas.getContext("2d");
  if (!newCtx) return canvas;
  
  newCanvas.width = targetWidth;
  newCanvas.height = newHeight;
  
  // Usar interpolação suave
  newCtx.imageSmoothingEnabled = true;
  newCtx.imageSmoothingQuality = "high";
  newCtx.drawImage(canvas, 0, 0, targetWidth, newHeight);
  
  return newCanvas;
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
  // Primeiro passo: normalizar o texto bruto
  let cleaned = text
    // Corrigir caracteres comuns mal reconhecidos em títulos de jogos
    .replace(/[|\\\/]/g, "I") // Barras viram I
    .replace(/(?<!\d)[0](?!\d)/g, "O") // Zero isolado vira O 
    .replace(/[5]/g, "S") // 5 vira S
    .replace(/[8]/g, "B") // 8 vira B
    .replace(/(?<!\d)[1](?!\d)/g, "I") // 1 isolado vira I
    .replace(/[3]/g, "E") // 3 vira E às vezes
    .replace(/[6]/g, "G") // 6 pode virar G
    .replace(/[2]/g, "Z") // 2 pode virar Z em alguns casos
    // Limpar caracteres especiais mas manter alguns importantes
    .replace(/[^\w\s\-:()&'.]/g, " ")
    // Normalizar espaços
    .replace(/\s+/g, " ")
    .trim();

  // Separar em linhas e processar cada uma
  const lines = cleaned.split(/[\n\r]+/)
    .map(line => line.trim())
    .filter(line => line.length >= 3 && line.length <= 60)
    .filter(isLikelyGameTitle);

  if (lines.length === 0) return "";

  // Pegar a melhor linha (mais provável de ser um título)
  const bestLine = findBestGameTitle(lines);
  
  // Capitalizar apropriadamente
  return capitalizeGameTitle(bestLine);
}

/**
 * Verificar se uma linha parece ser um título de jogo
 */
function isLikelyGameTitle(line: string): boolean {
  const lower = line.toLowerCase();
  
  // Filtrar linhas que claramente não são títulos
  const badPatterns = [
    /\b(price|cost|€|£|\$|new|used|condition|seller|feedback|shipping|ebay|amazon)\b/i,
    /^\d+$/, // Só números
    /^[a-z]$/, // Só uma letra
    /\b(version|edition|game|games|video|console|system)\b/i,
    /^(the|a|an|and|or|in|on|at|to|for|of|with|by)$/i, // Palavras muito comuns sozinhas
  ];

  if (badPatterns.some(pattern => pattern.test(line))) {
    return false;
  }

  // Deve ter pelo menos uma letra
  if (!/[a-zA-Z]/.test(line)) return false;
  
  // Não deve ter muitos símbolos
  const symbolCount = (line.match(/[^a-zA-Z0-9\s]/g) || []).length;
  if (symbolCount > line.length * 0.3) return false;

  // Deve ter pelo menos uma palavra de 3+ caracteres
  const words = line.split(' ').filter(word => word.length >= 3);
  return words.length > 0;
}

/**
 * Encontrar a linha que mais parece ser um título de jogo
 */
function findBestGameTitle(lines: string[]): string {
  if (lines.length === 1) return lines[0];

  let bestLine = lines[0];
  let bestScore = 0;

  for (const line of lines) {
    let score = 0;
    const words = line.split(' ');
    
    // Pontos por ter palavras de tamanho médio (títulos costumam ter)
    score += words.filter(word => word.length >= 3 && word.length <= 12).length * 2;
    
    // Pontos por ter letras maiúsculas (títulos costumam ter)
    score += (line.match(/[A-Z]/g) || []).length;
    
    // Pontos por ter números (muitos jogos têm números)
    score += (line.match(/[0-9]/g) || []).length * 0.5;
    
    // Pontos por ter tamanho ideal para título
    if (line.length >= 6 && line.length <= 30) score += 3;
    
    // Pontos por palavras comuns em títulos de jogos
    const gameWords = ['super', 'final', 'street', 'sonic', 'mario', 'zelda', 'pokemon', 'dragon', 'fantasy', 'legend'];
    score += gameWords.filter(word => line.toLowerCase().includes(word)).length * 3;
    
    // Penalizar se tem muitos espaços (pode ser texto fragmentado)
    if (words.length > 6) score -= 2;
    
    if (score > bestScore) {
      bestScore = score;
      bestLine = line;
    }
  }

  return bestLine;
}

/**
 * Capitalizar título de jogo apropriadamente
 */
function capitalizeGameTitle(title: string): string {
  const words = title.toLowerCase().split(' ');
  
  // Palavras que devem ficar minúsculas (exceto se for a primeira)
  const smallWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 'in', 'of', 'on', 'or', 'the', 'to', 'up', 'vs'];
  
  return words.map((word, index) => {
    if (index === 0 || !smallWords.includes(word)) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word;
  }).join(' ');
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
  
  // Separar em linhas para análise individual
  const lines = text.split(/[\n\r]+/)
    .map(line => line.trim())
    .filter(line => line.length >= 3);
  
  console.log("🔍 Analisando linhas do OCR:", lines);
  
  // Processar cada linha individualmente
  for (const line of lines) {
    if (line.length > 60) continue; // Pular linhas muito longas
    
    // Tentar diferentes abordagens de limpeza para cada linha
    const approaches = [
      // Abordagem 1: Limpeza padrão
      cleanOCRText(line),
      
      // Abordagem 2: Focar em palavras maiúsculas
      extractUppercaseWords(line),
      
      // Abordagem 3: Focar em sequências alfanuméricas
      extractAlphanumericSequences(line),
      
      // Abordagem 4: Remover caracteres problemáticos
      cleanProblemCharacters(line)
    ];
    
    approaches.forEach(approach => {
      if (approach && isValidGameName(approach)) {
        variations.add(approach);
        console.log("✅ Variação encontrada:", approach);
      }
    });
  }
  
  // Se ainda não temos boas variações, tentar abordagem mais agressiva
  if (variations.size === 0) {
    const aggressiveClean = aggressiveGameExtraction(text);
    aggressiveClean.forEach(name => {
      if (isValidGameName(name)) {
        variations.add(name);
        console.log("🔄 Variação agressiva:", name);
      }
    });
  }
  
  // Converter para array e limitar
  const result = Array.from(variations).slice(0, 5);
  console.log("🎯 Variações finais:", result);
  
  return result;
}

/**
 * Extrair palavras em maiúsculas (prováveis títulos)
 */
function extractUppercaseWords(text: string): string {
  const upperWords = text.match(/[A-Z][A-Z0-9]{1,}/g);
  if (!upperWords || upperWords.length === 0) return "";
  
  // Filtrar palavras muito curtas ou muito comuns
  const filtered = upperWords.filter(word => 
    word.length >= 2 && 
    !['THE', 'AND', 'OR', 'FOR', 'NEW', 'GAME', 'VIDEO'].includes(word)
  );
  
  return capitalizeGameTitle(filtered.join(' '));
}

/**
 * Extrair sequências alfanuméricas limpas
 */
function extractAlphanumericSequences(text: string): string {
  const sequences = text.match(/[A-Za-z][A-Za-z0-9\s]{2,}[A-Za-z0-9]/g);
  if (!sequences || sequences.length === 0) return "";
  
  // Pegar a sequência mais longa que parece um título
  const longest = sequences.reduce((a, b) => a.length > b.length ? a : b);
  return cleanOCRText(longest);
}

/**
 * Remover caracteres problemáticos e reconstruir
 */
function cleanProblemCharacters(text: string): string {
  return text
    .replace(/[^\w\s]/g, ' ') // Remove todos os símbolos
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(word => word.length >= 2 && /[a-zA-Z]/.test(word))
    .slice(0, 4) // Máximo 4 palavras
    .join(' ')
    .substring(0, 30); // Máximo 30 caracteres
}

/**
 * Extração agressiva quando outras abordagens falham
 */
function aggressiveGameExtraction(text: string): string[] {
  const results: string[] = [];
  
  // Tentar encontrar padrões comuns de títulos de jogos
  const patterns = [
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\b/g, // Palavras capitalizadas
    /\b[A-Z]{2,}(?:\s+[A-Z]{2,}){0,2}\b/g, // Palavras em maiúsculas
    /\b\w{3,}\s+\w{3,}(?:\s+\w{2,}){0,2}\b/g, // Sequências de palavras médias
  ];
  
  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleaned = cleanOCRText(match);
        if (cleaned && cleaned.length >= 4) {
          results.push(cleaned);
        }
      });
    }
  });
  
  return results;
}
