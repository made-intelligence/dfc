import { prisma } from "@/lib/prisma";

// Weights for overall score (0-100)
const WEIGHTS = {
  credentialsVerified: 20,
  answersGiven: 20,
  helpfulRating: 15,
  cmeHours: 15,
  casesReviewed: 15,
  endorsementsReceived: 10,
  profileViews90d: 5,
};

function logScale(value: number, maxInput: number): number {
  if (value <= 0) return 0;
  const normalized = Math.min(value / maxInput, 1);
  // Log scale: log(1 + 9*x) / log(10) gives 0-1 range
  return Math.log10(1 + 9 * normalized);
}

function linearScale(value: number, maxInput: number): number {
  return Math.min(value / maxInput, 1);
}

export async function calculateReputationScore(userId: string): Promise<{
  overallScore: number;
  answersGiven: number;
  helpfulRating: number;
  profileViews90d: number;
  cmeHours: number;
  casesReviewed: number;
  deploymentsCompleted: number;
  endorsementsReceived: number;
  credentialsVerified: boolean;
}> {
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  // Fetch all data in parallel
  const [
    verifiedCredCount,
    answersCount,
    answers,
    profileViews,
    endorsements,
    casesCompleted,
    deploymentsCompleted,
  ] = await Promise.all([
    // Verified credentials
    prisma.medicalCredential.count({
      where: {
        dfcMember: { userId },
        status: "VERIFIED",
      },
    }),
    // Answers given
    prisma.clinicalAnswer.count({
      where: { authorId: userId },
    }),
    // Helpful rating data
    prisma.clinicalAnswer.findMany({
      where: { authorId: userId },
      select: { helpfulCount: true, notHelpfulCount: true },
    }),
    // Profile views last 90 days
    prisma.profileViewLog.count({
      where: {
        profileUserId: userId,
        viewedAt: { gte: ninetyDaysAgo },
      },
    }),
    // Endorsements received
    prisma.endorsementRecord.count({
      where: { endorsed: { userId } },
    }),
    // Second opinion cases reviewed (delivered)
    prisma.secondOpinionCase.count({
      where: {
        specialist: { userId },
        status: "COMPLETED",
      },
    }),
    // Deployments completed (via EarningsLedger)
    prisma.earningsLedger.count({
      where: {
        userId,
        source: "DEPLOYMENT",
        status: "SETTLED",
      },
    }),
  ]);

  const credentialsVerified = verifiedCredCount > 0;

  // Calculate helpful rating (0-100%)
  const totalVotes = answers.reduce(
    (sum, a) => sum + a.helpfulCount + a.notHelpfulCount,
    0
  );
  const helpfulVotes = answers.reduce((sum, a) => sum + a.helpfulCount, 0);
  const helpfulRating = totalVotes > 0 ? (helpfulVotes / totalVotes) * 100 : 0;

  // CME hours — placeholder until CMERecord model exists
  const cmeHours = 0;

  // Calculate component scores
  const scores = {
    credentialsVerified: credentialsVerified ? 1 : 0,
    answersGiven: logScale(answersCount, 50), // 50 answers = max
    helpfulRating: linearScale(helpfulRating, 100),
    cmeHours: linearScale(cmeHours, 30), // 30 hours/year = max
    casesReviewed: logScale(casesCompleted, 20), // 20 cases = max
    endorsementsReceived: logScale(endorsements, 10), // 10 endorsements = max
    profileViews90d: logScale(profileViews, 100), // 100 views/90d = max
  };

  // Weighted overall score
  const overallScore = Math.round(
    Object.entries(WEIGHTS).reduce((total, [key, weight]) => {
      return total + scores[key as keyof typeof scores] * weight;
    }, 0)
  );

  return {
    overallScore,
    answersGiven: answersCount,
    helpfulRating: Math.round(helpfulRating * 10) / 10,
    profileViews90d: profileViews,
    cmeHours,
    casesReviewed: casesCompleted,
    deploymentsCompleted,
    endorsementsReceived: endorsements,
    credentialsVerified,
  };
}

export async function updateReputationScore(userId: string): Promise<void> {
  const score = await calculateReputationScore(userId);

  await prisma.memberReputationScore.upsert({
    where: { userId },
    update: {
      ...score,
      lastCalculatedAt: new Date(),
    },
    create: {
      userId,
      ...score,
      lastCalculatedAt: new Date(),
    },
  });
}
