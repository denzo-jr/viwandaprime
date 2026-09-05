import Link from "next/link";
import { redirect } from "next/navigation";
import { MapPin, Phone, LogOut, Wallet } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logoutAction } from "@/app/actions/auth";
import { csv, tzs, timeAgo } from "@/lib/format";
import BottomNav from "@/components/BottomNav";
import { Avatar, Pill, SectionTitle, Stars, StatusTag } from "@/components/ui";

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const [payments, jobsPosted, machines, listings, applications] =
    await Promise.all([
      prisma.payment.findMany({
        where: { OR: [{ fromUserId: user.id }, { toUserId: user.id }] },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { fromUser: true, toUser: true },
      }),
      prisma.jobRequest.count({ where: { businessId: user.id } }),
      prisma.machine.count({ where: { ownerId: user.id } }),
      prisma.wasteListing.count({ where: { sellerId: user.id } }),
      prisma.labourApplication.count({ where: { workerId: user.id } }),
    ]);

  const roles = csv(user.roles);

  return (
    <main className="with-nav">
      <header className="pad pt-8 pb-5 text-center">
        <div className="flex justify-center">
          <Avatar name={user.name} color={user.avatarColor} size={76} />
        </div>
        <h1 className="display text-xl mt-3">
          {user.businessName ?? user.name}
        </h1>
        {user.businessName ? (
          <p className="text-sm text-[var(--color-mist)] mt-0.5">{user.name}</p>
        ) : null}
        <div className="flex justify-center mt-2">
          <Stars rating={user.rating} count={user.ratingCount} />
        </div>
        <div className="flex flex-wrap justify-center gap-2 mt-3">
          {roles.map((r) => (
            <Pill key={r} color="#f59e0b">
              {r.toLowerCase()}
            </Pill>
          ))}
          {user.verified ? <Pill color="#22c55e">verified</Pill> : null}
        </div>
      </header>

      <section className="pad">
        <div className="card p-4" style={{ borderColor: "#f59e0b44" }}>
          <div className="flex items-center gap-2">
            <Wallet size={16} style={{ color: "#f59e0b" }} />
            <p className="text-xs text-[var(--color-mist)]">Wallet balance</p>
          </div>
          <p className="display text-3xl mt-1.5" style={{ color: "#f59e0b" }}>
            {tzs(user.walletBalance)}
          </p>
          <p className="text-xs text-[var(--color-mist)] mt-1.5 leading-relaxed">
            Withdraw to {user.phone} on M-Pesa, Mixx, Airtel Money or HaloPesa.
          </p>
        </div>
      </section>

      <section className="pad mt-5">
        <div className="card p-4 flex flex-col gap-3">
          <span className="text-sm inline-flex items-center gap-2">
            <MapPin size={15} className="text-[var(--color-mist)]" />
            {user.district}, {user.region}
          </span>
          <span className="text-sm inline-flex items-center gap-2">
            <Phone size={15} className="text-[var(--color-mist)]" />
            {user.phone}
          </span>
        </div>
      </section>

      <section className="pad mt-6">
        <SectionTitle>Your activity</SectionTitle>
        <div className="grid grid-cols-4 gap-2">
          {[
            { n: jobsPosted, l: "repairs", href: "/fundilink?tab=mine" },
            { n: machines, l: "machines", href: "/machineshare" },
            { n: listings, l: "materials", href: "/takatrade" },
            { n: applications, l: "applied", href: "/kibaruapay?tab=applications" },
          ].map((s) => (
            <Link key={s.l} href={s.href} className="card p-3 text-center">
              <p className="display text-lg">{s.n}</p>
              <p className="text-[0.62rem] text-[var(--color-mist)] mt-0.5">
                {s.l}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {csv(user.skills).length > 0 ? (
        <section className="pad mt-6">
          <SectionTitle>Skills</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {csv(user.skills).map((s) => (
              <Pill key={s} color="#f59e0b">
                {s}
              </Pill>
            ))}
          </div>
        </section>
      ) : null}

      {payments.length > 0 ? (
        <section className="pad mt-6">
          <SectionTitle>Payment history</SectionTitle>
          <div className="flex flex-col gap-2.5">
            {payments.map((p) => {
              const incoming = p.toUserId === user.id;
              const other = incoming ? p.fromUser : p.toUser;
              return (
                <div key={p.id} className="card p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">
                        {incoming ? "From" : "To"}{" "}
                        {other.businessName ?? other.name}
                      </p>
                      <p className="text-[0.68rem] text-[var(--color-mist)] font-mono mt-0.5">
                        {p.reference} · {p.method}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className="text-sm font-bold"
                        style={{ color: incoming ? "#22c55e" : "#e7eef6" }}
                      >
                        {incoming ? "+" : "−"}
                        {tzs(p.amount).replace("TSh ", "")}
                      </p>
                      <p className="text-[0.62rem] text-[var(--color-mist)]">
                        {timeAgo(p.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <StatusTag status={p.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="pad mt-8">
        <Link href="/inbox" className="btn btn-ghost w-full mb-3">
          SMS inbox
        </Link>
        <form action={logoutAction}>
          <button className="btn btn-ghost w-full" style={{ color: "#ef4444" }}>
            <LogOut size={17} /> Log out
          </button>
        </form>
      </section>

      <BottomNav />
    </main>
  );
}
