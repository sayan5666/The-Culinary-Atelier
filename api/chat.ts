import { handleChatRequest, parseRequestBody, sendJsonResponse } from "./_lib/geminiBackend.js";

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") {
    return sendJsonResponse(res, 200, { ok: true });
  }

  if (req.method !== "POST") {
    return sendJsonResponse(res, 405, { error: "Method Not Allowed. Use POST." });
  }

  const body = await parseRequestBody(req);
  const result = await handleChatRequest(body);
  return sendJsonResponse(res, result.status, result.data);
}
