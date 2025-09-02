import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("📷 API OCR chamada");

    // Recebe o arquivo do frontend
    const formData = await request.formData();
    const file = (formData.get("file") || formData.get("image")) as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    if (typeof file === "string") {
      return NextResponse.json(
        { error: "Arquivo inválido" },
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

    // Envia diretamente para o backend FastAPI
    const backendUrl = "http://localhost:8000/ocr";
    const pass = new FormData();
    pass.append("file", file, (file as File).name || "upload.png");

    const resp = await fetch(backendUrl, {
      method: "POST",
      body: pass as any,
      cache: "no-store",
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return NextResponse.json(
        { error: "Falha no OCR backend", backend: txt },
        { status: 502 }
      );
    }

    const data = await resp.json();

    // Retorna matched_title e demais campos do backend
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error("❌ Erro no OCR:", error);
    return NextResponse.json(
      { error: "Erro ao processar imagem" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};
