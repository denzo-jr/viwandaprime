/**
 * Africa's Talking USSD webhook.
 *
 * Implements the exact AT contract: it accepts form-encoded
 * `sessionId`, `serviceCode`, `phoneNumber`, `text` and replies with plain text
 * beginning `CON ` (keep session open) or `END ` (terminate).
 *
 * Point your Africa's Talking USSD service code at POST /api/ussd and the same
 * code that powers the in-app simulator serves real feature phones.
 */

import { prisma } from "@/lib/db";
import { normalisePhone, USSD_CODE } from "@/lib/tz";
import { tzs } from "@/lib/format";
import { notify } from "@/lib/africastalking";
import { sortTechniciansByMatch } from "@/lib/matching";

/**
 * Africa's Talking truncates or drops any USSD response over 182 characters,
 * including the CON/END prefix — the session then dies mid-flow with nothing
 * shown to the caller. Every response goes through `fit()` so that can never
 * happen, trimming whole lines first and only then hard-cutting.
 */
const USSD_MAX = 182;

const NL = String.fromCharCode(10);

function fit(prefix: "CON" | "END", body: string): string {
  const budget = USSD_MAX - prefix.length - 1;
  if (body.length <= budget) return `${prefix} ${body}`;

  // Drop whole menu lines before resorting to a hard cut.
  const lines = body.split(NL);
  while (lines.length > 1 && lines.join(NL).length > budget) lines.pop();

  let out = lines.join(NL);
  if (out.length > budget) out = out.slice(0, budget - 1).trimEnd() + "…";
  return `${prefix} ${out}`;
}

function con(body: string) {
  return new Response(fit("CON", body), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function end(body: string) {
  return new Response(fit("END", body), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

const MACHINE_TYPES = [
  "Diesel Generator",
  "Water Pump",
  "Conveyor System",
  "Milling Machine",
  "Refrigeration Unit",
];

// Kept short on purpose: USSD screens are tiny and capped at 182 characters.
const PROBLEMS = [
  "Haiwaki",
  "Joto kupita kiasi",
  "Uvujaji",
  "Sauti ya ajabu",
  "Nyingine",
];

const URGENCY_BY_KEY: Record<string, string> = {
  "1": "URGENT",
  "2": "NORMAL",
  "3": "LOW",
};

export async function POST(req: Request) {
  const form = await req.formData();
  const phoneNumber = normalisePhone(String(form.get("phoneNumber") ?? ""));
  const text = String(form.get("text") ?? "").trim();
  const parts = text === "" ? [] : text.split("*");

  const user = await prisma.user.findUnique({ where: { phone: phoneNumber } });

  if (!user) {
    return end(
      "Namba hii haijasajiliwa Viwanda Prime.\nThis number is not registered. Download the app or dial again after signing up."
    );
  }

  // Root menu
  if (parts.length === 0) {
    return con(
      `Karibu Viwanda Prime, ${user.name.split(" ")[0]}.\n` +
        "1. Ripoti hitilafu (report breakdown)\n" +
        "2. Tafuta kazi (find work)\n" +
        "3. Bei za taka (material prices)\n" +
        "4. Salio langu (my balance)"
    );
  }

  const [choice, ...rest] = parts;

  // ---- 1. Report a breakdown ----------------------------------------------
  if (choice === "1") {
    if (rest.length === 0) {
      return con(
        "Chagua mtambo (select machine):\n" +
          MACHINE_TYPES.map((m, i) => `${i + 1}. ${m}`).join("\n")
      );
    }

    const machineIndex = Number(rest[0]) - 1;
    const machineType = MACHINE_TYPES[machineIndex];
    if (!machineType) return end("Chaguo si sahihi. Invalid choice.");

    if (rest.length === 1) {
      return con(
        `${machineType}\nTatizo ni nini? (problem):\n` +
          PROBLEMS.map((problem, i) => `${i + 1}. ${problem}`).join("\n")
      );
    }

    const problem = PROBLEMS[Number(rest[1]) - 1];
    if (!problem) return end("Chaguo si sahihi. Invalid problem choice.");

    if (rest.length === 2) {
      return con(
        `Uharaka (urgency):\n1. Uzalishaji umesimama (production stopped)\n2. Wiki hii (this week)\n3. Inaweza subiri (can wait)`
      );
    }

    const urgency = URGENCY_BY_KEY[rest[2]];
    if (!urgency) return end("Chaguo si sahihi. Invalid choice.");

    const techs = await prisma.user.findMany({
      where: { roles: { contains: "TECHNICIAN" }, region: user.region },
      take: 12,
    });
    const ranked = sortTechniciansByMatch(
      techs,
      machineType,
      user.district,
      urgency === "URGENT"
    ).slice(0, 3);

    if (rest.length === 3) {
      if (ranked.length === 0) return end("Hakuna fundi aliyepatikana eneo lako kwa sasa.");
      return con(
        "Fundi bora wamepatikana:\n" +
          ranked
            .map(
              ({ technician, matchScore }, i) =>
                `${i + 1}. ${technician.name.split(" ")[0]} ${matchScore}% ${technician.district} ${technician.hourlyRate ? tzs(technician.hourlyRate) + "/hr" : ""}`
            )
            .join("\n") +
          "\n9. Tuma kwa mafundi wote"
      );
    }

    const picked = rest[3] === "9" ? null : ranked[Number(rest[3]) - 1]?.technician;
    if (rest[3] !== "9" && !picked) return end("Chaguo si sahihi. Invalid technician choice.");

    const job = await prisma.jobRequest.create({
      data: {
        title: `${machineType} fault reported by USSD`,
        description: `${problem}. Reported from a feature phone via ${USSD_CODE} by ${user.name}.`,
        machineType,
        urgency,
        region: user.region,
        district: user.district,
        businessId: user.id,
        technicianId: picked?.id,
        agreedPrice: picked?.hourlyRate ? picked.hourlyRate * 2 : undefined,
        status: picked ? "ASSIGNED" : "OPEN",
        source: "USSD",
        statusHistory: {
          create: [
            { status: "CREATED", note: "Breakdown received from USSD." },
            { status: "MATCHING", note: "Regional technicians ranked by skills, proximity and rating." },
            ...(picked
              ? [{ status: "TECHNICIAN_FOUND", note: `${picked.name} selected from USSD menu.` }]
              : []),
          ],
        },
      },
    });

    const notifyTargets = picked ? [picked] : techs;
    await Promise.all(
      notifyTargets.map((t) =>
        notify({
          to: t.phone,
          userId: t.id,
          message: `Viwanda Prime: New ${urgency} USSD job in ${user.district} - ${machineType}. Ref ${job.id.slice(-6).toUpperCase()}.`,
        })
      )
    );

    return end(
      `Ombi limepokelewa. Request received.\nRef: ${job.id.slice(-6).toUpperCase()}\n${picked ? `Fundi ${picked.name} amejulishwa.` : `${techs.length} mafundi wamejulishwa.`} Utapokea SMS.`
    );
  }

  // ---- 2. Find work --------------------------------------------------------
  if (choice === "2") {
    const jobs = await prisma.labourJob.findMany({
      where: { status: "OPEN", region: user.region },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { business: true },
    });

    if (jobs.length === 0) return end("Hakuna kazi kwa sasa. No work available right now.");

    if (rest.length === 0) {
      return con(
        "Kazi zilizopo (available work):\n" +
          jobs
            .map(
              (j, i) =>
                `${i + 1}. ${j.title.slice(0, 20)} ${tzs(j.payRate).replace("TSh ", "")}/${j.payUnit.slice(0, 3).toLowerCase()}`
            )
            .join("\n")
      );
    }

    const job = jobs[Number(rest[0]) - 1];
    if (!job) return end("Chaguo si sahihi. Invalid choice.");

    const existing = await prisma.labourApplication.findUnique({
      where: { jobId_workerId: { jobId: job.id, workerId: user.id } },
    });
    if (existing) {
      return end(`Tayari umeomba kazi hii. You already applied for "${job.title}".`);
    }

    await prisma.labourApplication.create({
      data: {
        jobId: job.id,
        workerId: user.id,
        message: "Applied via USSD from a feature phone.",
      },
    });

    await notify({
      to: job.business.phone,
      userId: job.businessId,
      message: `Viwanda Prime: ${user.name} applied for "${job.title}" via USSD. Open the app to review.`,
    });

    return end(
      `Ombi limetumwa! Application sent for "${job.title}" at ${job.business.businessName ?? job.business.name}. ${tzs(job.payRate)} kwa ${job.payUnit.toLowerCase()}.`
    );
  }

  // ---- 3. Material prices --------------------------------------------------
  if (choice === "3") {
    const listings = await prisma.wasteListing.findMany({
      where: { status: "AVAILABLE" },
      orderBy: { createdAt: "desc" },
      take: 4,
    });

    if (listings.length === 0) return end("Hakuna taka sokoni kwa sasa.");

    return end(
      "Bei za taka (material prices):\n" +
        listings
          .map(
            (l) =>
              `${l.material.slice(0, 16)}: ${tzs(l.pricePerUnit).replace("TSh ", "")}/${l.unit.slice(0, 3).toLowerCase()}`
          )
          .join("\n")
    );
  }

  // ---- 4. Balance ----------------------------------------------------------
  if (choice === "4") {
    const held = await prisma.payment.aggregate({
      where: { toUserId: user.id, status: "HELD_IN_ESCROW" },
      _sum: { amount: true },
    });

    return end(
      `Salio lako (your balance):\n${tzs(user.walletBalance)}\n` +
        `Escrow: ${tzs(held._sum.amount ?? 0)}\n` +
        "Toa pesa kupitia M-Pesa/Mixx/Airtel Money."
    );
  }

  return end("Chaguo si sahihi. Invalid choice.");
}
