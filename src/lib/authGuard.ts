import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface AuthenticatedActor {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  vendorId?: string;
  vendorApprovalStatus?: string;
}

export async function requireRole(
  allowedRoles?: string[]
): Promise<{ actor: AuthenticatedActor; error?: never } | { actor?: never; error: NextResponse }> {
  const session = await getServerSession(authOptions);
  const sessionUserId = (session?.user as any)?.id;

  if (!sessionUserId) {
    return {
      error: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: String(sessionUserId) },
    include: {
      vendorProfile: {
        select: { id: true, approvalStatus: true },
      },
    },
  });

  if (!user) {
    return {
      error: NextResponse.json({ error: "Account not found" }, { status: 401 }),
    };
  }

  if (user.status !== "ACTIVE") {
    return {
      error: NextResponse.json(
        { error: `Account is ${user.status.toLowerCase()}${user.banReason ? `: ${user.banReason}` : ""}` },
        { status: 403 }
      ),
    };
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return {
      error: NextResponse.json(
        { error: `Access denied. Requires role: ${allowedRoles.join(" or ")}` },
        { status: 403 }
      ),
    };
  }

  return {
    actor: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      vendorId: user.vendorProfile?.id,
      vendorApprovalStatus: user.vendorProfile?.approvalStatus,
    },
  };
}

export async function logAdminAction(
  actorId: string,
  action: string,
  targetType: string,
  targetId?: string,
  diffObj?: unknown
) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId,
        action,
        targetType,
        targetId: targetId || null,
        diffJson: diffObj ? JSON.stringify(diffObj) : null,
      },
    });
  } catch (e) {
    console.error("AdminAuditLog error:", e);
  }
}
