import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminDecision } from "./policy";
import { isAdminMember } from "./membership";

/** Call at each privileged data read or mutation, never rely on layout or proxy alone. */
export async function requireAdmin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) redirect("/admin/login");
  const supabase = await createSupabaseServerClient();
  // getUser confirms the user with Auth, including server-side revocations.
  const { data: { user }, error } = await supabase.auth.getUser();
  const decision = await adminDecision(error ? null : user?.id ?? null, isAdminMember);
  if (decision === "unauthenticated") redirect("/admin/login");
  if (decision === "forbidden") redirect("/admin/unauthorized");
  return { id: user!.id, email: user!.email };
}
