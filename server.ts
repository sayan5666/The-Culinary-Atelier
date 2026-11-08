import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import {
  handleAutocompleteRequest,
  handleRecipeGenerateRequest,
  handleRecipeSearchRequest,
  handleChatRequest
} from "./api/_lib/geminiBackend";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Autocomplete endpoint
  app.post("/api/autocomplete", async (req, res) => {
    const result = await handleAutocompleteRequest(req.body);
    res.status(result.status).json(result.data);
  });

  // Recipe generation endpoint
  app.post("/api/recipe/generate", async (req, res) => {
    const result = await handleRecipeGenerateRequest(req.body);
    res.status(result.status).json(result.data);
  });

  // Recipe search endpoint
  app.post("/api/recipe/search", async (req, res) => {
    const result = await handleRecipeSearchRequest(req.body);
    res.status(result.status).json(result.data);
  });

  // AI Chat endpoint with cooking guardrails
  app.post("/api/chat", async (req, res) => {
    const result = await handleChatRequest(req.body);
    res.status(result.status).json(result.data);
  });

  // Unified endpoint for Gemini actions
  app.post("/api/gemini", async (req, res) => {
    const action = req.query.action || req.body?.action;
    if (action === "chat" || req.body?.message) {
      const result = await handleChatRequest(req.body);
      return res.status(result.status).json(result.data);
    }
    if (action === "generate" || req.body?.ingredients) {
      const result = await handleRecipeGenerateRequest(req.body);
      return res.status(result.status).json(result.data);
    }
    if (action === "autocomplete") {
      const result = await handleAutocompleteRequest(req.body);
      return res.status(result.status).json(result.data);
    }
    const result = await handleRecipeSearchRequest(req.body);
    res.status(result.status).json(result.data);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
