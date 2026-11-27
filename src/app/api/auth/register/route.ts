import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      name,
      phone,
      accountType = "BUYER", // BUYER | VENDOR | FIRST_ADMIN
      companyName,
      city,
      gstin,
    } = body;

    if (!email || !password || String(password).length < 6) {
      return NextResponse.json(
        { error: "Valid email and password (min 6 characters) are required" },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    let role = "BUYER";
    if (accountType === "FIRST_ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount > 0) {
        return NextResponse.json(
          { error: "Platform Admin already initialized. Sign in with existing Admin credentials." },
          { status: 403 }
        );
      }
      role = "ADMIN";
    } else if (accountType === "VENDOR") {
      if (!companyName?.trim() || !city?.trim()) {
        return NextResponse.json(
          { error: "Company Name and City Hub are required for Vendor registration" },
          { status: 400 }
        );
      }
      role = "VENDOR";
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(String(password), salt);

    const createdUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: name?.trim() || cleanEmail.split("@")[0],
        phone: phone?.trim() || null,
        password: hashedPassword,
        role,
        status: "ACTIVE",
        vendorProfile:
          role === "VENDOR"
            ? {
                create: {
                  companyName: companyName.trim(),
                  contactEmail: cleanEmail,
                  phone: phone?.trim() || null,
                  city: city.trim(),
                  gstin: gstin?.trim() || null,
                  approvalStatus: "PENDING",
                  adStatus: "PAUSED",
                },
              }
            : undefined,
      },
      include: { vendorProfile: true },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
        role: createdUser.role,
        vendorApprovalStatus: createdUser.vendorProfile?.approvalStatus || null,
      },
    });
  } catch (error: any) {
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
