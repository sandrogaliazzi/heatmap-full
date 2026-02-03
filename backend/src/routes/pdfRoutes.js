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
export default router;
