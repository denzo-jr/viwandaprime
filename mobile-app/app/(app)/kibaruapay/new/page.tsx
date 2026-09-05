import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { createLabourJobAction } from "@/app/actions/kibaruapay";
import { PageHeader } from "@/components/ui";
import { LABOUR_CATEGORIES } from "@/lib/tz";

const ACCENT = "#7554b5";

export default async function NewLabourJobPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

  return (
    <main className="pb-20">
      <PageHeader
        title="Post work"
        subtitle="Workers nearby get an SMS instantly"
        back="/kibaruapay"
      />

      <form
        action={createLabourJobAction}
        className="pad flex flex-col gap-5 mt-2 lg:max-w-2xl"
      >
        <div>
          <label className="label" htmlFor="title">
            Job title
          </label>
          <input
            id="title"
            name="title"
            className="field"
            placeholder="Container offloading — 2 days"
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="category">
            Type of work
          </label>
          <select id="category" name="category" className="field">
            {LABOUR_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="description">
            What is the work?
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="field"
            placeholder="Tasks, shift times, whether protective equipment is provided…"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="payRate">
              Pay rate (TSh)
            </label>
            <input
              id="payRate"
              name="payRate"
              type="number"
              inputMode="numeric"
              className="field"
              placeholder="22000"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="payUnit">
              Per
            </label>
            <select id="payUnit" name="payUnit" className="field">
              <option value="DAY">Day</option>
              <option value="HOUR">Hour</option>
              <option value="TASK">Whole task</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="workersNeeded">
              Workers needed
            </label>
            <input
              id="workersNeeded"
              name="workersNeeded"
              type="number"
              inputMode="numeric"
              min={1}
              defaultValue={4}
              className="field"
            />
          </div>
          <div>
            <label className="label" htmlFor="durationDays">
              Days of work
            </label>
            <input
              id="durationDays"
              name="durationDays"
              type="number"
              inputMode="numeric"
              min={1}
              defaultValue={2}
              className="field"
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="startDate">
            Start date
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={tomorrow}
            className="field"
          />
        </div>

        <div className="card p-3">
          <p className="text-xs text-[var(--color-mist)] leading-relaxed">
            Posting to{" "}
            <span className="text-[var(--color-chalk)] font-semibold">
              {user.district}, {user.region}
            </span>
            . Pay is secured in escrow when you hire, and released when you
            confirm the work is done.
          </p>
        </div>

        <button
          className="btn w-full"
          style={{ background: ACCENT, color: "#ffffff" }}
        >
          Post job & alert workers
        </button>
      </form>
    </main>
  );
}
