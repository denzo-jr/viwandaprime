import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MODULES } from "@/lib/tz";
import { demoLoginAction } from "./actions/auth";
import { Avatar } from "@/components/ui";

export default async function Landing() {
  if (await currentUser()) redirect("/home");

  const demoUsers = await prisma.user.findMany({
    where: { phone: { in: ["+255754110001", "+255754110002", "+255754110003"] } },
    orderBy: { phone: "asc" },
  });

  return (
    <main className="pad pt-14 pb-12">
      <div className="rise">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-xl grid place-items-center display text-lg"
            style={{ background: "#f59e0b", color: "#1a1205" }}
          >
            V
          </div>
          <span className="display text-lg tracking-tight">Viwanda Prime</span>
        </div>

        <h1 className="display text-[2.6rem] leading-[1.05] mt-9">
          Tanzania&rsquo;s{" "}
          <span style={{ color: "#f59e0b" }}>industrial</span> marketplace.
        </h1>
        <p className="text-[var(--color-mist)] mt-4 leading-relaxed">
          Every machine gets fixed. Every idle asset gets shared. Every reusable
          material finds a buyer. Every worker finds fair work.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        {MODULES.map((m, i) => (
          <div
            key={m.slug}
            className="card p-4 rise"
            style={{
              animationDelay: `${100 + i * 70}ms`,
              borderColor: `${m.accent}33`,
            }}
          >
            <div
              className="w-8 h-1.5 rounded-full mb-3"
              style={{ background: m.accent }}
            />
            <p className="display text-sm" style={{ color: m.accent }}>
              {m.name}
            </p>
            <p className="text-xs text-[var(--color-mist)] mt-1 leading-snug">
              {m.tagline}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-9 flex flex-col gap-3">
        <Link href="/register" className="btn btn-primary w-full">
          Create free account <ArrowRight size={18} />
        </Link>
        <Link href="/login" className="btn btn-ghost w-full">
          I already have an account
        </Link>
      </div>

      {demoUsers.length > 0 ? (
        <section className="mt-10">
          <p className="text-xs font-bold tracking-widest text-[var(--color-mist)] uppercase">
            Judges — jump straight in
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {demoUsers.map((u) => (
              <form action={demoLoginAction} key={u.id}>
                <input type="hidden" name="phone" value={u.phone} />
                <button
                  type="submit"
                  className="card w-full p-3 flex items-center gap-3 text-left"
                >
                  <Avatar name={u.name} color={u.avatarColor} size={38} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold truncate">
                      {u.businessName ?? u.name}
                    </span>
                    <span className="block text-xs text-[var(--color-mist)] truncate">
                      {u.roles.split(",").join(" · ").toLowerCase()} ·{" "}
                      {u.district}
                    </span>
                  </span>
                  <ArrowRight size={16} className="text-[var(--color-mist)]" />
                </button>
              </form>
            ))}
          </div>
        </section>
      ) : null}

      <p className="mt-10 text-center text-xs text-[var(--color-mist)]">
        Built for Tanzania&rsquo;s SMEs · Mobile money ready
      </p>
    </main>
  );
}
