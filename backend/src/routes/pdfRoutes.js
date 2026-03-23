import express from "express";

const router = express.Router();

router.post("/generate-base64", (req, res) => {
  const linkPdf = req.body.linkPdf;

  async function pdfParaBase64(url) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Erro ao baixar PDF: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return base64;
  }
  pdfParaBase64(linkPdf)
    .then((base64) => {
      res.status(200).json({ base64 });
    })
    .catch((error) => {
      res.status(500).json({ error: error.message });
    });
});

router.post("/upload-pdf", async (req, res) => {
  try {
    const { urlPdfAssinado, urlEndpointHusoft, token, nomeArquivo } = req.body;

    if (!urlPdfAssinado || !urlEndpointHusoft || !token) {
      return res.status(400).json({
        success: false,
        error: "Parâmetros obrigatórios faltando",
        details: {
          urlPdfAssinado: !!urlPdfAssinado,
          urlEndpointHusoft: !!urlEndpointHusoft,
          token: !!token,
        },
      });
    }

    // 🔁 fetch com retry + timeout + erro detalhado
    const fetchWithRetry = async (
      url,
      options = {},
      retries = 3,
      step = "request",
    ) => {
      for (let i = 0; i < retries; i++) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 15000);

          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });

          clearTimeout(timeout);

          if (!response.ok) {
            const text = await response.text().catch(() => null);
            throw new Error(
              `[${step}] HTTP ${response.status} ao acessar ${url} ${text ? `| resposta: ${text}` : ""}`,
            );
          }

          return response;
        } catch (err) {
          const isLast = i === retries - 1;

          // timeout
          if (err.name === "AbortError") {
            if (isLast) {
              throw new Error(`[${step}] Timeout ao acessar ${url} (15s)`);
            }
          } else {
            if (isLast) {
              throw new Error(
                `[${step}] Falha após ${retries} tentativas: ${err.message}`,
              );
            }
          }

          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    };

    // 📥 1. Download do PDF
    const response = await fetchWithRetry(
      urlPdfAssinado,
      {},
      3,
      "download_pdf",
    );

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("pdf") && !contentType.includes("octet-stream")) {
      throw new Error(
        `[download_pdf] Content-Type inválido (${contentType}) para ${urlPdfAssinado}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!buffer || buffer.length === 0) {
      throw new Error(
        "[download_pdf] Arquivo vazio ou não foi possível ler o conteúdo",
      );
    }

    // 🔎 valida assinatura PDF
    const signature = buffer.slice(0, 4).toString();
    if (signature !== "%PDF") {
      throw new Error(
        `[download_pdf] Assinatura inválida (${signature}) - não é um PDF válido`,
      );
    }

    // 📝 2. Sanitizar nome do arquivo
    let fileName = nomeArquivo || "documento.pdf";

    fileName = fileName
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
      .replace(/\s+/g, "_");

    if (!fileName.toLowerCase().endsWith(".pdf")) {
      fileName += ".pdf";
    }

    // 📦 3. Criar FormData
    let form;
    try {
      const blob = new Blob([buffer], { type: "application/pdf" });
      form = new FormData();
      form.append("files[0]", blob, fileName);
    } catch (err) {
      throw new Error(
        `[form_data] Erro ao montar multipart/form-data: ${err.message}`,
      );
    }

    // 📤 4. Upload para Hubsoft
    const uploadResponse = await fetchWithRetry(
      urlEndpointHusoft,
      {
        method: "POST",
        headers: {
          Authorization: token,
        },
        body: form,
      },
      3,
      "upload_hubsoft",
    );

    let result;

    try {
      result = await uploadResponse.json();
    } catch {
      result = await uploadResponse.text();
    }

    return res.status(uploadResponse.status).json({
      success: uploadResponse.ok,
      status: uploadResponse.status,
      etapa: "upload_hubsoft",
      enviado: uploadResponse.ok,
      resposta_hubsoft: result,
    });
  } catch (error) {
    console.error("❌ Erro no upload-pdf:", error);

    return res.status(500).json({
      success: false,
      error: "Falha no processamento do upload",
      message: error.message,
    });
  }
});

export default router;
