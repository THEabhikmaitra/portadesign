import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole, logAdminAction } from "@/lib/authGuard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        banReason: true,
        xp: true,
        badgesJson: true,
        createdAt: true,
        vendorProfile: {
          select: { id: true, companyName: true, approvalStatus: true },
        },
        _count: {
          select: { designs: true, quotesSent: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const body = await req.json();
    const { email, password, name, phone, role = "BUYER" } = body;

    if (!email || !password || String(password).length < 6) {
      return NextResponse.json({ error: "Email and min 6-char password required" }, { status: 400 });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) return NextResponse.json({ error: "Email already exists" }, { status: 409 });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(String(password), salt);

    const created = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: name?.trim() || cleanEmail.split("@")[0],
        phone: phone?.trim() || null,
        password: hashedPassword,
        role: ["BUYER", "VENDOR", "ADMIN"].includes(role) ? role : "BUYER",
        status: "ACTIVE",
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        xp: true,
        createdAt: true,
      },
    });

    await logAdminAction(auth.actor.id, "USER_CREATE", "User", created.id, { role: created.role });

    return NextResponse.json({ success: true, user: created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const body = await req.json();
    const { id, role, status, banReason, xp, badgesJson, name, phone } = body;

    if (!id) return NextResponse.json({ error: "User id required" }, { status: 400 });

    if (id === auth.actor.id && (status === "BANNED" || status === "SUSPENDED" || (role && role !== "ADMIN"))) {
      return NextResponse.json({ error: "Cannot ban or demote your own Admin session" }, { status: 400 });
    }

    const data: Record<string, any> = {};
    if (role && ["BUYER", "VENDOR", "ADMIN"].includes(role)) data.role = role;
    if (status && ["ACTIVE", "SUSPENDED", "BANNED"].includes(status)) data.status = status;
    if (banReason !== undefined) data.banReason = banReason || null;
    if (xp !== undefined) data.xp = Math.max(0, parseInt(String(xp), 10) || 0);
    if (badgesJson !== undefined) {
      data.badgesJson = typeof badgesJson === "string" ? badgesJson : JSON.stringify(badgesJson);
    }
    if (name !== undefined) data.name = name;
    if (phone !== undefined) data.phone = phone;

    const updated = await prisma.user.update({
      where: { id: String(id) },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        banReason: true,
        xp: true,
        badgesJson: true,
        createdAt: true,
      },
    });

    await logAdminAction(auth.actor.id, "USER_UPDATE", "User", updated.id, data);

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "User id required" }, { status: 400 });
    if (id === auth.actor.id) {
      return NextResponse.json({ error: "Cannot delete your own active Admin account" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    await logAdminAction(auth.actor.id, "USER_DELETE", "User", id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
