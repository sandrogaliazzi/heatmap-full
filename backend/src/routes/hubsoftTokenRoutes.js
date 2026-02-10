import express from "express";

const router = express.Router();

router.post("/hubsoft-token", (req, res) => {
  async function sendToken() {
    const response = await fetch(
      "https://api.conectnet.hubsoft.com.br/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      },
    );

    if (!response.ok) {
      throw new Error(`Erro ao enviar token: ${response.status}`);
    }

    const data = await response.json();
    return data;
  }

  sendToken()
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((error) => {
      res.status(500).json({ error: error.message });
    });
});

export default router;
