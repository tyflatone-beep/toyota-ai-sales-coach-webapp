// TOYOTA AI Sales Coach — TFR Cursus PRO
// Petit serveur web qui sert l'interface de chat et relaie les messages vers l'API Google Gemini.

const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

// --- Construction de l'instruction système : SYSTEM_PROMPT.md + les 4 fichiers de connaissances ---
// Tout est concaténé directement (pas de recherche documentaire) : le modèle a donc TOUJOURS
// l'intégralité du contexte sous les yeux, sans dépendre d'une éventuelle reformulation.
function loadSystemInstruction() {
  const contentDir = path.join(__dirname, "content");
  const files = [
    "SYSTEM_PROMPT.md",
    "SCORING_BEV_PRO.md",
    "SCORING_GRAND_VOLUME.md",
    "SCORING_BENNE.md",
    "PERSONAS.md",
  ];

  const parts = files.map((filename) => {
    const filePath = path.join(contentDir, filename);
    const text = fs.readFileSync(filePath, "utf-8");
    return `\n\n=== FICHIER: ${filename} ===\n\n${text}`;
  });

  return parts.join("\n");
}

let SYSTEM_INSTRUCTION;
try {
  SYSTEM_INSTRUCTION = loadSystemInstruction();
  console.log(
    `Instruction système chargée (${SYSTEM_INSTRUCTION.length} caractères, modèle: ${MODEL}).`
  );
} catch (err) {
  console.error("Erreur au chargement des fichiers de contenu :", err);
  process.exit(1);
}

// --- Route de chat ---
app.post("/api/chat", async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({
      error:
        "GEMINI_API_KEY n'est pas configurée côté serveur. Ajoutez-la dans les variables d'environnement de votre hébergeur.",
    });
  }

  const { history, message } = req.body || {};
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message manquant." });
  }
  if (!Array.isArray(history)) {
    return res.status(400).json({ error: "Historique invalide." });
  }

  // history attendu : [{ role: "user" | "model", text: "..." }, ...]
  const contents = [
    ...history.map((turn) => ({
      role: turn.role === "model" ? "model" : "user",
      parts: [{ text: String(turn.text || "") }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  try {
    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        generationConfig: {
          temperature: 0.8,
        },
      }),
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error("Erreur API Gemini :", JSON.stringify(data));
      return res.status(502).json({
        error:
          data?.error?.message ||
          "Erreur lors de l'appel à l'API Gemini. Réessayez dans un instant.",
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ||
      "(Réponse vide — réessayez.)";

    res.json({ reply });
  } catch (err) {
    console.error("Erreur réseau vers l'API Gemini :", err);
    res.status(502).json({ error: "Impossible de contacter l'API Gemini." });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, model: MODEL, apiKeyConfigured: Boolean(API_KEY) });
});

app.listen(PORT, () => {
  console.log(`TOYOTA AI Sales Coach en écoute sur le port ${PORT}`);
});

