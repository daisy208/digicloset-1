import { handleAnalyzeAction } from "./api.analyze.shared.server";

export const action = async ({ request }) => {
  // Legacy endpoint retained for compatibility; canonical endpoint is /api/v1/analyze.
  const response = await handleAnalyzeAction(request);
  response.headers.set("X-API-Deprecated", "Use /api/v1/analyze");
  return response;
};
