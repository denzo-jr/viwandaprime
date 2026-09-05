import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

/** The mobile edition opens directly into the app instead of the marketing site. */
export default async function MobileEntry() {
  const user = await currentUser();
  redirect(user ? "/home" : "/login");
}
