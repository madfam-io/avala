import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();

  // Check API connectivity
  let apiStatus: "healthy" | "unhealthy" = "unhealthy";
  let apiResponseTime = 0;

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${apiUrl}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    apiResponseTime = Date.now() - startTime;
    apiStatus = response.ok ? "healthy" : "unhealthy";
  } catch {
    apiResponseTime = Date.now() - startTime;
    apiStatus = "unhealthy";
  }

  const status = apiStatus === "healthy" ? "healthy" : "degraded";

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      service: "avala-web",
      checks: {
        api: {
          status: apiStatus,
          responseTime: apiResponseTime,
        },
      },
    },
    { status: status === "healthy" ? 200 : 503 }
  );
}
