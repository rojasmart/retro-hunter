import { NextRequest, NextResponse } from "next/server";
import { scrapeAllSites } from "@/lib/scrapers";
import { ApiResponse, Platform } from "@/lib/types";
import { validateGameName } from "@/lib/utils/validators";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nome = searchParams.get("nome");
    const platform = (searchParams.get("platform") as Platform) || 'all';

    // Validação de entrada
    if (!nome) {
      return NextResponse.json({ error: "Nome do jogo é obrigatório", resultados: [], total: 0 }, { status: 400 });
    }

    if (!validateGameName(nome)) {
      return NextResponse.json({ error: "Nome do jogo deve ter pelo menos 2 caracteres", resultados: [], total: 0 }, { status: 400 });
    }

    console.log(`Buscando preços para: ${nome} (Plataforma: ${platform})`);

    // Executar scrapers com plataforma
    const resultados = await scrapeAllSites(nome, platform);

    const response: ApiResponse = {
      resultados,
      total: resultados.length,
    };

    console.log(`Encontrados ${resultados.length} resultados para: ${nome} (${platform})`);

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, max-age=300", // Cache por 5 minutos
      },
    });
  } catch (error) {
    console.error("Erro na API de comparação:", error);

    const errorMessage = error instanceof Error ? error.message : "Erro interno do servidor";

    return NextResponse.json(
      {
        error: errorMessage,
        resultados: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}

// Adicionar suporte a POST para buscas mais complexas (opcional)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, filtros } = body;

    if (!nome) {
      return NextResponse.json({ error: "Nome do jogo é obrigatório", resultados: [], total: 0 }, { status: 400 });
    }

    if (!validateGameName(nome)) {
      return NextResponse.json({ error: "Nome do jogo deve ter pelo menos 2 caracteres", resultados: [], total: 0 }, { status: 400 });
    }

    console.log(`Busca POST para: ${nome}`, filtros);

    const resultados = await scrapeAllSites(nome);

    // Aplicar filtros se fornecidos
    let resultadosFiltrados = resultados;

    if (filtros) {
      if (filtros.precoMin) {
        resultadosFiltrados = resultadosFiltrados.filter((r) => r.price >= filtros.precoMin);
      }
      if (filtros.precoMax) {
        resultadosFiltrados = resultadosFiltrados.filter((r) => r.price <= filtros.precoMax);
      }
      if (filtros.sites && filtros.sites.length > 0) {
        resultadosFiltrados = resultadosFiltrados.filter((r) => filtros.sites.includes(r.site));
      }
    }

    const response: ApiResponse = {
      resultados: resultadosFiltrados,
      total: resultadosFiltrados.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro na API POST de comparação:", error);

    const errorMessage = error instanceof Error ? error.message : "Erro interno do servidor";

    return NextResponse.json(
      {
        error: errorMessage,
        resultados: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}
