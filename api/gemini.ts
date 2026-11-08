import {
  handleChatRequest,
  handleAutocompleteRequest,
  handleRecipeGenerateRequest,
  handleRecipeSearchRequest,
  parseRequestBody,
  sendJsonResponse
} from "./_lib/geminiBackend";

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") {
    return sendJsonResponse(res, 200, { ok: true });
  }

  if (req.method !== "POST") {
    return sendJsonResponse(res, 405, { error: "Method Not Allowed. Use POST." });
  }

  const body = await parseRequestBody(req);
  const action = req.query?.action || body?.action;

  switch (action) {
    case "chat": {
      const result = await handleChatRequest(body);
      return sendJsonResponse(res, result.status, result.data);
    }
    case "autocomplete": {
      const result = await handleAutocompleteRequest(body);
      return sendJsonResponse(res, result.status, result.data);
    }
    case "generate": {
      const result = await handleRecipeGenerateRequest(body);
      return sendJsonResponse(res, result.status, result.data);
    }
    case "search": {
      const result = await handleRecipeSearchRequest(body);
      return sendJsonResponse(res, result.status, result.data);
    }
    default: {
      // Default to chat if message exists, search if query exists, or generate if ingredients exist
      if (body?.message) {
        const result = await handleChatRequest(body);
        return sendJsonResponse(res, result.status, result.data);
      }
      if (body?.ingredients) {
        const result = await handleRecipeGenerateRequest(body);
        return sendJsonResponse(res, result.status, result.data);
      }
      if (body?.query) {
        const result = await handleRecipeSearchRequest(body);
        return sendJsonResponse(res, result.status, result.data);
      }
      return sendJsonResponse(res, 400, {
        error: "Missing action or valid payload (chat, autocomplete, generate, search)."
      });
    }
  }
}
