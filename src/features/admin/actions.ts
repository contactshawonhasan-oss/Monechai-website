"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isAdminMember } from "./membership";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const credentials = z.object({ email: z.email().max(254), password: z.string().min(1).max(1024) });

export async function loginAdmin(form: FormData) {
  const parsed = credentials.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) redirect("/admin/login?error=invalid");
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) redirect("/admin/login?error=config");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) redirect("/admin/login?error=invalid");
  if (!(await isAdminMember(data.user.id))) {
    await supabase.auth.signOut({ scope: "local" });
    redirect("/admin/unauthorized");
  }
  redirect("/admin");
}

export async function logoutAdmin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) redirect("/admin/login");
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/admin/login");
}
