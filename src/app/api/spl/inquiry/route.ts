import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// POST — partnership inquiry from SPL landing page (public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, hmoName, livesUnderManagement, annualSpecialistClaims, email, phone } =
      body;

    if (!name || !hmoName || !email) {
      return NextResponse.json(
        { error: "name, hmoName, and email are required" },
        { status: 400 }
      );
    }

    // Store as a secretariat ticket with type SPL_INQUIRY
    const ticket = await prisma.secretariatTicket.create({
      data: {
        source: "WEB",
        requestType: "SPL_INQUIRY",
        subject: `SPL Partnership Inquiry: ${hmoName}`,
        rawMessage: [
          `Contact: ${name}`,
          `HMO: ${hmoName}`,
          `Email: ${email}`,
          phone ? `Phone: ${phone}` : null,
          livesUnderManagement
            ? `Lives under management: ${livesUnderManagement}`
            : null,
          annualSpecialistClaims
            ? `Annual specialist claims estimate: ${annualSpecialistClaims}`
            : null,
        ]
          .filter(Boolean)
          .join("\n"),
        fromName: name,
      },
    });

    return NextResponse.json(
      {
        message: "Thank you for your interest. Our team will be in touch within 48 hours.",
        reference: ticket.reference,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("SPLInquiry", error);
    return NextResponse.json(
      { error: "Failed to submit inquiry" },
      { status: 500 }
    );
  }
}
