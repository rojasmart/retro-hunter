import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, Platform } from "@/lib/types";
import { validateGameName } from "@/lib/utils/validators";

// Credenciais do .env.local
const EBAY_CLIENT_ID = process.env.EBAY_CLIENT_ID;
const EBAY_CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET;
const EBAY_SANDBOX = process.env.EBAY_SANDBOX === "true";
const EBAY_HOST = EBAY_SANDBOX 
  ? "https://api.sandbox.ebay.com" 
  : "https://api.ebay.com";

// Função para limpar o título e extrair o nome do jogo
function cleanGameTitle(title: string, searchTerm: string): string {
  // Remove common eBay suffixes and metadata
  let cleaned = title
    .replace(/\s*-\s*\d+\.?\d*%?\s*feedback$/i, '') // Remove feedback percentage
    .replace(/\s*\([^)]*\)$/g, '') // Remove parentheses at end like "(Very Good)"
    .replace(/\s*-\s*(New|Used|Very Good|Good|Acceptable|Like New|Brand New)$/i, '') // Remove condition at end
    .replace(/\s*CIB\s*\d*$/i, '') // Remove "CIB" (Complete in Box)
    .replace(/\s*PlayStation\s*\d*\s*PS\d*$/i, '') // Remove platform info at end
    .replace(/\s*Xbox\s*(360|One)?$/i, '') // Remove Xbox info
    .replace(/\s*Nintendo\s*(Switch|DS|3DS|Wii)?$/i, '') // Remove Nintendo info
    .replace(/\s*-\s*\d+$/g, '') // Remove trailing numbers like "- 4"
    .trim();

  // If the cleaned title is too short or doesn't contain the search term,
  // try to extract just the game name part
  if (cleaned.length < searchTerm.length || 
      !cleaned.toLowerCase().includes(searchTerm.toLowerCase().split(' ')[0])) {
    
    // Try to find the game name at the beginning
    const words = title.split(/[\s:-]+/);
    const searchWords = searchTerm.toLowerCase().split(' ');
    
    // Find where the main game title likely ends
    let titleEnd = 0;
    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase();
      
      // Stop at common eBay indicators
      if (['ps2', 'ps3', 'ps4', 'xbox', 'nintendo', 'playstation', 'cib', 'new', 'used', 'sealed'].includes(word)) {
        break;
      }
      
      // Include words that are part of the search term
      if (searchWords.some(sw => word.includes(sw) || sw.includes(word))) {
        titleEnd = i + 1;
      } else if (titleEnd > 0) {
        // Stop after we've found the main title
        break;
      }
    }
    
    if (titleEnd > 0) {
      cleaned = words.slice(0, titleEnd).join(' ');
    }
  }

  return cleaned || title; // Fallback to original if cleaning failed
}

async function getEbayToken(): Promise<string> {
  if (!EBAY_CLIENT_ID || !EBAY_CLIENT_SECRET) {
    throw new Error("eBay credentials not configured");
  }

  const credentials = Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString('base64');
  
  console.log("[DEBUG] Getting eBay token...");
  console.log("[DEBUG] Client ID:", EBAY_CLIENT_ID.substring(0, 15) + "...");
  console.log("[DEBUG] Using host:", EBAY_HOST);

  const response = await fetch(`${EBAY_HOST}/identity/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`
    },
    body: new URLSearchParams({
      'grant_type': 'client_credentials',
      'scope': 'https://api.ebay.com/oauth/api_scope'
    })
  });

  const responseText = await response.text();
  console.log("[DEBUG] Token response status:", response.status);
  
  if (!response.ok) {
    console.error("[ERROR] Token response:", responseText);
    throw new Error(`eBay OAuth failed: ${response.status} - ${responseText}`);
  }

  const data = JSON.parse(responseText);
  console.log("[DEBUG] Token obtained successfully");
  return data.access_token;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nome = searchParams.get("nome");
    const itemId = searchParams.get("itemId");
    const platform = (searchParams.get("platform") as Platform) || "all";
    const condition = searchParams.get("condition") || "all";

    console.log("[DEBUG] Request params:", { nome, platform, condition });

    // If requesting a specific item by ID
    if (itemId) {
      console.log(`Buscando item específico no eBay: ${itemId}`);
      // For now, return empty - can implement getEbayItemById later if needed
      return NextResponse.json({
        error: "Item search by ID not implemented yet",
        resultados: [],
        total: 0,
      }, { status: 501 });
    }

    // Validation for name search
    if (!nome) {
      return NextResponse.json({
        error: "Nome do jogo é obrigatório",
        resultados: [],
        total: 0,
      }, { status: 400 });
    }

    if (!validateGameName(nome)) {
      return NextResponse.json({
        error: "Nome do jogo deve ter pelo menos 2 caracteres",
        resultados: [],
        total: 0,
      }, { status: 400 });
    }

    if (!nome.trim()) {
      return NextResponse.json({ resultados: [] });
    }

    // Build more specific search query
    let query = nome.trim();
    
    // Make search more specific - add quotes for exact match and exclude sequels
    if (nome.toLowerCase().includes("devil may cry") && !nome.match(/\d/)) {
      query = `"Devil May Cry" -"Devil May Cry 2" -"Devil May Cry 3" -"Devil May Cry 4" -"Devil May Cry 5" -DMC2 -DMC3 -DMC4 -DMC5`;
    }
    
    // Add platform to query
    if (platform && platform !== "all") {
      const platformMap: Record<string, string> = {
        "retro": "dreamcast",
        "dreamcast": "dreamcast", 
        "ps2": "playstation 2",
        "ps3": "playstation 3",
        "ps4": "playstation 4",
        "xbox": "xbox",
        "xbox360": "xbox 360"
      };
      const platformName = platformMap[platform] || platform;
      query = `${query} ${platformName}`.trim();
    }

    console.log("[DEBUG] Search query:", query);

    // Get OAuth token
    const token = await getEbayToken();

    // Search eBay Browse API
    const searchParams2 = new URLSearchParams({
      'q': query,
      'limit': '30',
      'category_ids': '139973' // Video Games category
    });

    // Add condition filter if specified
    if (condition !== "all") {
      const conditionMap: Record<string, string> = {
        'new': '1000',
        'used': '3000', 
        'refurbished': '2000'
      };
      if (conditionMap[condition]) {
        searchParams2.set('filter', `conditionIds:{${conditionMap[condition]}}`);
      }
    }

    const searchUrl = `${EBAY_HOST}/buy/browse/v1/item_summary/search?${searchParams2.toString()}`;
    console.log("[DEBUG] eBay search URL:", searchUrl);

    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
      }
    });

    const searchText = await searchResponse.text();
    console.log("[DEBUG] Search response status:", searchResponse.status);

    if (!searchResponse.ok) {
      console.error("[ERROR] Search response:", searchText);
      return NextResponse.json({
        resultados: [],
        error: `eBay search failed: ${searchResponse.status}`,
        debug: { query, searchUrl, response: searchText.substring(0, 500) }
      }, { status: 502 });
    }

    const searchData = JSON.parse(searchText);
    const items = searchData.itemSummaries || [];

    console.log("[DEBUG] Found items:", items.length);

    // Enhanced filtering for games vs accessories
    const filteredItems = items.filter((item: any) => {
      const title = (item.title || "").toLowerCase();
      const searchTerm = nome.toLowerCase();
      
      // Must contain the search term
      if (!title.includes(searchTerm)) return false;
      
      // Exclude accessories, collectibles, and non-games
      const excludeKeywords = [
        'manual', 'box only', 'case only', 'cover', 'artwork', 'poster',
        'sword', 'cosplay', 'figure', 'statue', 'keychain', 'necklace',
        't-shirt', 'shirt', 'clothing', 'apparel', 'mug', 'cup',
        'sticker', 'decal', 'pin', 'badge', 'soundtrack', 'cd only',
        'guide', 'book', 'strategy', 'prima'
      ];
      
      if (excludeKeywords.some(kw => title.includes(kw))) return false;
      
      // For Devil May Cry specifically, exclude sequels if searching for original
      if (searchTerm === "devil may cry") {
        const sequelKeywords = ['devil may cry 2', 'devil may cry 3', 'devil may cry 4', 'devil may cry 5', 'dmc2', 'dmc3', 'dmc4', 'dmc5'];
        if (sequelKeywords.some(kw => title.includes(kw))) return false;
      }
      
      // Must be a video game
      const gameKeywords = ['game', 'video game', 'gaming', 'playstation', 'xbox', 'nintendo', 'pc', 'ps2', 'ps3', 'ps4'];
      const hasGameKeyword = gameKeywords.some(kw => title.includes(kw));
      
      return hasGameKeyword;
    });

    const results = filteredItems.map((item: any) => {
      const originalTitle = item.title || "No title";
      const cleanedTitle = cleanGameTitle(originalTitle, nome);
      
      return {
        title: cleanedTitle,
        priceText: item.price ? `${item.price.value} ${item.price.currency}` : "Price not available",
        price: item.price ? parseFloat(item.price.value) : 0,
        link: item.itemWebUrl || "#",
        site: "eBay",
        image: item.thumbnailImages?.[0]?.imageUrl || item.image?.imageUrl || "",
        condition: item.condition || "Unknown",
        tags: [
          ...(item.condition ? [`🏷️ ${item.condition}`] : []),
          ...(platform && platform !== "all" ? [platform] : [])
        ]
      };
    });

    console.log("[DEBUG] Final filtered results:", results.length);
    if (results.length > 0) {
      console.log("[DEBUG] Sample result:", results[0].title);
    }

    const response: ApiResponse = {
      resultados: results,
      total: results.length,
    };

    console.log(`eBay encontrou ${results.length} resultados para: ${nome} (${platform})`);

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("Erro na API do eBay:", error);

    let errorMessage = "Erro interno do servidor";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("eBay credentials")) {
        errorMessage = "Token de acesso do eBay não configurado";
        statusCode = 503; // Service Unavailable
      } else if (error.message.includes("Rate limit")) {
        errorMessage = "Limite de requisições do eBay atingido. Tente novamente em alguns segundos.";
        statusCode = 429; // Too Many Requests
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({
      error: errorMessage,
      resultados: [],
      total: 0,
      debug: {
        credentials: {
          hasClientId: !!EBAY_CLIENT_ID,
          hasClientSecret: !!EBAY_CLIENT_SECRET,
          sandbox: EBAY_SANDBOX,
          host: EBAY_HOST
        }
      }
    }, { status: statusCode });
  }
}

// POST handler for advanced searches (kept for future use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, platform = "all", condition = "all", filters } = body;

    if (!nome || !validateGameName(nome)) {
      return NextResponse.json(
        {
          error: "Nome do jogo inválido",
          resultados: [],
          total: 0,
        },
        { status: 400 }
      );
    }

    console.log(`Busca avançada no eBay para: ${nome} com filtros:`, filters);

    // For now, redirect to GET method logic
    const searchParams = new URLSearchParams({
      nome,
      platform,
      condition
    });
    
    const getRequest = new NextRequest(`${request.url}?${searchParams}`, {
      method: 'GET'
    });
    
    return GET(getRequest);
  } catch (error) {
    console.error("Erro na busca avançada do eBay:", error);

    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        resultados: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}
