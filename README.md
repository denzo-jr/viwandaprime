# Viwanda Prime

Viwanda Prime is a digital industrial marketplace built for Tanzania. It connects small and medium-sized industrial businesses with the technicians, machinery, spare parts, materials, and labour they need to keep production moving.

## The Problem

Industrial businesses in Tanzania often struggle to:

- Find a qualified technician when a machine breaks down.
- Access expensive heavy-duty machinery without buying it outright.
- Source spare parts quickly and reliably.
- Turn industrial waste into useful raw materials.
- Find trusted manual labour for short-term industrial jobs.

These gaps lead to production delays, high operating costs, wasted materials, and fewer opportunities for workers and small businesses.

## Our Solution

Viwanda Prime brings these services together in one platform.

### 1. FundiLink — Technicians on Demand

When a machine develops a problem, a business can describe the issue, find available technicians nearby, compare their skills and ratings, and request assistance. Technicians can build profiles, receive jobs, and grow their businesses.

### 2. MachineShare — Rent Machinery and Spare Parts

Businesses can list idle machinery and spare parts for rent or sale. Other businesses can search for what they need and access heavy-duty equipment without the cost of ownership.

### 3. TakaTrade — Industrial Waste Marketplace

Factories and workshops can list industrial waste, by-products, and reusable materials. SMEs can discover and purchase these materials as affordable raw inputs instead of relying only on new resources.

### 4. KibaruaPay — Flexible Industrial Labour

Businesses can post short-term manual work and find available workers. Workers can discover nearby opportunities, build work histories, and receive secure, trackable payments.

## How It Works

1. A business creates a request, listing, or job.
2. Viwanda Prime matches it with relevant technicians, equipment, materials, or workers.
3. Both parties review the details, price, location, and availability.
4. They complete the transaction and leave feedback.

## Why Tanzania

Tanzania's growing manufacturing and SME sectors need practical ways to share resources, reduce downtime, and create stronger connections between industrial businesses. Viwanda Prime is designed around local needs: nearby services, affordable access, resource reuse, and more opportunities for skilled and manual workers.

## Expected Impact

- Reduce machine downtime for industrial businesses.
- Make machinery and spare parts more affordable through sharing.
- Create new value from industrial waste.
- Connect workers to more reliable short-term employment.
- Strengthen Tanzania's manufacturing and SME ecosystem.

## Hackathon Vision

Viwanda Prime aims to become the operating marketplace for Tanzania's industrial economy — helping every machine get fixed, every useful asset get shared, every reusable material find a buyer, and every worker find a fair opportunity.

---

## Running it

```bash
npm install
npx prisma db push     # creates prisma/dev.db (SQLite)
npm run db:seed        # loads demo businesses, fundis, workers and listings
npm run dev            # http://localhost:3000
```

Every seeded account uses PIN **1234**. The landing page has one-tap logins for
the three demo personas:

| Persona | Phone | Role |
| --- | --- | --- |
| Azania Plastics Ltd (Neema Kileo) | `0754 110 001` | Business |
| Juma Mwakyusa | `0754 110 002` | Technician |
| Rehema S. Mushi | `0754 110 003` | Worker |

`npm run db:reset` wipes and re-seeds if a demo goes sideways.

## Architecture

- **Next.js 16** (App Router, server components, server actions) + TypeScript
- **SQLite via Prisma** — one file, zero setup, no network needed at demo time
- **Tailwind v4** with a phone-first shell capped at 34rem
- Auth is phone + PIN, bcrypt-hashed, with a signed JWT in an httpOnly cookie

```
app/
  actions/       server actions, one file per module
  fundilink/     repair jobs, quotes, technician profiles
  machineshare/  machinery & spare-part listings, bookings
  takatrade/     industrial waste listings and orders
  kibaruapay/    labour jobs, applications, payouts
  api/ussd/      Africa's Talking USSD webhook
lib/
  payments.ts        escrow: hold -> release
  africastalking.ts  SMS/USSD adapter
```

## Money: escrow, not promises

Nobody gets paid on trust. When a business accepts a quote, hires a worker or
buys material, the money is captured and **held in escrow**. It is only released
to the technician, worker or seller when the buyer confirms the work is done —
at which point the earner's wallet is credited and both sides get an SMS.

This is the same flow in all four modules (`lib/payments.ts`).

## Smart repair dispatch

FundiLink now ranks nearby technicians using machine-skill overlap, district,
availability, verification, rating, experience, and completed-job signals. The
same ranking powers both the app and the USSD journey, where a business can pick
one of the top three matches or alert everyone.

Once assigned, every repair has an auditable field timeline:
`CREATED → MATCHING → TECHNICIAN FOUND → ACCEPTED → EN ROUTE → ARRIVED → REPAIRING → COMPLETED → CONFIRMED`.
Key updates trigger SMS notifications, and escrow can only be released after the
technician marks the repair complete and the business confirms the machine runs.
The original reporting channel (`APP`, `WEB`, or `USSD`) is retained on the job.

## USSD — the 60% without smartphones

Most fundis and casual workers in Tanzania are on feature phones, so the
marketplace also runs on USSD. `POST /api/ussd` implements the Africa's Talking
contract exactly (`sessionId`, `serviceCode`, `phoneNumber`, `text` in;
`CON `/`END ` out), so pointing a real service code at it needs no code changes.

Dial `*384*7788#`:

```
1. Ripoti hitilafu    report a breakdown, alerts every technician in the region
2. Tafuta kazi        browse and apply for labour jobs
3. Bei za taka        current material prices
4. Salio langu        wallet balance and money in escrow
```

Try it in-app at `/ussd` — the simulator posts to that same endpoint.

## Africa's Talking

Notifications run through one adapter (`lib/africastalking.ts`). With no API key
it runs in **simulator mode**: every message is stored and shown in the in-app
SMS inbox (`/inbox`), so the product demos fully offline.

To go live, set the credentials in `.env`:

```
AT_USERNAME="your-username"
AT_API_KEY="your-api-key"
AT_SENDER_ID="VIWANDA"
```

Nothing else changes — every module calls `notify()`, and the same adapter then
posts to the real messaging endpoint.
