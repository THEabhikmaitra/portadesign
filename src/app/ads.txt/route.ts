import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const client = (process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "").trim();
  const pubMatch = client.match(/pub-\d+/i);
  const body = pubMatch
    ? `google.com, ${pubMatch[0].toLowerCase()}, DIRECT, f08c47fec0942fa0\n`
    : "# Configure NEXT_PUBLIC_ADSENSE_CLIENT (ca-pub-xxxxxxxxxxxxxxxx) to activate ads.txt\n";

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
