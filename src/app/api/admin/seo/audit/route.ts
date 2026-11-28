import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/authGuard";
import {
  runLighthousePageSpeedCheck,
  runSiteWideTechSeoAudit,
} from "@/lib/seoEngine/siteTechAuditor";

export async function GET(req: NextRequest) {
  const auth = await requireRole(["ADMIN"]);
  if (auth.error) return auth.error;

  const customOrigin = req.nextUrl.searchParams.get("origin");
  const baseOrigin = (customOrigin || req.nextUrl.origin || "http://localhost:3010").replace(/\/$/, "");
  const report = await runSiteWideTechSeoAudit(baseOrigin);
  return NextResponse.json(report);
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const body = await req.json().catch(() => ({}));
    if (body.targetUrl) {
      const strategy = body.strategy === "desktop" ? "desktop" : "mobile";
      const psi = await runLighthousePageSpeedCheck(String(body.targetUrl), strategy);
      return NextResponse.json(psi);
    }

    const baseOrigin = String(body.origin || req.nextUrl.origin || "http://localhost:3010").replace(
      /\/$/,
      ""
    );
    const report = await runSiteWideTechSeoAudit(baseOrigin);
    return NextResponse.json(report);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Audit failed" }, { status: 400 });
  }
}
