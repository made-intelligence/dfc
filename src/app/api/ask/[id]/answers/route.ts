import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromCookies, verifyToken } from "@/lib/auth";
import { updateReputationScore } from "@/lib/reputation/score";
import { logger } from "@/lib/logger";

// GET — list answers for a question (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const question = await prisma.clinicalQuestion.findUnique({
      where: { id },
      include: {
        answers: {
          orderBy: [{ isAccepted: "desc" }, { helpfulCount: "desc" }, { createdAt: "asc" }],
          include: {
            question: false,
          },
        },
      },
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Increment view count
    await prisma.clinicalQuestion.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // Fetch author details for answers
    const authorIds = question.answers.map((a) => a.authorId);
    const authors = await prisma.user.findMany({
      where: { id: { in: authorIds } },
      select: {
        id: true,
        name: true,
        profileImage: true,
        doctorProfile: {
          select: {
            title: true,
            specialty: { select: { name: true } },
          },
        },
      },
    });

    const authorMap = new Map(authors.map((a) => [a.id, a]));

    return NextResponse.json({
      question: {
        id: question.id,
        slug: question.slug,
        title: question.title,
        body: question.body,
        specialty: question.specialty,
        status: question.status,
        viewCount: question.viewCount + 1,
        createdAt: question.createdAt,
      },
      answers: question.answers.map((a) => {
        const author = authorMap.get(a.authorId);
        return {
          id: a.id,
          body: a.body,
          isAccepted: a.isAccepted,
          helpfulCount: a.helpfulCount,
          notHelpfulCount: a.notHelpfulCount,
          createdAt: a.createdAt,
          author: author
            ? {
                id: author.id,
                name: author.name,
                profileImage: author.profileImage,
                title: author.doctorProfile?.title,
                specialty: author.doctorProfile?.specialty?.name,
              }
            : null,
        };
      }),
    });
  } catch (error) {
    logger.error("ClinicalAnswersList", error);
    return NextResponse.json(
      { error: "Failed to fetch answers" },
      { status: 500 }
    );
  }
}

// POST — submit an answer (DFC members only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questionId } = await params;
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload || payload.role !== "DFC_MEMBER") {
      return NextResponse.json(
        { error: "Only DFC members can answer clinical questions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { answerBody } = body;

    if (!answerBody || answerBody.length < 50) {
      return NextResponse.json(
        { error: "Answer must be at least 50 characters" },
        { status: 400 }
      );
    }

    if (answerBody.length > 10000) {
      return NextResponse.json(
        { error: "Answer must be under 10,000 characters" },
        { status: 400 }
      );
    }

    // Verify question exists
    const question = await prisma.clinicalQuestion.findUnique({
      where: { id: questionId },
    });
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const answer = await prisma.clinicalAnswer.create({
      data: {
        questionId,
        authorId: payload.userId,
        body: answerBody,
      },
    });

    // Update question status to ANSWERED if it was OPEN
    if (question.status === "OPEN") {
      await prisma.clinicalQuestion.update({
        where: { id: questionId },
        data: { status: "ANSWERED" },
      });
    }

    // Update reputation score in background
    updateReputationScore(payload.userId).catch((err) =>
      logger.error("ReputationScoreUpdate", err)
    );

    return NextResponse.json({ answer }, { status: 201 });
  } catch (error) {
    logger.error("ClinicalAnswerCreate", error);
    return NextResponse.json(
      { error: "Failed to submit answer" },
      { status: 500 }
    );
  }
}
