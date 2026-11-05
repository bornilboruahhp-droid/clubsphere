import { NextRequest } from "next/server";
import { ok } from "@/lib/api/response";

interface RouteParams {
  params: Promise<{
    electionId: string;
  }>;
}

export async function GET(
  _request: NextRequest,
  _params: RouteParams
) {
  return ok({
    comingSoon: true,
    message:
      "The Executive Elections reporting module is coming soon in ClubSphere v2.0.",
    feature: "ELECTIONS_REPORTING",
    version: "v2.0",
  });
}
