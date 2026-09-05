import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";

/**
 * Signed-in shell: a phone column with bottom tabs on mobile, a fixed sidebar
 * and wide canvas from 1024px up.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const unread = await prisma.notification.count({
    where: { userId: user.id },
  });

  return (
    <>
      <Sidebar
        name={user.businessName ?? user.name}
        wallet={user.walletBalance}
        color={user.avatarColor}
        unread={unread}
      />
      <div className="shell">
        <div className="canvas">{children}</div>
      </div>
      <BottomNav />
    </>
  );
}
