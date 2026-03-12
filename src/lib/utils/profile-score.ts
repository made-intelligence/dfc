interface ProfileScoreInput {
  name: boolean;
  phone: boolean;
  profileImage: boolean;
  bio: boolean;           // min 50 chars
  specialty: boolean;
  institution: boolean;
  country: boolean;
  credentials: number;    // count of VERIFIED credentials
  endorsements: number;   // count of endorsements received
  whatsappOptIn: boolean;
}

export function calculateProfileScore(input: ProfileScoreInput): number {
  let score = 0;
  if (input.name)          score += 10;
  if (input.phone)         score += 5;
  if (input.profileImage)  score += 10;
  if (input.bio)           score += 10;
  if (input.specialty)     score += 10;
  if (input.institution)   score += 10;
  if (input.country)       score += 5;
  score += Math.min(input.credentials * 15, 30);
  score += Math.min(input.endorsements * 5, 10);
  return Math.min(score, 100);
}

export function getProfileScoreLabel(score: number): string {
  if (score >= 90) return "Complete";
  if (score >= 70) return "Strong";
  if (score >= 50) return "Good";
  if (score >= 30) return "Basic";
  return "Incomplete";
}

export function getProfileScoreColor(score: number): string {
  if (score >= 90) return "text-green-700 bg-green-50";
  if (score >= 70) return "text-blue-700 bg-blue-50";
  if (score >= 50) return "text-amber-700 bg-amber-50";
  return "text-red-700 bg-red-50";
}
