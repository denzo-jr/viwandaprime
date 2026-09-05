import { notFound, redirect } from "next/navigation";
import { MapPin, Phone, Briefcase } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { csv, timeAgo, tzs } from "@/lib/format";
import { Avatar, PageHeader, Pill, SectionTitle, Stars, TechnicianPhoto } from "@/components/ui";

const ACCENT = "#ff7449";

export default async function TechnicianProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await currentUser())) redirect("/login");

  const { id } = await params;
  const tech = await prisma.user.findUnique({
    where: { id },
    include: {
      reviewsReceived: {
        include: { author: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      jobsTaken: { where: { status: "COMPLETED" } },
    },
  });
  if (!tech) notFound();

  return (
    <main className="pb-20">
      <PageHeader title="Fundi profile" back="/fundilink?tab=fundis" />

      <section className="pad">
        <div className="card p-3 text-center overflow-hidden">
          <TechnicianPhoto name={tech.name} featured />
          <div className="px-2 pb-2">
          <h2 className="display text-xl mt-4">{tech.name}</h2>
          {tech.verified ? (
            <span
              className="tag mt-2"
              style={{ background: "#33834622", color: "#338346" }}
            >
              Verified technician
            </span>
          ) : null}
          <div className="flex justify-center mt-3">
            <Stars rating={tech.rating} count={tech.ratingCount} />
          </div>

          {tech.bio ? (
            <p className="text-sm text-[var(--color-mist)] mt-4 leading-relaxed">
              {tech.bio}
            </p>
          ) : null}

          <div className="grid grid-cols-3 gap-2 mt-5 pt-5 border-t border-[var(--color-line)]">
            <div>
              <p className="display text-lg" style={{ color: ACCENT }}>
                {tech.yearsExperience ?? "—"}
              </p>
              <p className="text-[0.65rem] text-[var(--color-mist)] mt-0.5">
                years exp.
              </p>
            </div>
            <div>
              <p className="display text-lg" style={{ color: ACCENT }}>
                {tech.jobsTaken.length}
              </p>
              <p className="text-[0.65rem] text-[var(--color-mist)] mt-0.5">
                jobs done
              </p>
            </div>
            <div>
              <p className="display text-lg" style={{ color: ACCENT }}>
                {tech.hourlyRate ? tzs(tech.hourlyRate).replace("TSh ", "") : "—"}
              </p>
              <p className="text-[0.65rem] text-[var(--color-mist)] mt-0.5">
                per hour
              </p>
            </div>
          </div>
          </div>
        </div>
      </section>

      <section className="pad mt-5">
        <div className="card p-4 flex flex-col gap-3">
          <span className="text-sm inline-flex items-center gap-2">
            <MapPin size={15} className="text-[var(--color-mist)]" />
            {tech.district}, {tech.region}
          </span>
          <span className="text-sm inline-flex items-center gap-2">
            <Phone size={15} className="text-[var(--color-mist)]" />
            {tech.phone}
          </span>
          <span className="text-sm inline-flex items-center gap-2">
            <Briefcase size={15} className="text-[var(--color-mist)]" />
            {tech.available ? "Available for work" : "Currently busy"}
          </span>
        </div>
      </section>

      {csv(tech.skills).length > 0 ? (
        <section className="pad mt-6">
          <SectionTitle>Skills</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {csv(tech.skills).map((s) => (
              <Pill key={s} color={ACCENT}>
                {s}
              </Pill>
            ))}
          </div>
        </section>
      ) : null}

      {tech.reviewsReceived.length > 0 ? (
        <section className="pad mt-6">
          <SectionTitle>Reviews</SectionTitle>
          <div className="flex flex-col gap-3">
            {tech.reviewsReceived.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-center gap-2.5">
                  <Avatar
                    name={r.author.businessName ?? r.author.name}
                    color={r.author.avatarColor}
                    size={32}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">
                      {r.author.businessName ?? r.author.name}
                    </p>
                    <p className="text-[0.65rem] text-[var(--color-mist)]">
                      {timeAgo(r.createdAt)}
                    </p>
                  </div>
                  <span style={{ color: ACCENT }} className="text-xs">
                    {"★".repeat(r.rating)}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-mist)] mt-2.5 leading-relaxed">
                  {r.comment}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
