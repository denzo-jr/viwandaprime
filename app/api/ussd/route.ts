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
import { normalisePhone } from "@/lib/tz";
import { tzs } from "@/lib/format";
import { notify } from "@/lib/africastalking";

function con(body: string) {
  return new Response(`CON ${body}`, {
    headers: { "Content-Type": "text/plain" },
  });
}

function end(body: string) {
  return new Response(`END ${body}`, {
    headers: { "Content-Type": "text/plain" },
  });
}

const MACHINE_TYPES = [
  "Diesel Generator",
  "Water Pump",
  "Conveyor System",
  "Milling Machine",
  "Refrigeration Unit",
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
        `${machineType}\nUharaka (urgency):\n1. Uzalishaji umesimama (production stopped)\n2. Wiki hii (this week)\n3. Inaweza subiri (can wait)`
      );
    }

    const urgency = URGENCY_BY_KEY[rest[1]];
    if (!urgency) return end("Chaguo si sahihi. Invalid choice.");

    const job = await prisma.jobRequest.create({
      data: {
        title: `${machineType} fault reported by USSD`,
        description: `Reported from a feature phone via *384*7788#. ${user.name} needs a technician for a ${machineType.toLowerCase()}.`,
        machineType,
        urgency,
        region: user.region,
        district: user.district,
        businessId: user.id,
      },
    });

    const techs = await prisma.user.findMany({
      where: { roles: { contains: "TECHNICIAN" }, region: user.region },
      select: { id: true, phone: true },
    });

    await Promise.all(
      techs.map((t) =>
        notify({
          to: t.phone,
          userId: t.id,
          message: `Viwanda Prime: New ${urgency} job in ${user.district} - ${machineType}. Open the app to quote.`,
        })
      )
    );

    return end(
      `Ombi limepokelewa. Request received.\nRef: ${job.id.slice(-6).toUpperCase()}\n${techs.length} mafundi wamejulishwa (${techs.length} technicians alerted). Utapigiwa simu.`
    );
  }

  // ---- 2. Find work --------------------------------------------------------
  if (choice === "2") {
    const jobs = await prisma.labourJob.findMany({
      where: { status: "OPEN", region: user.region },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { business: true },
    });

    if (jobs.length === 0) return end("Hakuna kazi kwa sasa. No work available right now.");

    if (rest.length === 0) {
      return con(
        "Kazi zilizopo (available work):\n" +
          jobs
            .map(
              (j, i) =>
                `${i + 1}. ${j.title.slice(0, 26)} - ${tzs(j.payRate)}/${j.payUnit.toLowerCase()}`
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
      take: 5,
    });

    if (listings.length === 0) return end("Hakuna taka sokoni kwa sasa.");

    return end(
      "Bei za taka (material prices):\n" +
        listings
          .map(
            (l) =>
              `${l.material.slice(0, 18)}: ${tzs(l.pricePerUnit)}/${l.unit.toLowerCase()}`
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
