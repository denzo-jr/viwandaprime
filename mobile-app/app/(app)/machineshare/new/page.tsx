import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { createMachineAction } from "@/app/actions/machineshare";
import { PageHeader } from "@/components/ui";
import { MACHINE_CATEGORIES } from "@/lib/tz";

const ACCENT = "#3175b8";

export default async function NewMachinePage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  return (
    <main className="pb-20">
      <PageHeader
        title="List equipment"
        subtitle="Turn idle machines into income"
        back="/machineshare"
      />

      <form action={createMachineAction} className="pad flex flex-col gap-5 mt-2 lg:max-w-2xl">
        <div>
          <label className="label" htmlFor="name">
            What are you listing?
          </label>
          <input
            id="name"
            name="name"
            className="field"
            placeholder="Hydraulic Press Brake 100T"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="category">
              Category
            </label>
            <select id="category" name="category" className="field">
              {MACHINE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="condition">
              Condition
            </label>
            <select id="condition" name="condition" className="field">
              <option value="NEW">Brand new</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
            </select>
          </div>
        </div>

        <div>
          <span className="label">Rent or sell?</span>
          <div className="grid grid-cols-2 gap-2">
            <label className="card p-3 text-center cursor-pointer">
              <input
                type="radio"
                name="kind"
                value="RENT"
                defaultChecked
                className="sr-only peer"
              />
              <span className="block text-sm font-semibold peer-checked:text-[#3175b8]">
                Rent out
              </span>
            </label>
            <label className="card p-3 text-center cursor-pointer">
              <input type="radio" name="kind" value="SALE" className="sr-only peer" />
              <span className="block text-sm font-semibold peer-checked:text-[#338346]">
                Sell
              </span>
            </label>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="field"
            placeholder="Capacity, size, hours used, whether an operator is included…"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="price">
              Price (TSh)
            </label>
            <input
              id="price"
              name="price"
              type="number"
              inputMode="numeric"
              className="field"
              placeholder="180000"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="priceUnit">
              Per
            </label>
            <select id="priceUnit" name="priceUnit" className="field">
              <option value="DAY">Day</option>
              <option value="WEEK">Week</option>
              <option value="MONTH">Month</option>
              <option value="ITEM">Item (sale)</option>
            </select>
          </div>
        </div>

        <div className="card p-3">
          <p className="text-xs text-[var(--color-mist)] leading-relaxed">
            Listing in{" "}
            <span className="text-[var(--color-chalk)] font-semibold">
              {user.district}, {user.region}
            </span>
            .
          </p>
        </div>

        <button
          className="btn w-full"
          style={{ background: ACCENT, color: "#ffffff" }}
        >
          Publish listing
        </button>
      </form>
    </main>
  );
}
