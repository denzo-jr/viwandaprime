import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import BottomNav from "@/components/BottomNav";

/** Mobile-only signed-in shell. It intentionally never expands to the desktop sidebar. */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");

  return (
    <>
      <div className="mobile-shell">
        <div className="mobile-canvas">{children}</div>
      </div>
      <BottomNav />
    </>
  );
}
