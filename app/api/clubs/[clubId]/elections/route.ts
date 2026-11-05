import { NextRequest } from "next/server";

import { ok } from "@/lib/api/response";

interface RouteParams {
  params: Promise<{
    clubId: string;
  }>;
}

const COMING_SOON_PAYLOAD = {
  comingSoon: true,
  message:
    "The Executive Elections module is coming soon in ClubSphere v2.0. Leadership assignments can currently be managed via the Membership roster.",
  feature: "ELECTIONS",
  version: "v2.0",
};

export async function GET(
  _request: NextRequest,
  _params: RouteParams
) {
  return ok(COMING_SOON_PAYLOAD);
}

export async function POST(
  _request: NextRequest,
  _params: RouteParams
) {
  return ok(COMING_SOON_PAYLOAD);
}
