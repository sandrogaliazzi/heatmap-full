import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.get("/getvendor/:mac", async (req, res) => {
  const mac = req.params.mac;
  try {
    const response = await fetch(`https://api.macvendors.com/${mac}`);
    const data = await response.text(); // returns vendor name
    res.json({ vendor: data });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch MAC vendor" });
  }
});

export default router;
