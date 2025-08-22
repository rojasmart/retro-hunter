import { NextRequest, NextResponse } from "next/server";
import { createWorker } from "tesseract.js";
import { cleanOCRText, generateGameNameVariations } from "@/lib/utils/ocr";

export async function POST(request: NextRequest) {
  try {
    console.log("📷 API OCR chamada");

    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Arquivo deve ser uma imagem" },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Arquivo muito grande (máximo 10MB)" },
        { status: 400 }
      );
    }

    console.log(`🔍 Processando imagem: ${file.name} (${file.size} bytes)`);

    // Converter File para Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Processar com Tesseract
    const worker = await createWorker("por+eng", 1, {
      logger: (m) => console.log("OCR:", m.status, m.progress),
    });

    const {
      data: { text, confidence },
    } = await worker.recognize(buffer);

    await worker.terminate();

    // Limpar e processar texto
    const cleanedText = cleanOCRText(text);
    const variations = generateGameNameVariations(text);

    console.log(`✅ OCR concluído: confiança=${confidence}%`);
    console.log(`📝 Texto extraído: "${cleanedText}"`);

    return NextResponse.json({
      success: true,
      text: cleanedText,
      rawText: text,
      variations: variations,
      confidence: Math.round(confidence),
    });

  } catch (error) {
    console.error("❌ Erro no OCR:", error);
    return NextResponse.json(
      { error: "Erro ao processar imagem" },
      { status: 500 }
    );
  }
}

// Configuração do Next.js para aceitar arquivos maiores
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};
