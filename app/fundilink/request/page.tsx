import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { createJobAction } from "@/app/actions/fundilink";
import { PageHeader } from "@/components/ui";
import { URGENCY } from "@/lib/tz";

const ACCENT = "#f59e0b";

const MACHINE_TYPES = [
  "Injection Moulding Machine",
  "Diesel Generator",
  "Conveyor System",
  "Refrigeration Unit",
  "Hammer Mill",
  "Air Compressor",
  "Boiler",
  "CNC Machine",
  "Packaging Machine",
  "Textile Dyeing Machine",
  "Water Pump",
  "Other",
];

export default async function RequestPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  return (
    <main className="pb-20">
      <PageHeader
        title="Report a breakdown"
        subtitle="Technicians nearby get an SMS instantly"
        back="/fundilink"
        accent={ACCENT}
      />

      <form action={createJobAction} className="pad flex flex-col gap-5 mt-2">
        <div>
          <label className="label" htmlFor="title">
            What is wrong?
          </label>
          <input
            id="title"
            name="title"
            className="field"
            placeholder="Injection moulder losing clamp pressure"
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="machineType">
            Machine
          </label>
          <select id="machineType" name="machineType" className="field" required>
            {MACHINE_TYPES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="description">
            Describe the fault
          </label>
          <textarea
            id="description"
            name="description"
            className="field"
            rows={5}
            placeholder="When did it start? What noises or error codes? Is production stopped?"
            required
          />
        </div>

        <div>
          <span className="label">How urgent?</span>
          <div className="grid grid-cols-3 gap-2">
            {URGENCY.map((u, i) => (
              <label
                key={u.id}
                className="card p-3 text-center cursor-pointer has-[:checked]:border-current"
                style={{ color: u.color }}
              >
                <input
                  type="radio"
                  name="urgency"
                  value={u.id}
                  defaultChecked={i === 1}
                  className="sr-only peer"
                />
                <span className="block text-xs font-semibold peer-checked:opacity-100 opacity-70">
                  {u.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="budgetMin">
              Budget from (TSh)
            </label>
            <input
              id="budgetMin"
              name="budgetMin"
              type="number"
              inputMode="numeric"
              className="field"
              placeholder="100000"
            />
          </div>
          <div>
            <label className="label" htmlFor="budgetMax">
              Budget to (TSh)
            </label>
            <input
              id="budgetMax"
              name="budgetMax"
              type="number"
              inputMode="numeric"
              className="field"
              placeholder="400000"
            />
          </div>
        </div>

        <div className="card p-3">
          <p className="text-xs text-[var(--color-mist)] leading-relaxed">
            Posting to <span className="text-[var(--color-chalk)] font-semibold">
              {user.district}, {user.region}
            </span>
            . Every technician in your region receives an SMS alert.
          </p>
        </div>

        <button className="btn btn-primary w-full">Post job & alert fundis</button>
      </form>
    </main>
  );
}
