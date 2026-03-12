export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    MEMBER: "Full Member",
    ASSOCIATE_MEMBER: "Associate Member",
    INTERNATIONAL_MEMBER: "International Member",
    HONORARY_MEMBER: "Honorary Member",
    LEGACY_MEMBER: "Legacy Member",
  };
  return labels[category] || category;
}

export function getDuesStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PAID: "Dues paid",
    WAIVED: "Dues waived",
    OUTSTANDING: "Dues outstanding",
    NOT_YET_DUE: "Not yet due",
  };
  return labels[status] || status;
}

export function getMemberStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: "Active",
    SUSPENDED: "Suspended",
    PENDING: "Pending verification",
    REVOKED: "Revoked",
  };
  return labels[status] || status;
}

export function formatDateLong(dateStr: string | Date | null): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function getExcoLabel(position: string): string {
  const labels: Record<string, string> = {
    PRESIDENT: "President",
    VICE_PRESIDENT: "Vice President",
    SECRETARY_GENERAL: "Secretary General",
    ASSISTANT_SECRETARY: "Assistant Secretary",
    TREASURER: "Treasurer",
    FINANCIAL_SECRETARY: "Financial Secretary",
    PRO: "Public Relations Officer",
    WELFARE: "Welfare Officer",
    PROVOST: "Provost",
    SOCIAL_SECRETARY: "Social Secretary",
    EX_OFFICIO: "Ex-Officio",
  };
  return labels[position] || position;
}

export function formatMonthYear(dateStr: string | Date | null): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}
