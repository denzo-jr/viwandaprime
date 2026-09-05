import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { createListingAction } from "@/app/actions/takatrade";
import { PageHeader } from "@/components/ui";
import { WASTE_CATEGORIES } from "@/lib/tz";

const ACCENT = "#338346";

export default async function NewListingPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  return (
    <main className="pb-20">
      <PageHeader
        title="List material"
        subtitle="Your waste is another factory's input"
        back="/takatrade"
      />

      <form action={createListingAction} className="pad flex flex-col gap-5 mt-2 lg:max-w-2xl">
        <div>
          <label className="label" htmlFor="title">
            Listing title
          </label>
          <input
            id="title"
            name="title"
            className="field"
            placeholder="HDPE regrind, clean, natural colour"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="material">
              Material
            </label>
            <input
              id="material"
              name="material"
              className="field"
              placeholder="HDPE Regrind"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="category">
              Category
            </label>
            <select id="category" name="category" className="field">
              {WASTE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
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
            placeholder="Source, purity, whether it is washed or sorted, collection arrangements…"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="quantity">
              Quantity
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              inputMode="decimal"
              step="any"
              className="field"
              placeholder="4200"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="unit">
              Unit
            </label>
            <select id="unit" name="unit" className="field">
              <option value="KG">Kilograms</option>
              <option value="TONNE">Tonnes</option>
              <option value="LITRE">Litres</option>
              <option value="PIECE">Pieces</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="pricePerUnit">
            Price per unit (TSh)
          </label>
          <input
            id="pricePerUnit"
            name="pricePerUnit"
            type="number"
            inputMode="numeric"
            className="field"
            placeholder="850"
            required
          />
        </div>

        <div className="card p-3">
          <p className="text-xs text-[var(--color-mist)] leading-relaxed">
            Listing in{" "}
            <span className="text-[var(--color-chalk)] font-semibold">
              {user.district}, {user.region}
            </span>
            . Buyers arrange their own collection.
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
