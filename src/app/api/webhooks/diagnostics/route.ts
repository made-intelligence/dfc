import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiResult } from "@/lib/diagnostics/ingestion";
import { logger } from "@/lib/logger";

/**
 * POST /api/webhooks/diagnostics
 *
 * Webhook endpoint for diagnostic partners to push lab results.
 * Auth: x-api-key header matched against DiagnosticPartner.apiKeyEnvVar.
 * Each partner stores the NAME of an env variable (e.g. "CERBA_API_KEY")
 * and the actual secret is in process.env at runtime.
 *
 * Payload:
 * {
 *   referralCode?: string;       // DFC-REF-XXXXXX
 *   patientName?: string;
 *   testName: string;
 *   results: [{ test, value, unit, refRange?, flag? }];
 *   reportDate: string;          // ISO 8601
 *   labName?: string;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate via API key
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing x-api-key header" },
        { status: 401 }
      );
    }

    // Look up active partners that have an API key configured
    const partners = await prisma.diagnosticPartner.findMany({
      where: { isActive: true, apiKeyEnvVar: { not: null } },
    });

    // Match the provided key against the env variable each partner references
    const partner = partners.find((p) => {
      if (!p.apiKeyEnvVar) return false;
      const expectedKey = process.env[p.apiKeyEnvVar];
      return expectedKey && expectedKey === apiKey;
    });

    if (!partner) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      );
    }

    // 2. Parse and validate payload
    const body = await request.json();
    const { referralCode, patientName, testName, results, reportDate, labName } = body;

    if (!testName || !results || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        { error: "testName and non-empty results array are required" },
        { status: 400 }
      );
    }

    if (!reportDate) {
      return NextResponse.json(
        { error: "reportDate is required (ISO 8601)" },
        { status: 400 }
      );
    }

    // Validate each result item
    for (const r of results) {
      if (!r.test || !r.value || !r.unit) {
        return NextResponse.json(
          { error: "Each result must have test, value, and unit fields" },
          { status: 400 }
        );
      }
    }

    // 3. Process through ingestion pipeline
    await handleApiResult(partner.id, {
      referralCode,
      patientName,
      testName,
      results,
      reportDate,
      labName: labName || partner.name,
    });

    return NextResponse.json({
      success: true,
      message: "Result received and processed",
      referralCode: referralCode || null,
    });
  } catch (error) {
    logger.error("WebhookDiagnostics", error);
    return NextResponse.json(
      { error: "Failed to process diagnostic result" },
      { status: 500 }
    );
  }
}
