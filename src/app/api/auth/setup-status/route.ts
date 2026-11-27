import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [adminCount, session] = await Promise.all([
      prisma.user.count({ where: { role: "ADMIN" } }),
      getServerSession(authOptions),
    ]);

    return NextResponse.json({
      hasAdmin: adminCount > 0,
      user: session?.user || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
