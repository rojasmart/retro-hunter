import { NextRequest, NextResponse } from "next/server";
import { scrapeEbay, getEbayItemById } from "@/lib/scrapers/ebay";
import { ApiResponse, Platform } from "@/lib/types";
import { validateGameName } from "@/lib/utils/validators";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nome = searchParams.get("nome");
    const itemId = searchParams.get("itemId");
    const platform = (searchParams.get("platform") as Platform) || "all";
    const condition = searchParams.get("condition") || "all";

    // Se for busca por item específico
    if (itemId) {
      console.log(`Buscando item específico no eBay: ${itemId}`);
      const resultado = await getEbayItemById(itemId);

      if (!resultado) {
        return NextResponse.json(
          {
            error: "Item não encontrado",
            resultados: [],
            total: 0,
          },
          { status: 404 }
        );
      }

      const response: ApiResponse = {
        resultados: [resultado],
        total: 1,
      };

      return NextResponse.json(response);
    }

    // Validação de entrada para busca por nome
    if (!nome) {
      return NextResponse.json(
        {
          error: "Nome do jogo é obrigatório",
          resultados: [],
          total: 0,
        },
        { status: 400 }
      );
    }

    if (!validateGameName(nome)) {
      return NextResponse.json(
        {
          error: "Nome do jogo deve ter pelo menos 2 caracteres",
          resultados: [],
          total: 0,
        },
        { status: 400 }
      );
    }

    console.log(`Buscando no eBay para: ${nome} (Plataforma: ${platform}, Condição: ${condition})`);

    // Executar scraper do eBay
    const resultados = await scrapeEbay(nome, platform, condition);

    const response: ApiResponse = {
      resultados,
      total: resultados.length,
    };

    console.log(`eBay encontrou ${resultados.length} resultados para: ${nome} (${platform})`);

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, max-age=300", // Cache por 5 minutos
      },
    });
  } catch (error) {
    console.error("Erro na API do eBay:", error);

    let errorMessage = "Erro interno do servidor";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("EBAY_ACCESS_TOKEN")) {
        errorMessage = "Token de acesso do eBay não configurado";
        statusCode = 503; // Service Unavailable
      } else if (error.message.includes("Rate limit")) {
        errorMessage = "Limite de requisições do eBay atingido. Tente novamente em alguns segundos.";
        statusCode = 429; // Too Many Requests
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        resultados: [],
        total: 0,
      },
      { status: statusCode }
    );
  }
}

// Método POST para busca avançada (opcional)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, platform = "all", condition = "all", filters } = body;

    // Validação
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

    // Por enquanto, usar a busca padrão
    // No futuro, pode implementar filtros avançados
    const resultados = await scrapeEbay(nome, platform, condition);

    const response: ApiResponse = {
      resultados,
      total: resultados.length,
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, max-age=300",
      },
    });
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
