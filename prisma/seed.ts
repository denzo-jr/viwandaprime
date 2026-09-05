import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PIN = "1234";

function daysFromNow(n: number) {
  return new Date(Date.now() + n * 86_400_000);
}
function hoursAgo(n: number) {
  return new Date(Date.now() - n * 3_600_000);
}

async function main() {
  console.log("Clearing existing data…");
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.labourApplication.deleteMany();
  await prisma.labourJob.deleteMany();
  await prisma.wasteOrder.deleteMany();
  await prisma.wasteListing.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.machine.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.jobRequest.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash(PIN, 10);

  console.log("Creating users…");

  // ---- The three demo personas (landing page quick-login) -----------------
  const azania = await prisma.user.create({
    data: {
      name: "Neema Kileo",
      businessName: "Azania Plastics Ltd",
      phone: "+255754110001",
      passwordHash: hash,
      roles: "BUSINESS",
      region: "Dar es Salaam",
      district: "Ubungo",
      bio: "Plastic packaging manufacturer running three injection-moulding lines in Ubungo.",
      verified: true,
      rating: 4.8,
      ratingCount: 34,
      avatarColor: "#0ea5e9",
      walletBalance: 1_250_000,
    },
  });

  const juma = await prisma.user.create({
    data: {
      name: "Juma Mwakyusa",
      phone: "+255754110002",
      passwordHash: hash,
      roles: "TECHNICIAN",
      region: "Dar es Salaam",
      district: "Kinondoni",
      bio: "14 years on injection moulders, extruders and industrial chillers. I carry my own tools.",
      skills: "Hydraulics,Electrical,Refrigeration,PLC / Automation",
      hourlyRate: 25_000,
      yearsExperience: 14,
      verified: true,
      rating: 4.9,
      ratingCount: 87,
      avatarColor: "#f59e0b",
      walletBalance: 480_000,
    },
  });

  const rehema = await prisma.user.create({
    data: {
      name: "Rehema S. Mushi",
      phone: "+255754110003",
      passwordHash: hash,
      roles: "WORKER",
      region: "Dar es Salaam",
      district: "Ilala",
      bio: "Available for loading, packaging and warehouse shifts. Reliable, on time.",
      skills: "Loading,Packaging,Warehouse",
      verified: true,
      rating: 4.7,
      ratingCount: 52,
      avatarColor: "#a855f7",
      walletBalance: 96_000,
    },
  });

  // The project owner's real handset — kept in the seed so `db:reset` never
  // locks them out of the live USSD and SMS demo. All three roles so every
  // menu branch is reachable from one number.
  const owner = await prisma.user.create({
    data: {
      name: "Ikoba Tech",
      businessName: "IKOBA TECH",
      phone: "+255787400249",
      passwordHash: hash,
      roles: "BUSINESS,TECHNICIAN,WORKER",
      region: "Dar es Salaam",
      district: "Kinondoni",
      bio: "Industrial automation and control systems.",
      skills: "PLC / Automation,Electrical,Welding",
      hourlyRate: 30_000,
      yearsExperience: 7,
      verified: true,
      rating: 4.8,
      ratingCount: 19,
      avatarColor: "#00877d",
      walletBalance: 250_000,
    },
  });

  // ---- Supporting cast ----------------------------------------------------
  const technicians = await Promise.all(
    [
      {
        name: "Salum Hamisi",
        district: "Temeke",
        skills: "Welding,Diesel Engines,Boiler Maintenance",
        hourlyRate: 20_000,
        yearsExperience: 9,
        rating: 4.6,
        ratingCount: 41,
        bio: "Certified welder and boiler technician serving Temeke industrial area.",
      },
      {
        name: "Grace Mollel",
        district: "Kinondoni",
        skills: "CNC Machining,Milling & Grinding,PLC / Automation",
        hourlyRate: 32_000,
        yearsExperience: 11,
        rating: 4.9,
        ratingCount: 63,
        bio: "CNC specialist. I set up, program and repair machining centres.",
      },
      {
        name: "Baraka Nyerere",
        district: "Ilala",
        skills: "Generator Repair,Electrical,Conveyor Systems",
        hourlyRate: 18_000,
        yearsExperience: 6,
        rating: 4.4,
        ratingCount: 22,
        bio: "Generators and conveyor lines. Fast callout across Ilala and Kigamboni.",
      },
      {
        name: "Frank Massawe",
        district: "Ubungo",
        skills: "Pneumatics,Hydraulics,Welding",
        hourlyRate: 22_000,
        yearsExperience: 8,
        rating: 4.5,
        ratingCount: 30,
        bio: "Hydraulic press and pneumatic system repairs for food and plastics plants.",
      },
    ].map((t, i) =>
      prisma.user.create({
        data: {
          name: t.name,
          phone: `+25575422000${i + 1}`,
          passwordHash: hash,
          roles: "TECHNICIAN",
          region: "Dar es Salaam",
          district: t.district,
          bio: t.bio,
          skills: t.skills,
          hourlyRate: t.hourlyRate,
          yearsExperience: t.yearsExperience,
          verified: i < 3,
          rating: t.rating,
          ratingCount: t.ratingCount,
          avatarColor: ["#f59e0b", "#0ea5e9", "#22c55e", "#a855f7"][i % 4],
        },
      })
    )
  );

  const businesses = await Promise.all(
    [
      {
        name: "Hamid Rashid",
        businessName: "Kilimanjaro Millers",
        district: "Temeke",
        bio: "Maize and wheat milling, 40 tonnes a day.",
      },
      {
        name: "Anna Kimaro",
        businessName: "Tanga Textiles Co.",
        region: "Tanga",
        district: "Tanga City",
        bio: "Cotton spinning and dyeing since 1998.",
      },
      {
        name: "Emmanuel Shirima",
        businessName: "Mwanza Steel Works",
        region: "Mwanza",
        district: "Nyamagana",
        bio: "Structural steel fabrication for the lake zone.",
      },
      {
        name: "Zainab Ally",
        businessName: "Coastal Foods Processing",
        district: "Kigamboni",
        bio: "Fruit juice and cashew processing plant.",
      },
    ].map((b, i) =>
      prisma.user.create({
        data: {
          name: b.name,
          businessName: b.businessName,
          phone: `+25575433000${i + 1}`,
          passwordHash: hash,
          roles: "BUSINESS",
          region: b.region ?? "Dar es Salaam",
          district: b.district,
          bio: b.bio,
          verified: true,
          rating: 4.3 + i * 0.15,
          ratingCount: 12 + i * 7,
          avatarColor: ["#0ea5e9", "#22c55e", "#a855f7", "#f59e0b"][i % 4],
          walletBalance: 300_000 * (i + 1),
        },
      })
    )
  );

  const workers = await Promise.all(
    [
      { name: "Idd Mfaume", district: "Ilala", skills: "Loading,Construction" },
      { name: "Mariam Juma", district: "Ubungo", skills: "Packaging,Cleaning" },
      { name: "Peter Msigwa", district: "Temeke", skills: "Warehouse,Assembly" },
      { name: "Halima Said", district: "Kinondoni", skills: "Packaging,Assembly" },
      { name: "John Mbwana", district: "Kigamboni", skills: "Loading,Warehouse" },
    ].map((w, i) =>
      prisma.user.create({
        data: {
          name: w.name,
          phone: `+25575444000${i + 1}`,
          passwordHash: hash,
          roles: "WORKER",
          region: "Dar es Salaam",
          district: w.district,
          skills: w.skills,
          bio: "Available for short-term industrial shifts.",
          rating: 4.1 + (i % 5) * 0.18,
          ratingCount: 8 + i * 5,
          avatarColor: ["#22c55e", "#a855f7", "#0ea5e9", "#f59e0b", "#22c55e"][i],
          walletBalance: 40_000 * (i + 1),
        },
      })
    )
  );

  const allTechs = [juma, ...technicians];

  // ---- FundiLink ----------------------------------------------------------
  console.log("Creating repair jobs…");

  const job1 = await prisma.jobRequest.create({
    data: {
      title: "Injection moulder losing clamp pressure",
      description:
        "Line 2 Haitian moulder drops clamping pressure mid-cycle and trips out. Started yesterday afternoon. We suspect the hydraulic pump or a leaking seal. Production on this line is stopped.",
      machineType: "Injection Moulding Machine",
      urgency: "URGENT",
      region: "Dar es Salaam",
      district: "Ubungo",
      budgetMin: 150_000,
      budgetMax: 400_000,
      status: "OPEN",
      businessId: azania.id,
      createdAt: hoursAgo(5),
    },
  });

  await prisma.quote.createMany({
    data: [
      {
        jobId: job1.id,
        technicianId: juma.id,
        price: 280_000,
        etaHours: 3,
        message:
          "Sounds like the pump relief valve. I have handled this exact fault on Haitian machines. I can be on site in 3 hours with seals and gauges.",
        status: "PENDING",
        createdAt: hoursAgo(4),
      },
      {
        jobId: job1.id,
        technicianId: technicians[3].id,
        price: 320_000,
        etaHours: 6,
        message:
          "I will pressure-test the full hydraulic circuit and replace the worn seals. Parts included.",
        status: "PENDING",
        createdAt: hoursAgo(2),
      },
    ],
  });

  const job2 = await prisma.jobRequest.create({
    data: {
      title: "Generator will not start after power cut",
      description:
        "100 kVA standby generator cranks but does not fire. We need it running before the next TANESCO outage.",
      machineType: "Diesel Generator",
      urgency: "NORMAL",
      region: "Dar es Salaam",
      district: "Temeke",
      budgetMin: 80_000,
      budgetMax: 200_000,
      status: "ASSIGNED",
      agreedPrice: 145_000,
      businessId: businesses[0].id,
      technicianId: technicians[2].id,
      createdAt: hoursAgo(30),
    },
  });

  await prisma.quote.create({
    data: {
      jobId: job2.id,
      technicianId: technicians[2].id,
      price: 145_000,
      etaHours: 12,
      message: "Likely fuel solenoid or blocked filters. I will bring spares.",
      status: "ACCEPTED",
      createdAt: hoursAgo(28),
    },
  });

  const job3 = await prisma.jobRequest.create({
    data: {
      title: "Conveyor belt misaligned on packing line",
      description:
        "Belt keeps drifting to the left and tearing at the edge. Needs roller alignment and possibly a new belt.",
      machineType: "Conveyor System",
      urgency: "NORMAL",
      region: "Dar es Salaam",
      district: "Kigamboni",
      budgetMin: 100_000,
      budgetMax: 250_000,
      status: "COMPLETED",
      agreedPrice: 180_000,
      businessId: businesses[3].id,
      technicianId: juma.id,
      createdAt: hoursAgo(96),
      completedAt: hoursAgo(60),
    },
  });

  await prisma.jobRequest.createMany({
    data: [
      {
        title: "Cold room compressor short-cycling",
        description:
          "The compressor on our fish cold room cuts in and out every two minutes. Temperature is climbing.",
        machineType: "Refrigeration Unit",
        urgency: "URGENT",
        region: "Dar es Salaam",
        district: "Ilala",
        budgetMin: 200_000,
        budgetMax: 500_000,
        status: "OPEN",
        businessId: businesses[3].id,
        createdAt: hoursAgo(9),
      },
      {
        title: "Dyeing machine temperature sensor faulty",
        description:
          "PLC reports a sensor error on the dye vat. Batches are coming out inconsistent.",
        machineType: "Textile Dyeing Machine",
        urgency: "NORMAL",
        region: "Tanga",
        district: "Tanga City",
        budgetMin: 120_000,
        budgetMax: 300_000,
        status: "OPEN",
        businessId: businesses[1].id,
        createdAt: hoursAgo(20),
      },
      {
        title: "Hammer mill bearing replacement",
        description:
          "Loud grinding noise from the main shaft bearing. We have the replacement bearing already.",
        machineType: "Hammer Mill",
        urgency: "LOW",
        region: "Dar es Salaam",
        district: "Temeke",
        budgetMin: 60_000,
        budgetMax: 150_000,
        status: "OPEN",
        businessId: businesses[0].id,
        createdAt: hoursAgo(44),
      },
    ],
  });

  // ---- MachineShare -------------------------------------------------------
  console.log("Creating machine listings…");

  const machineData = [
    {
      name: "Hydraulic Press Brake 100T",
      category: "Machinery",
      kind: "RENT",
      description:
        "100-tonne press brake with 3.2 m bed. Ideal for sheet metal bending. Operator can be arranged.",
      condition: "GOOD",
      price: 180_000,
      priceUnit: "DAY",
      district: "Kinondoni",
      ownerId: businesses[2].id,
      imageEmoji: "PRESS",
    },
    {
      name: "Diesel Generator 100 kVA",
      category: "Machinery",
      kind: "RENT",
      description:
        "Perkins standby generator, low hours, delivered and installed on site.",
      condition: "GOOD",
      price: 250_000,
      priceUnit: "DAY",
      district: "Ubungo",
      ownerId: azania.id,
      imageEmoji: "GEN",
    },
    {
      name: "Forklift 2.5T",
      category: "Vehicles",
      kind: "RENT",
      description: "Toyota diesel forklift, 2.5 tonne capacity, 3 m lift.",
      condition: "GOOD",
      price: 120_000,
      priceUnit: "DAY",
      district: "Ilala",
      ownerId: businesses[0].id,
      imageEmoji: "FORK",
    },
    {
      name: "Injection Moulder Screw & Barrel Set",
      category: "Spare Parts",
      kind: "SALE",
      description:
        "Spare screw and barrel assembly, 80 mm, fits most Haitian and Chen Hsong machines. Unused.",
      condition: "NEW",
      price: 3_400_000,
      priceUnit: "ITEM",
      district: "Ubungo",
      ownerId: azania.id,
      imageEmoji: "PART",
    },
    {
      name: "Industrial Air Compressor 500L",
      category: "Machinery",
      kind: "RENT",
      description: "Screw compressor, 10 bar, 500 litre receiver. Weekly rate.",
      condition: "FAIR",
      price: 600_000,
      priceUnit: "WEEK",
      district: "Temeke",
      ownerId: businesses[0].id,
      imageEmoji: "AIR",
    },
    {
      name: "Welding Plant 400A + Accessories",
      category: "Tools",
      kind: "RENT",
      description:
        "MIG/MMA welding plant with cables, helmet and trolley. Great for short fabrication jobs.",
      condition: "GOOD",
      price: 45_000,
      priceUnit: "DAY",
      district: "Nyamagana",
      region: "Mwanza",
      ownerId: businesses[2].id,
      imageEmoji: "WELD",
    },
    {
      name: "Conveyor Rollers (set of 40)",
      category: "Spare Parts",
      kind: "SALE",
      description: "Galvanised gravity rollers, 600 mm wide. Surplus stock.",
      condition: "GOOD",
      price: 890_000,
      priceUnit: "ITEM",
      district: "Kigamboni",
      ownerId: businesses[3].id,
      imageEmoji: "ROLL",
    },
    {
      name: "Concrete Mixer 350L",
      category: "Machinery",
      kind: "RENT",
      description: "Diesel concrete mixer for site work. Trailer mounted.",
      condition: "GOOD",
      price: 65_000,
      priceUnit: "DAY",
      district: "Tanga City",
      region: "Tanga",
      ownerId: businesses[1].id,
      imageEmoji: "MIX",
    },
  ];

  const machines = [];
  for (const m of machineData) {
    machines.push(
      await prisma.machine.create({
        data: {
          name: m.name,
          category: m.category,
          kind: m.kind,
          description: m.description,
          condition: m.condition,
          price: m.price,
          priceUnit: m.priceUnit,
          region: m.region ?? "Dar es Salaam",
          district: m.district,
          imageEmoji: m.imageEmoji,
          ownerId: m.ownerId,
        },
      })
    );
  }

  await prisma.booking.create({
    data: {
      machineId: machines[2].id,
      renterId: azania.id,
      startDate: daysFromNow(2),
      endDate: daysFromNow(5),
      days: 3,
      totalPrice: 360_000,
      status: "CONFIRMED",
    },
  });

  // ---- TakaTrade ----------------------------------------------------------
  console.log("Creating waste listings…");

  const wasteData = [
    {
      title: "HDPE regrind, clean, natural colour",
      material: "HDPE Regrind",
      category: "Plastic",
      description:
        "Post-industrial HDPE from bottle trimmings, washed and granulated. Consistent melt flow, no contamination.",
      quantity: 4200,
      unit: "KG",
      pricePerUnit: 850,
      district: "Ubungo",
      sellerId: azania.id,
    },
    {
      title: "Mild steel offcuts and drops",
      material: "Mild Steel Scrap",
      category: "Metal",
      description:
        "Plate and box-section offcuts from fabrication. Sorted, no galvanised material.",
      quantity: 12,
      unit: "TONNE",
      pricePerUnit: 720_000,
      district: "Nyamagana",
      region: "Mwanza",
      sellerId: businesses[2].id,
    },
    {
      title: "Cotton yarn waste and sweepings",
      material: "Cotton Waste",
      category: "Textile",
      description:
        "Spinning waste suitable for wiping cloth, mattress filling or recycled yarn.",
      quantity: 1800,
      unit: "KG",
      pricePerUnit: 380,
      district: "Tanga City",
      region: "Tanga",
      sellerId: businesses[1].id,
    },
    {
      title: "Cashew nut shells (biomass fuel)",
      material: "Cashew Shell",
      category: "Organic",
      description:
        "High calorific value shells, ideal as boiler fuel or for CNSL extraction. Dry and bagged.",
      quantity: 9,
      unit: "TONNE",
      pricePerUnit: 210_000,
      district: "Kigamboni",
      sellerId: businesses[3].id,
    },
    {
      title: "Maize bran and milling dust",
      material: "Maize Bran",
      category: "Organic",
      description:
        "By-product of maize milling. Popular with animal feed producers. Collected weekly.",
      quantity: 6500,
      unit: "KG",
      pricePerUnit: 420,
      district: "Temeke",
      sellerId: businesses[0].id,
    },
    {
      title: "Hardwood pallet offcuts",
      material: "Wood Offcuts",
      category: "Wood",
      description:
        "Broken pallets and timber offcuts. Good for briquetting, furniture or firewood.",
      quantity: 3000,
      unit: "KG",
      pricePerUnit: 160,
      district: "Ilala",
      sellerId: businesses[0].id,
    },
    {
      title: "PET bottle flake, hot-washed",
      material: "PET Flake",
      category: "Plastic",
      description: "Clear PET flake, washed and dried, under 50 ppm PVC.",
      quantity: 2400,
      unit: "KG",
      pricePerUnit: 1_150,
      district: "Ubungo",
      sellerId: azania.id,
    },
    {
      title: "Aluminium turnings from machining",
      material: "Aluminium Swarf",
      category: "Metal",
      description: "Clean dry turnings, oil separated. Sold by the tonne.",
      quantity: 3.5,
      unit: "TONNE",
      pricePerUnit: 2_900_000,
      district: "Kinondoni",
      sellerId: businesses[2].id,
    },
  ];

  const WASTE_CODE: Record<string, string> = {
    Metal: "MTL",
    Plastic: "PLA",
    Textile: "TEX",
    Organic: "ORG",
    Wood: "WD",
    Glass: "GLS",
    Chemical: "CHM",
  };

  const wasteListings = [];
  for (const w of wasteData) {
    wasteListings.push(
      await prisma.wasteListing.create({
        data: {
          title: w.title,
          material: w.material,
          category: w.category,
          description: w.description,
          quantity: w.quantity,
          unit: w.unit,
          pricePerUnit: w.pricePerUnit,
          region: w.region ?? "Dar es Salaam",
          district: w.district,
          sellerId: w.sellerId,
          imageEmoji: WASTE_CODE[w.category] ?? "MAT",
        },
      })
    );
  }

  // ---- KibaruaPay ---------------------------------------------------------
  console.log("Creating labour jobs…");

  const labour1 = await prisma.labourJob.create({
    data: {
      title: "Container offloading — 2 days",
      description:
        "Offload two 40 ft containers of raw material into the warehouse. Manual handling, 25 kg sacks. Gloves and boots provided.",
      category: "Loading",
      workersNeeded: 8,
      payRate: 22_000,
      payUnit: "DAY",
      durationDays: 2,
      startDate: daysFromNow(1),
      region: "Dar es Salaam",
      district: "Ubungo",
      status: "OPEN",
      businessId: azania.id,
      createdAt: hoursAgo(6),
    },
  });

  await prisma.labourApplication.createMany({
    data: [
      {
        jobId: labour1.id,
        workerId: rehema.id,
        message: "I am available both days and I live 10 minutes away.",
        status: "ACCEPTED",
        createdAt: hoursAgo(5),
      },
      {
        jobId: labour1.id,
        workerId: workers[0].id,
        message: "Ready to start tomorrow morning.",
        status: "PENDING",
        createdAt: hoursAgo(4),
      },
      {
        jobId: labour1.id,
        workerId: workers[4].id,
        message: "I have done container work at the port for 3 years.",
        status: "PENDING",
        createdAt: hoursAgo(2),
      },
    ],
  });

  await prisma.labourJob.createMany({
    data: [
      {
        title: "Packaging line assistants — night shift",
        description:
          "Pack finished juice cartons into cases and palletise. 6pm to 2am, meals provided.",
        category: "Packaging",
        workersNeeded: 6,
        payRate: 18_000,
        payUnit: "DAY",
        durationDays: 5,
        startDate: daysFromNow(3),
        region: "Dar es Salaam",
        district: "Kigamboni",
        status: "OPEN",
        businessId: businesses[3].id,
        createdAt: hoursAgo(14),
      },
      {
        title: "Factory deep clean after maintenance shutdown",
        description:
          "Clean machine bays, remove oil residue and clear the yard. Cleaning materials supplied.",
        category: "Cleaning",
        workersNeeded: 10,
        payRate: 20_000,
        payUnit: "DAY",
        durationDays: 3,
        startDate: daysFromNow(6),
        region: "Dar es Salaam",
        district: "Temeke",
        status: "OPEN",
        businessId: businesses[0].id,
        createdAt: hoursAgo(26),
      },
      {
        title: "Steel frame assembly helpers",
        description:
          "Assist welders with positioning and clamping steel frames. Some experience preferred.",
        category: "Assembly",
        workersNeeded: 4,
        payRate: 3_000,
        payUnit: "HOUR",
        durationDays: 7,
        startDate: daysFromNow(2),
        region: "Mwanza",
        district: "Nyamagana",
        status: "OPEN",
        businessId: businesses[2].id,
        createdAt: hoursAgo(38),
      },
      {
        title: "Warehouse stock count",
        description:
          "Two-day physical stock count across three stores. Reading and writing required.",
        category: "Warehouse",
        workersNeeded: 5,
        payRate: 25_000,
        payUnit: "DAY",
        durationDays: 2,
        startDate: daysFromNow(9),
        region: "Tanga",
        district: "Tanga City",
        status: "OPEN",
        businessId: businesses[1].id,
        createdAt: hoursAgo(50),
      },
    ],
  });

  // ---- Money & reputation -------------------------------------------------
  console.log("Creating payments, reviews and notifications…");

  await prisma.payment.create({
    data: {
      reference: "VP-JOB-DEMO01",
      amount: 180_000,
      method: "MPESA",
      purpose: "JOB",
      status: "RELEASED",
      fromUserId: businesses[3].id,
      toUserId: juma.id,
      jobId: job3.id,
      createdAt: hoursAgo(90),
      releasedAt: hoursAgo(58),
    },
  });

  await prisma.payment.create({
    data: {
      reference: "VP-JOB-DEMO02",
      amount: 145_000,
      method: "TIGOPESA",
      purpose: "JOB",
      status: "HELD_IN_ESCROW",
      fromUserId: businesses[0].id,
      toUserId: technicians[2].id,
      jobId: job2.id,
      createdAt: hoursAgo(27),
    },
  });

  await prisma.review.createMany({
    data: [
      {
        rating: 5,
        comment:
          "Juma arrived within two hours and had the line running the same evening. Very professional.",
        context: "FundiLink",
        authorId: businesses[3].id,
        subjectId: juma.id,
        createdAt: hoursAgo(56),
      },
      {
        rating: 5,
        comment: "Rehema worked hard and never needed supervision. Will hire again.",
        context: "KibaruaPay",
        authorId: azania.id,
        subjectId: rehema.id,
        createdAt: hoursAgo(200),
      },
      {
        rating: 4,
        comment: "Good quality regrind, delivered on time.",
        context: "TakaTrade",
        authorId: businesses[1].id,
        subjectId: azania.id,
        createdAt: hoursAgo(300),
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        to: azania.phone,
        userId: azania.id,
        channel: "SMS",
        message:
          "Viwanda Prime: Juma Mwakyusa quoted TSh 280,000 for 'Injection moulder losing clamp pressure'. Open the app to accept.",
        createdAt: hoursAgo(4),
      },
      {
        to: juma.phone,
        userId: juma.id,
        channel: "SMS",
        message:
          "Viwanda Prime: New URGENT job near you in Ubungo — Injection moulder losing clamp pressure. Budget TSh 150,000-400,000.",
        createdAt: hoursAgo(5),
      },
      {
        to: rehema.phone,
        userId: rehema.id,
        channel: "SMS",
        message:
          "Viwanda Prime: You have been accepted for 'Container offloading - 2 days' at Azania Plastics Ltd. Starts tomorrow.",
        createdAt: hoursAgo(5),
      },
      {
        to: juma.phone,
        userId: juma.id,
        channel: "SMS",
        message:
          "Viwanda Prime: TSh 180,000 has been released to you (VP-JOB-DEMO01). Asante kwa kazi nzuri.",
        createdAt: hoursAgo(58),
      },
    ],
  });

  const counts = {
    users: await prisma.user.count(),
    jobs: await prisma.jobRequest.count(),
    machines: await prisma.machine.count(),
    waste: await prisma.wasteListing.count(),
    labour: await prisma.labourJob.count(),
  };
  console.log("Seed complete:", counts);
  console.log(`All demo accounts use PIN ${PIN}`);
  console.log(`Owner handset ${owner.phone} is registered for live USSD/SMS.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
