import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromCookies, verifyToken } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { parsePagination } from "@/lib/pagination";
import { validateFields, MAX_LENGTHS } from "@/lib/validation";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

// GET — list questions (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get("specialty") || "";
    const status = searchParams.get("status") || "";
    const q = searchParams.get("q") || "";
    const { page, limit, skip } = parsePagination(searchParams);

    const where: Record<string, unknown> = {
      visibility: "PUBLIC",
    };

    if (specialty) {
      where.specialty = { contains: specialty, mode: "insensitive" };
    }
    if (status) {
      where.status = status;
    }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { body: { contains: q, mode: "insensitive" } },
      ];
    }

    const [questions, total] = await Promise.all([
      prisma.clinicalQuestion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          answers: {
            select: { id: true },
          },
        },
      }),
      prisma.clinicalQuestion.count({ where }),
    ]);

    return NextResponse.json({
      questions: questions.map((q) => ({
        id: q.id,
        slug: q.slug,
        title: q.title,
        body: q.body.slice(0, 200),
        specialty: q.specialty,
        status: q.status,
        answerCount: q.answers.length,
        viewCount: q.viewCount,
        createdAt: q.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("ClinicalQuestions", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

// POST — submit a question (optional auth)
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));
    const payload = token ? await verifyToken(token) : null;

    const body = await request.json();
    const { title, questionBody, specialty, visibility } = body;

    const fieldError = validateFields(body, {
      title: { required: true, maxLength: MAX_LENGTHS.searchQuery },
      questionBody: { required: true, maxLength: MAX_LENGTHS.longText },
      specialty: { required: true, maxLength: MAX_LENGTHS.shortText },
      visibility: { maxLength: MAX_LENGTHS.shortText },
    });
    if (fieldError) return fieldError;

    // Generate unique slug
    const baseSlug = slugify(title);
    let slug = baseSlug;
    let attempt = 0;
    while (true) {
      const existing = await prisma.clinicalQuestion.findUnique({
        where: { slug },
      });
      if (!existing) break;
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    const question = await prisma.clinicalQuestion.create({
      data: {
        submittedBy: payload?.userId || null,
        title,
        body: questionBody,
        specialty,
        slug,
        visibility: visibility || "PUBLIC",
        status: "OPEN",
      },
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    logger.error("ClinicalQuestionCreate", error);
    return NextResponse.json(
      { error: "Failed to submit question" },
      { status: 500 }
    );
  }
}
