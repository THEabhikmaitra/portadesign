import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole, logAdminAction } from "@/lib/authGuard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const vendors = await prisma.vendorProfile.findMany({
      include: {
        user: { select: { id: true, email: true, name: true, status: true, createdAt: true } },
        rateCards: true,
        _count: { select: { quotesReceived: true } },
      },
      orderBy: [{ approvalStatus: "asc" }, { isSponsored: "desc" }, { sponsoredBidAmt: "desc" }],
    });

    return NextResponse.json({ vendors });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const body = await req.json();
    const {
      email,
      password,
      ownerName,
      companyName,
      phone,
      city,
      gstin,
      leadDays = 12,
      warrantyYears = 5,
      approvalStatus = "APPROVED",
      isSponsored = false,
      sponsoredBidAmt = 0,
      adStatus = "PAUSED",
      adDailyCap = 500,
      adHeadline,
    } = body;

    if (!email || !password || !companyName || !city) {
      return NextResponse.json(
        { error: "email, password, companyName, and city are required" },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return NextResponse.json({ error: "User email already exists" }, { status: 409 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(String(password), salt);

    const created = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: ownerName?.trim() || companyName.trim(),
        phone: phone?.trim() || null,
        password: hashedPassword,
        role: "VENDOR",
        status: "ACTIVE",
        vendorProfile: {
          create: {
            companyName: companyName.trim(),
            contactEmail: cleanEmail,
            phone: phone?.trim() || null,
            city: city.trim(),
            gstin: gstin?.trim() || null,
            leadDays: Number(leadDays) || 12,
            warrantyYears: Number(warrantyYears) || 5,
            approvalStatus,
            isSponsored: Boolean(isSponsored),
            sponsoredBidAmt: Number(sponsoredBidAmt) || 0,
            adStatus,
            adDailyCap: Number(adDailyCap) || 500,
            adHeadline: adHeadline?.trim() || null,
          },
        },
      },
      include: { vendorProfile: true },
    });

    await logAdminAction(auth.actor.id, "VENDOR_CREATE", "VendorProfile", created.vendorProfile?.id, {
      companyName,
      approvalStatus,
    });

    return NextResponse.json({ success: true, vendor: created.vendorProfile });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "VendorProfile id required" }, { status: 400 });
    }

    const allowed: Record<string, any> = {};
    if (updates.approvalStatus !== undefined) allowed.approvalStatus = String(updates.approvalStatus);
    if (updates.approvalNotes !== undefined) allowed.approvalNotes = updates.approvalNotes;
    if (updates.companyName !== undefined) allowed.companyName = String(updates.companyName);
    if (updates.contactEmail !== undefined) allowed.contactEmail = String(updates.contactEmail);
    if (updates.phone !== undefined) allowed.phone = updates.phone;
    if (updates.city !== undefined) allowed.city = String(updates.city);
    if (updates.gstin !== undefined) allowed.gstin = updates.gstin;
    if (updates.kycDocUrl !== undefined) allowed.kycDocUrl = updates.kycDocUrl;
    if (updates.leadDays !== undefined) allowed.leadDays = Number(updates.leadDays);
    if (updates.warrantyYears !== undefined) allowed.warrantyYears = Number(updates.warrantyYears);
    if (updates.rating !== undefined) allowed.rating = Math.min(5, Math.max(1, Number(updates.rating)));
    if (updates.isSponsored !== undefined) allowed.isSponsored = Boolean(updates.isSponsored);
    if (updates.sponsoredBidAmt !== undefined) allowed.sponsoredBidAmt = Math.max(0, Number(updates.sponsoredBidAmt));
    if (updates.adStatus !== undefined) allowed.adStatus = String(updates.adStatus);
    if (updates.adHeadline !== undefined) allowed.adHeadline = updates.adHeadline;
    if (updates.adDailyCap !== undefined) allowed.adDailyCap = Math.max(0, Number(updates.adDailyCap));
    if (updates.adSpentMonth !== undefined) allowed.adSpentMonth = Math.max(0, Number(updates.adSpentMonth));

    const updated = await prisma.vendorProfile.update({
      where: { id: String(id) },
      data: allowed,
      include: {
        user: { select: { id: true, email: true, name: true, status: true } },
        rateCards: true,
        _count: { select: { quotesReceived: true } },
      },
    });

    await logAdminAction(auth.actor.id, "VENDOR_UPDATE", "VendorProfile", updated.id, allowed);

    return NextResponse.json({ success: true, vendor: updated });
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
    if (!id) return NextResponse.json({ error: "Missing vendor id" }, { status: 400 });

    const existing = await prisma.vendorProfile.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    await prisma.vendorProfile.delete({ where: { id } });
    await logAdminAction(auth.actor.id, "VENDOR_DELETE", "VendorProfile", id, {
      companyName: existing.companyName,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
