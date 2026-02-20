import { handleAnalyzeAction } from "./api.analyze.shared.server";

export const action = async ({ request }) => handleAnalyzeAction(request);
