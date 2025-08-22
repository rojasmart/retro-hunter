/**
 * Utilitários para processamento OCR
 */

/**
 * Melhorar qualidade da imagem antes do OCR - V3 com foco em logos artísticos
 */
export function preprocessImage(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Primeiro passo: converter para escala de cinza melhorada
  for (let i = 0; i < data.length; i += 4) {
    // Usar pesos otimizados para preservar contraste em texto colorido
    const gray = Math.round(data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722);
    data[i] = gray;     // Red
    data[i + 1] = gray; // Green
    data[i + 2] = gray; // Blue
  }

  // Segundo passo: aplicar filtro de sharpening mais agressivo para logos
  const sharpenedData = applySharpenFilter(data, canvas.width, canvas.height);
  
  // Terceiro passo: aplicar filtro de edge enhancement para lettering artístico
  const edgeEnhanced = applyEdgeEnhancement(sharpenedData, canvas.width, canvas.height);
  
  // Quarto passo: ajustar contraste e brilho de forma adaptativa
  const adaptiveData = applyAdaptiveContrast(edgeEnhanced, canvas.width, canvas.height);
  
  // Aplicar os dados processados de volta
  const newImageData = new ImageData(adaptiveData, canvas.width, canvas.height);
  ctx.putImageData(newImageData, 0, 0);
  
  return canvas;
}

/**
 * Aplicar filtro de edge enhancement para lettering artístico
 */
function applyEdgeEnhancement(data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
  const result = new Uint8ClampedArray(data);
  
  // Kernel para destacar bordas (Laplacian)
  const edgeKernel = [
    -1, -1, -1,
    -1,  8, -1,
    -1, -1, -1
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;
      
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixelIndex = ((y + ky) * width + (x + kx)) * 4;
          const kernelIndex = (ky + 1) * 3 + (kx + 1);
          sum += data[pixelIndex] * edgeKernel[kernelIndex];
        }
      }
      
      const currentIndex = (y * width + x) * 4;
      // Combinar edge enhancement com pixel original
      const enhanced = Math.max(0, Math.min(255, data[currentIndex] + sum * 0.3));
      result[currentIndex] = enhanced;
      result[currentIndex + 1] = enhanced;
      result[currentIndex + 2] = enhanced;
    }
  }
  
  return result;
}

/**
 * Aplicar contraste adaptativo baseado na região da imagem
 */
function applyAdaptiveContrast(data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
  const result = new Uint8ClampedArray(data);
  const windowSize = 15; // Janela para análise local
  
  for (let y = windowSize; y < height - windowSize; y++) {
    for (let x = windowSize; x < width - windowSize; x++) {
      // Calcular estatísticas locais
      let sum = 0;
      let count = 0;
      let min = 255;
      let max = 0;
      
      // Analisar janela local
      for (let dy = -windowSize; dy <= windowSize; dy++) {
        for (let dx = -windowSize; dx <= windowSize; dx++) {
          const pixelIndex = ((y + dy) * width + (x + dx)) * 4;
          const value = data[pixelIndex];
          sum += value;
          count++;
          min = Math.min(min, value);
          max = Math.max(max, value);
        }
      }
      
      const mean = sum / count;
      const localRange = max - min;
      
      // Aplicar contraste adaptativo se há variação significativa
      if (localRange > 30) {
        const currentIndex = (y * width + x) * 4;
        const currentValue = data[currentIndex];
        
        // Aumentar contraste baseado na variação local
        const contrastFactor = 1.0 + (localRange / 255.0);
        const enhanced = Math.max(0, Math.min(255, 
          (currentValue - mean) * contrastFactor + mean + 10
        ));
        
        result[currentIndex] = enhanced;
        result[currentIndex + 1] = enhanced;
        result[currentIndex + 2] = enhanced;
      }
    }
  }
  
  return result;
}

/**
 * Aplicar filtro de sharpening melhorado para logos e lettering artístico
 */
function applySharpenFilter(data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
  const result = new Uint8ClampedArray(data);
  
  // Kernel de sharpening mais agressivo para texto artístico
  const sharpKernel = [
    -1, -2, -1,
    -2, 13, -2,
    -1, -2, -1
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;
      
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixelIndex = ((y + ky) * width + (x + kx)) * 4;
          const kernelIndex = (ky + 1) * 3 + (kx + 1);
          sum += data[pixelIndex] * sharpKernel[kernelIndex];
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
 * Limpar e normalizar texto extraído do OCR - V3 para logos artísticos
 */
export function cleanOCRText(text: string): string {
  console.log("🧹 Iniciando limpeza avançada do texto OCR:", text);
  
  // Primeiro passo: normalizar o texto bruto com correções mais agressivas
  let cleaned = text
    // Correções específicas para lettering artístico
    .replace(/[|\\\/\[\]]/g, "I") // Barras e colchetes viram I
    .replace(/(?<!\d)[0O](?!\d)/g, "O") // Zero isolado vira O
    .replace(/[5S$]/g, "S") // 5 e $ viram S
    .replace(/[8B]/g, "B") // 8 vira B
    .replace(/(?<!\d)[1Il|](?!\d)/g, "I") // 1, l, I, | isolados viram I
    .replace(/[3E]/g, "E") // 3 vira E
    .replace(/[6G]/g, "G") // 6 vira G
    .replace(/[2Z]/g, "Z") // 2 vira Z em alguns casos
    .replace(/[4A]/g, "A") // 4 pode virar A em logos
    .replace(/[9P]/g, "P") // 9 pode virar P
    .replace(/[7T]/g, "T") // 7 pode virar T
    // Correções específicas para caracteres de logo
    .replace(/[@]/g, "A") // @ vira A
    .replace(/[&]/g, "AND") // & vira AND
    .replace(/[%]/g, "X") // % pode virar X
    .replace(/[#]/g, "H") // # pode virar H
    .replace(/[*]/g, "X") // * vira X
    .replace(/[+]/g, "T") // + vira T
    // Limpar caracteres especiais mas manter alguns importantes
    .replace(/[^\w\s\-:()&'.]/g, " ")
    // Normalizar espaços múltiplos
    .replace(/\s+/g, " ")
    .trim();

  console.log("🔧 Após correção de caracteres artísticos:", cleaned);

  // Separar em linhas e processar cada uma
  const lines = cleaned.split(/[\n\r]+/)
    .map(line => line.trim())
    .filter(line => line.length >= 2 && line.length <= 60); // Mais flexível
  
  console.log("📝 Linhas após filtro de tamanho:", lines);
  
  // Aplicar filtros mais inteligentes para logos artísticos
  const validLines = lines.filter(isLikelyGameTitleArtistic);
  console.log("🎮 Linhas que parecem títulos artísticos:", validLines);

  if (validLines.length === 0) {
    console.log("❌ Nenhuma linha válida encontrada, tentando recuperação...");
    // Tentar recuperar com critérios mais flexíveis
    const recoveredLines = lines.filter(isRecoverableGameTitle);
    if (recoveredLines.length > 0) {
      console.log("🔄 Linhas recuperadas:", recoveredLines);
      const bestLine = findBestGameTitle(recoveredLines);
      return capitalizeGameTitle(bestLine);
    }
    return "";
  }

  // Pegar a melhor linha (mais provável de ser um título)
  const bestLine = findBestGameTitle(validLines);
  
  // Capitalizar apropriadamente
  const result = capitalizeGameTitle(bestLine);
  console.log("✅ Resultado final da limpeza:", result);
  
  return result;
}

/**
 * Verificar se uma linha parece ser um título de jogo (versão para logos artísticos)
 */
function isLikelyGameTitleArtistic(line: string): boolean {
  const lower = line.toLowerCase();
  const words = line.split(' ').filter(word => word.length >= 1); // Mais flexível
  
  // Verificar se é claramente informação do sistema
  if (isSystemInfo(line)) {
    console.log(`❌ Linha rejeitada por ser info do sistema: "${line}"`);
    return false;
  }

  // Deve ter pelo menos uma letra
  if (!/[a-zA-Z]/.test(line)) {
    console.log(`❌ Linha rejeitada por não ter letras: "${line}"`);
    return false;
  }
  
  // Mais tolerante com símbolos (logos artísticos podem ter mais símbolos)
  const symbolCount = (line.match(/[^a-zA-Z0-9\s\-:()]/g) || []).length;
  if (symbolCount > line.length * 0.6) { // Aumentado de 0.4 para 0.6
    console.log(`❌ Linha rejeitada por muitos símbolos: "${line}"`);
    return false;
  }

  // Filtros específicos para lixo comum
  const junkPatterns = [
    /^\d+$/, // Só números
    /^[a-z]$/, // Só uma letra minúscula
    /\b(price|cost|€|£|\$|new|used|condition|seller|feedback|shipping|ebay|amazon)\b/i,
    /^(version|edition|video|console|cartridge|disc|cd|rom)$/i,
    /^(the|a|an|and|or|in|on|at|to|for|of|with|by)$/i,
  ];

  if (junkPatterns.some(pattern => pattern.test(line))) {
    console.log(`❌ Linha rejeitada por padrão de lixo: "${line}"`);
    return false;
  }

  // Padrões que indicam FORTEMENTE prováveis títulos de jogos (expandidos)
  const strongGamePatterns = [
    /\b(super|final|street|sonic|mario|zelda|pokemon|dragon|fantasy|legend|monaco|grand|gp|racing|combat)\b/i,
    /\b\w+\s+(ii|iii|iv|v|vi|vii|viii|ix|x|2|3|4|5|6|7|8|9|10)\b/i,
    /\b[a-z]+\s+[a-z]+\s*(gp|racing|combat|adventure|quest|saga|fighter|fantasy|simulator|racing)\b/i,
    // Padrões específicos para logos artísticos
    /\b(the|super|mega|ultra|hyper)\s+\w+/i,
    /\w+\s+(force|power|warriors|fighters|legends|heroes|world|land|saga|story)\b/i,
  ];

  // Se corresponde a padrões fortes, aceitar imediatamente
  const hasStrongPattern = strongGamePatterns.some(pattern => pattern.test(line));
  if (hasStrongPattern) {
    console.log(`✅ Linha aceita por padrão forte de jogo artístico: "${line}"`);
    return true;
  }

  // Critérios mais flexíveis para logos artísticos
  const isArtisticTitle = (
    (words.length >= 1 && line.length >= 4 && line.length <= 50) || // Mais flexível
    (words.length === 1 && line.length >= 5) // Títulos de uma palavra longa
  );
  
  if (isArtisticTitle) {
    console.log(`✅ Linha aceita por critérios artísticos: "${line}"`);
  } else {
    console.log(`❌ Linha rejeitada por critérios artísticos: "${line}" (palavras: ${words.length}, tamanho: ${line.length})`);
  }

  return isArtisticTitle;
}

/**
 * Função de recuperação para títulos difíceis de reconhecer
 */
function isRecoverableGameTitle(line: string): boolean {
  // Critérios muito flexíveis para recuperação
  const hasLetters = /[a-zA-Z]/.test(line);
  const notTooShort = line.length >= 3;
  const notTooLong = line.length <= 40;
  const notSystemInfo = !isSystemInfo(line);
  const notJustNumbers = !/^\d+$/.test(line);
  
  const recoverable = hasLetters && notTooShort && notTooLong && notSystemInfo && notJustNumbers;
  
  if (recoverable) {
    console.log(`🔄 Linha recuperável: "${line}"`);
  }
  
  return recoverable;
}

/**
 * Verificar se uma linha parece ser um título de jogo
 */
function isLikelyGameTitle(line: string): boolean {
  const lower = line.toLowerCase();
  const words = line.split(' ').filter(word => word.length >= 2);
  
  // Verificar se é claramente informação do sistema (usar função melhorada)
  if (isSystemInfo(line)) {
    console.log(`❌ Linha rejeitada por ser info do sistema: "${line}"`);
    return false;
  }

  // Deve ter pelo menos uma letra
  if (!/[a-zA-Z]/.test(line)) {
    console.log(`❌ Linha rejeitada por não ter letras: "${line}"`);
    return false;
  }
  
  // Não deve ter muitos símbolos (mais flexível)
  const symbolCount = (line.match(/[^a-zA-Z0-9\s\-:()]/g) || []).length;
  if (symbolCount > line.length * 0.4) {
    console.log(`❌ Linha rejeitada por muitos símbolos: "${line}"`);
    return false;
  }

  // Deve ter pelo menos uma palavra de 2+ caracteres
  if (words.length === 0) {
    console.log(`❌ Linha rejeitada por não ter palavras válidas: "${line}"`);
    return false;
  }

  // Filtros específicos para lixo comum
  const junkPatterns = [
    /^\d+$/, // Só números
    /^[a-z]$/, // Só uma letra minúscula
    /\b(price|cost|€|£|\$|new|used|condition|seller|feedback|shipping|ebay|amazon)\b/i,
    /^(version|edition|video|console|cartridge|disc|cd|rom)$/i,
    /^(the|a|an|and|or|in|on|at|to|for|of|with|by)$/i, // Palavras muito comuns sozinhas
  ];

  if (junkPatterns.some(pattern => pattern.test(line))) {
    console.log(`❌ Linha rejeitada por padrão de lixo: "${line}"`);
    return false;
  }

  // Padrões que indicam FORTEMENTE prováveis títulos de jogos
  const strongGamePatterns = [
    /\b(super|final|street|sonic|mario|zelda|pokemon|dragon|fantasy|legend|monaco|grand|gp)\b/i,
    /\b\w+\s+(ii|iii|iv|v|vi|vii|viii|ix|x|2|3|4|5|6|7|8|9|10)\b/i, // Jogos com números/romanos
    /\b[a-z]+\s+[a-z]+\s*(gp|racing|combat|adventure|quest|saga|fighter|fantasy)\b/i, // Padrões comuns
  ];

  // Se corresponde a padrões fortes, aceitar imediatamente
  const hasStrongPattern = strongGamePatterns.some(pattern => pattern.test(line));
  if (hasStrongPattern) {
    console.log(`✅ Linha aceita por padrão forte de jogo: "${line}"`);
    return true;
  }

  // Critérios básicos: pelo menos 2 palavras válidas e tamanho razoável
  const isBasicTitle = words.length >= 2 && line.length >= 6 && line.length <= 50;
  
  if (isBasicTitle) {
    console.log(`✅ Linha aceita por critérios básicos: "${line}"`);
  } else {
    console.log(`❌ Linha rejeitada por não atender critérios básicos: "${line}" (palavras: ${words.length}, tamanho: ${line.length})`);
  }

  return isBasicTitle;
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
    const words = line.split(' ').filter(w => w.length > 0);
    const lower = line.toLowerCase();
    
    // Bonus substancial para títulos de jogos famosos e padrões reconhecidos
    const famousGamePatterns = [
      /\b(super\s+monaco(?:\s+gp)?(?:\s+ii)?)\b/i,
      /\b(sonic(?:\s+the)?\s*hedgehog)\b/i,
      /\b(street\s+fighter(?:\s+ii)?)\b/i,
      /\b(final\s+fantasy(?:\s+[ivx]+)?)\b/i,
      /\b(grand\s+(?:prix|turismo))\b/i,
    ];
    
    const famousGameBonus = famousGamePatterns.filter(pattern => pattern.test(line)).length * 15;
    score += famousGameBonus;
    if (famousGameBonus > 0) {
      console.log(`🌟 Bonus por jogo famoso: +${famousGameBonus} para "${line}"`);
    }
    
    // Pontos por ter palavras de tamanho ideal para títulos
    score += words.filter(word => word.length >= 3 && word.length <= 12).length * 3;
    
    // Pontos por ter letras maiúsculas (títulos costumam ter)
    const upperCaseCount = (line.match(/[A-Z]/g) || []).length;
    score += upperCaseCount * 0.5;
    
    // Bonus forte por números romanos ou arábicos (muitos jogos têm sequels)
    const numberBonus = (line.match(/\b(ii|iii|iv|v|vi|vii|2|3|4|5|6|7|8|9|10)\b/gi) || []).length * 8;
    score += numberBonus;
    if (numberBonus > 0) {
      console.log(`🔢 Bonus por números: +${numberBonus} para "${line}"`);
    }
    
    // Pontos por ter tamanho ideal para título
    if (line.length >= 8 && line.length <= 35) score += 5;
    if (line.length >= 12 && line.length <= 25) score += 3; // Tamanho ainda melhor
    
    // Bonus forte por palavras típicas de títulos de jogos
    const gameWords = [
      'super', 'final', 'street', 'sonic', 'mario', 'zelda', 'pokemon', 
      'dragon', 'fantasy', 'legend', 'monaco', 'grand', 'racing', 'gp',
      'combat', 'quest', 'adventure', 'saga', 'world', 'land', 'fighter',
      'turismo', 'prix', 'hedgehog'
    ];
    const gameWordCount = gameWords.filter(word => lower.includes(word)).length;
    const gameWordBonus = gameWordCount * 6;
    score += gameWordBonus;
    if (gameWordBonus > 0) {
      console.log(`🎮 Bonus por palavras de jogos: +${gameWordBonus} para "${line}" (${gameWordCount} palavras)`);
    }
    
    // Penalizar MUITO fortemente se for informação do sistema
    if (isSystemInfo(line)) {
      const systemPenalty = 25;
      score -= systemPenalty;
      console.log(`❌ Penalidade por sistema: -${systemPenalty} para "${line}"`);
    }
    
    // Penalizar se tem muitos espaços (texto fragmentado)
    if (words.length > 7) score -= 5;
    
    // Bonus para linhas que parecem títulos completos
    if (words.length >= 2 && words.length <= 5) score += 4;
    
    // Bonus extra para padrões específicos de sequels
    const sequelPatterns = [
      /\b\w+\s+\w+\s+(ii|iii|iv|v|2|3|4|5)\b/i,
      /\b(super|grand|final)\s+\w+(?:\s+\w+)?\b/i,
      /\b\w+\s+(gp|racing|fighter|fantasy|quest)\b/i
    ];
    const sequelBonus = sequelPatterns.filter(pattern => pattern.test(line)).length * 8;
    score += sequelBonus;
    if (sequelBonus > 0) {
      console.log(`🔄 Bonus por padrão de sequel: +${sequelBonus} para "${line}"`);
    }
    
    // Penalizar linhas com caracteres estranhos
    const weirdCharCount = (line.match(/[^\w\s\-:'()&.]/g) || []).length;
    if (weirdCharCount > 2) score -= weirdCharCount * 2;
    
    console.log(`🔍 Linha: "${line}" - Score final: ${score}`);
    
    if (score > bestScore) {
      bestScore = score;
      bestLine = line;
    }
  }

  console.log(`🏆 Melhor linha selecionada: "${bestLine}" (Score: ${bestScore})`);
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
  console.log("🔍 Extraindo palavras maiúsculas de:", text);
  
  // Primeiro, tentar padrões específicos de jogos famosos em ALL CAPS
  const specificPatterns = [
    /\b(SUPER)\s+(MONACO)\s+(GP)(?:\s+(II|2))?\b/g,
    /\b(SONIC)\s+(THE)?\s*(HEDGEHOG)(?:\s+([0-9]+|II|III))?\b/g,
    /\b(STREET)\s+(FIGHTER)(?:\s+(II|III|IV|[0-9]+))?\b/g,
    /\b(FINAL)\s+(FANTASY)(?:\s+([IVX]+|[0-9]+))?\b/g,
  ];

  for (const pattern of specificPatterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      const match = matches[0][0].trim();
      console.log("🎯 Padrão específico em maiúsculas encontrado:", match);
      return capitalizeGameTitle(match);
    }
  }
  
  // Buscar sequências de palavras em maiúsculas mais gerais
  const upperSequences = text.match(/\b[A-Z]{2,}(?:\s+[A-Z]{2,})*(?:\s+(?:[A-Z]{1,3}|II|III|IV|GP|[0-9]+))?\b/g);
  
  if (!upperSequences || upperSequences.length === 0) {
    console.log("❌ Nenhuma sequência em maiúsculas encontrada");
    return "";
  }
  
  console.log("🔍 Sequências em maiúsculas encontradas:", upperSequences);
  
  // Filtrar e pontuar cada sequência
  const scored = upperSequences.map(seq => {
    let score = 0;
    const lower = seq.toLowerCase();
    const words = seq.split(' ').filter(w => w.length > 1);
    
    // Penalizar fortemente informações de sistema
    if (isSystemInfo(seq)) {
      score -= 20;
      console.log(`❌ Sequência de sistema penalizada: "${seq}"`);
    }
    
    // Bonus por tamanho ideal para títulos de jogos
    if (seq.length >= 8 && seq.length <= 25) score += 5;
    if (seq.length >= 12 && seq.length <= 20) score += 3; // Tamanho ainda melhor
    
    // Bonus substancial por palavras típicas de jogos
    const gameWords = ['super', 'monaco', 'grand', 'final', 'street', 'sonic', 'mario', 'zelda'];
    const gameWordCount = gameWords.filter(word => lower.includes(word)).length;
    score += gameWordCount * 8;
    
    // Bonus por números romanos ou números
    if (/\b(ii|iii|iv|gp|2|3|4|5)\b/i.test(seq)) score += 6;
    
    // Bonus por ter múltiplas palavras (títulos normalmente têm 2-4 palavras)
    if (words.length >= 2 && words.length <= 4) score += 4;
    
    // Bonus por padrões típicos de jogos de corrida/esporte
    if (/\b(GP|RACING|COMBAT|QUEST|FIGHTER)\b/i.test(seq)) score += 5;
    
    // Penalizar sequências muito longas (provavelmente não são títulos)
    if (words.length > 5) score -= 3;
    
    // Penalizar palavras muito curtas
    const shortWordCount = words.filter(w => w.length <= 2).length;
    score -= shortWordCount * 2;
    
    console.log(`📊 "${seq}" - Score: ${score} (palavras de jogo: ${gameWordCount}, palavras: ${words.length})`);
    return { text: seq, score };
  });
  
  // Pegar a melhor sequência
  const best = scored.reduce((a, b) => a.score > b.score ? a : b);
  
  if (best.score <= 0) {
    console.log("❌ Nenhuma sequência com score positivo");
    return "";
  }
  
  const result = capitalizeGameTitle(best.text);
  console.log(`✅ Melhor sequência maiúscula: "${result}" (Score: ${best.score})`);
  return result;
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
 * Extração agressiva V3 - Especializada em logos artísticos e lettering fragmentado
 */
function aggressiveGameExtraction(text: string): string[] {
  const results: string[] = [];
  
  console.log("🔄 Executando extração agressiva V3 no texto:", text);
  
  // Primeiro: Padrões específicos para jogos famosos (expandidos)
  const specificGamePatterns = [
    // Jogos clássicos com variações
    /\b(SUPER|Super|5UPER|5uper)\s+(MONACO|Monaco|M0NACO|MON4CO)\s+(GP|Gp|gp|6P)(?:\s+(II|2|ll|ii))?\b/gi,
    /\b(SONIC|Sonic|50NIC|S0NIC)\s+(THE|the|The|7HE)?\s*(HEDGEHOG|Hedgehog|HED6EH06|HEDGE HOG)(?:\s+([0-9]+|II|III))?\b/gi,
    /\b(STREET|Street|57REET|S7REET)\s+(FIGHTER|Fighter|FI6HTER|FI6H7ER)(?:\s+(II|III|IV|[0-9]+))?\b/gi,
    /\b(FINAL|Final|FIN4L|FINA1)\s+(FANTASY|Fantasy|FAN74SY|FANTAS)(?:\s+([IVX]+|[0-9]+))?\b/gi,
    /\b(GRAND|Grand|6RAND|GR4ND)\s+(PRIX|Prix|TURISMO|Turismo|7URISMO)(?:\s+([0-9]+))?\b/gi,
    /\b(MARIO|Mario|M4RIO|MAR1O)\s+(BROS|Bros|BR05|BRO5)(?:\s+([0-9]+))?\b/gi,
    /\b(ZELDA|Zelda|ZE1DA|ZEL0A)\s*(LINK|Link)?\s*(ADVENTURE|Adventure)?\b/gi,
    /\b(POKEMON|Pokemon|P0KEMON|P0KEM0N)(?:\s+(RED|BLUE|YELLOW|GOLD|SILVER))?\b/gi,
    /\b(DRAGON|Dragon|DRA60N|0RA6ON)\s+(QUEST|Quest|0UEST|OUES7)(?:\s+([IVX]+|[0-9]+))?\b/gi,
    // Padrões de corrida e esporte
    /\b(FORMULA|Formula|F0RMULA|F0RMU1A)\s+(ONE|1|0NE)\b/gi,
    /\b(NASCAR|Nascar|NA5CAR|N45CAR)\s+(RACING|Racing)?\b/gi,
    /\b(FIFA|Fifa|FIF4)\s*([0-9]+)?\b/gi,
    /\b(NBA|Nba|N84)\s*(LIVE|Live|1IVE)?\s*([0-9]+)?\b/gi,
  ];

  specificGamePatterns.forEach((pattern, index) => {
    const matches = [...text.matchAll(pattern)];
    matches.forEach(match => {
      const fullMatch = match[0].trim();
      if (fullMatch.length >= 4) {
        console.log(`🎯 Padrão específico ${index + 1} encontrado: "${fullMatch}"`);
        const cleaned = cleanArtisticText(fullMatch);
        if (cleaned) results.push(cleaned);
      }
    });
  });

  // Se encontrou padrões específicos, priorizar mas continuar buscando
  if (results.length > 0) {
    console.log("✅ Padrões específicos encontrados:", results);
  }
  
  // Segundo: Análise linha por linha mais agressiva
  const lines = text.split(/[\n\r]+/).map(line => line.trim()).filter(line => line.length > 1);
  
  for (const line of lines) {
    console.log(`🔍 Analisando linha artística: "${line}"`);
    
    // Padrão para sequências ALL CAPS fragmentadas
    const fragmentedCaps = line.match(/\b[A-Z0-9]{2,}(?:\s+[A-Z0-9]{1,})*(?:\s+(?:II|III|IV|GP|[0-9]+))?\b/g);
    if (fragmentedCaps) {
      fragmentedCaps.forEach(seq => {
        if (!isSystemInfo(seq) && seq.length >= 4 && seq.length <= 35) {
          console.log(`🔠 Sequência ALL CAPS fragmentada: "${seq}"`);
          const cleaned = cleanArtisticText(seq);
          if (cleaned) results.push(cleaned);
        }
      });
    }
    
    // Padrão para texto misto (maiúscula + minúscula)
    const mixedCase = line.match(/\b[A-Z][a-z0-9]*(?:\s+[A-Za-z0-9]+)*\b/g);
    if (mixedCase) {
      mixedCase.forEach(seq => {
        if (!isSystemInfo(seq) && seq.length >= 5 && seq.length <= 35) {
          console.log(`🔤 Sequência mista encontrada: "${seq}"`);
          const cleaned = cleanArtisticText(seq);
          if (cleaned) results.push(cleaned);
        }
      });
    }
    
    // Reconstrução inteligente a partir de fragmentos
    const intelligentReconstruction = reconstructFromFragments(line);
    intelligentReconstruction.forEach(recon => {
      if (recon && !isSystemInfo(recon)) {
        console.log(`🔧 Reconstrução inteligente: "${recon}"`);
        results.push(recon);
      }
    });
  }
  
  // Terceiro: Busca por padrões mais genéricos se ainda precisar
  if (results.length < 3) {
    console.log("🔄 Aplicando padrões genéricos...");
    
    const genericPatterns = [
      // Qualquer sequência que pareça um título
      /\b([A-Z][a-z0-9]*)\s+([A-Z][a-z0-9]*)(?:\s+([A-Z0-9]{1,3}|GP|II|III|IV))?\b/g,
      /\b(THE|The|7HE)\s+([A-Z][a-z0-9]+)(?:\s+([A-Z][a-z0-9]+))?/gi,
      /\b([A-Z0-9]{3,})\s+([A-Z0-9]{2,})(?:\s+([A-Z0-9]{1,3}))?\b/g,
    ];
    
    genericPatterns.forEach((pattern, index) => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        const fullMatch = match[0].trim();
        if (fullMatch.length >= 5 && !isSystemInfo(fullMatch)) {
          console.log(`✅ Padrão genérico ${index + 1}: "${fullMatch}"`);
          const cleaned = cleanArtisticText(fullMatch);
          if (cleaned) results.push(cleaned);
        }
      });
    });
  }
  
  // Remover duplicatas, ordenar por qualidade e limitar
  const uniqueResults = [...new Set(results)]
    .map(result => ({ text: result, score: scoreGameTitle(result) }))
    .sort((a, b) => b.score - a.score)
    .map(item => item.text)
    .slice(0, 5);
    
  console.log("🎯 Resultados da extração agressiva V3:", uniqueResults);
  
  return uniqueResults;
}

/**
 * Limpar texto artístico com correções específicas
 */
function cleanArtisticText(text: string): string {
  if (!text || text.length < 3) return "";
  
  const cleaned = text
    // Correções específicas para OCR de logos
    .replace(/[0O]/g, "O")
    .replace(/[1Il|]/g, "I")
    .replace(/[5S]/g, "S")
    .replace(/[6G]/g, "G")
    .replace(/[8B]/g, "B")
    .replace(/[4A]/g, "A")
    .replace(/[7T]/g, "T")
    .replace(/[9P]/g, "P")
    .replace(/[2Z]/g, "Z")
    .replace(/[3E]/g, "E")
    // Normalizar espaços
    .replace(/\s+/g, " ")
    .trim();
    
  return capitalizeGameTitle(cleaned);
}

/**
 * Reconstruir título a partir de fragmentos
 */
function reconstructFromFragments(line: string): string[] {
  const results: string[] = [];
  
  // Extrair todas as sequências alfanuméricas
  const fragments = line.match(/[A-Za-z0-9]+/g) || [];
  
  if (fragments.length < 2) return results;
  
  // Tentar combinações de 2-4 fragmentos consecutivos
  for (let i = 0; i < fragments.length - 1; i++) {
    for (let len = 2; len <= Math.min(4, fragments.length - i); len++) {
      const combination = fragments.slice(i, i + len).join(" ");
      
      if (combination.length >= 6 && combination.length <= 30) {
        // Verificar se parece um título de jogo
        if (looksLikeGameTitle(combination)) {
          const cleaned = cleanArtisticText(combination);
          if (cleaned) results.push(cleaned);
        }
      }
    }
  }
  
  return results;
}

/**
 * Verificar se uma string parece um título de jogo
 */
function looksLikeGameTitle(text: string): boolean {
  const lower = text.toLowerCase();
  
  // Palavras que aumentam a probabilidade de ser um título
  const gameWords = [
    "super", "final", "street", "sonic", "mario", "zelda", "pokemon",
    "dragon", "fantasy", "legend", "monaco", "grand", "racing", "gp",
    "combat", "quest", "adventure", "saga", "world", "land", "fighter",
    "force", "power", "warriors", "fighters", "legends", "heroes"
  ];
  
  const hasGameWord = gameWords.some(word => lower.includes(word));
  const hasNumber = /\b(ii|iii|iv|v|2|3|4|5|6|7|8|9)\b/i.test(text);
  const reasonableLength = text.length >= 6 && text.length <= 30;
  
  return (hasGameWord || hasNumber) && reasonableLength;
}

/**
 * Pontuar qualidade de um título de jogo
 */
function scoreGameTitle(title: string): number {
  let score = 0;
  const lower = title.toLowerCase();
  
  // Pontos por palavras de jogos
  const gameWords = ["super", "final", "street", "sonic", "mario", "monaco", "grand"];
  score += gameWords.filter(word => lower.includes(word)).length * 10;
  
  // Pontos por números/romanos
  if (/\b(ii|iii|iv|gp|2|3|4|5)\b/i.test(title)) score += 5;
  
  // Pontos por tamanho ideal
  if (title.length >= 8 && title.length <= 25) score += 3;
  
  // Penalizar se for info do sistema
  if (isSystemInfo(title)) score -= 15;
  
  return score;
}

/**
 * Verificar se é uma palavra comum do sistema que deve ser filtrada
 */
function isCommonSystemWord(word: string): boolean {
  const lower = word.toLowerCase();
  const commonSystemWords = [
    'sega', 'nintendo', 'sony', 'microsoft', 'master', 'system', 
    'mega', 'drive', 'genesis', 'cartridge', 'disc', 'cd', 'rom',
    'game', 'console', 'version', 'edition', 'video'
  ];
  return commonSystemWords.includes(lower);
}

/**
 * Verificar se o texto é informação do sistema (não um título de jogo)
 */
function isSystemInfo(text: string): boolean {
  const lower = text.toLowerCase().trim();
  
  // Frases completas que são claramente informações do sistema
  const systemPhrases = [
    'master system', 'mega drive', 'game gear', 'sega genesis',
    'nintendo entertainment system', 'super nintendo', 'game boy',
    'playstation', 'xbox', 'sega saturn', 'dreamcast'
  ];
  
  // Verificar frases completas primeiro (mais específico)
  if (systemPhrases.some(phrase => lower.includes(phrase))) {
    return true;
  }
  
  // Palavras individuais que são sistema APENAS quando aparecem sozinhas ou em contextos específicos
  const systemWords = ['sega', 'nintendo', 'sony', 'microsoft'];
  
  // Se é apenas uma palavra do sistema sozinha
  if (systemWords.includes(lower)) {
    return true;
  }
  
  // Se contém apenas palavras de sistema + termos técnicos
  const technicalTerms = ['console', 'cartridge', 'disc', 'cd', 'rom', 'system', 'version', 'edition'];
  const words = lower.split(' ').filter(w => w.length > 1);
  const onlySystemAndTechnical = words.length > 0 && words.every(word => 
    systemWords.includes(word) || technicalTerms.includes(word)
  );
  
  if (onlySystemAndTechnical) {
    return true;
  }
  
  // Padrões específicos que não são títulos de jogos
  const nonGamePatterns = [
    /^(sega|nintendo|sony)$/i,
    /\b(price|cost|€|£|\$|new|used|condition|seller|feedback|shipping|ebay|amazon)\b/i,
    /^\d+$/,
    /^[a-z]$/,
    /^(the|a|an|and|or|in|on|at|to|for|of|with|by)$/i
  ];
  
  return nonGamePatterns.some(pattern => pattern.test(text));
}
