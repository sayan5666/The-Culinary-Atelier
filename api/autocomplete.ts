import { handleAutocompleteRequest, parseRequestBody, sendJsonResponse } from "./_lib/geminiBackend";

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") {
    return sendJsonResponse(res, 200, { ok: true });
  }

  if (req.method !== "POST") {
    return sendJsonResponse(res, 405, { error: "Method Not Allowed. Use POST." });
  }

  const body = await parseRequestBody(req);
  const result = await handleAutocompleteRequest(body);
  return sendJsonResponse(res, result.status, result.data);
}
