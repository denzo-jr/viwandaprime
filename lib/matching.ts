import type { User } from "@prisma/client";

function tokens(value?: string | null) {
  return (value ?? "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((x) => x.length > 2);
}

export function technicianMatchScore({
  technician,
  machineType,
  district,
  urgent = false,
}: {
  technician: Pick<
    User,
    | "skills"
    | "district"
    | "available"
    | "verified"
    | "rating"
    | "ratingCount"
    | "yearsExperience"
  >;
  machineType: string;
  district?: string | null;
  urgent?: boolean;
}) {
  const machineTokens = tokens(machineType);
  const skillTokens = tokens(technician.skills);
  const skillHits = machineTokens.filter((t) =>
    skillTokens.some((s) => s.includes(t) || t.includes(s))
  ).length;

  const specialty = Math.min(36, skillHits * 18 + (skillHits > 0 ? 10 : 0));
  const location = district && technician.district === district ? 18 : 9;
  const availability = technician.available ? (urgent ? 22 : 18) : 0;
  const trust = (technician.verified ? 8 : 0) + Math.min(10, technician.rating * 2);
  const experience = Math.min(10, technician.yearsExperience ?? 0);
  const jobs = Math.min(6, Math.floor((technician.ratingCount ?? 0) / 10));

  return Math.min(99, Math.round(specialty + location + availability + trust + experience + jobs));
}

export function sortTechniciansByMatch<T extends Pick<User, "skills" | "district" | "available" | "verified" | "rating" | "ratingCount" | "yearsExperience">>(
  technicians: T[],
  machineType: string,
  district?: string | null,
  urgent = false
) {
  return technicians
    .map((technician) => ({
      technician,
      matchScore: technicianMatchScore({ technician, machineType, district, urgent }),
    }))
    .sort((a, b) => b.matchScore - a.matchScore);
}
