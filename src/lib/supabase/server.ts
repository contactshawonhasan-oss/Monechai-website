import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";

export async function createSupabaseServerClient() {
  const { url, key } = getSupabaseConfig();
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        // Server Components cannot set cookies; proxy refreshes before render.
        try {
          for (const { name, value, options } of items) cookieStore.set(name, value, options);
        } catch { /* Read-only Server Component context. */ }
      },
    },
  });
}
