// Dev helper: mint a session cookie for smoke-testing authenticated routes.
import { SignJWT } from "jose";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const phone = process.argv[2] ?? "+255754110001";
const u = await prisma.user.findUnique({ where: { phone } });
if (!u) { console.error("no user", phone); process.exit(1); }
const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "viwanda-prime-hackathon-secret-change-in-production");
const t = await new SignJWT({ sub: u.id }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("30d").sign(secret);
console.log(t);
await prisma.$disconnect();
