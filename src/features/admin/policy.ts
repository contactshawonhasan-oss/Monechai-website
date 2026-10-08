// Pure policy kept separate from the SSR client so denied paths are testable offline.
export async function adminDecision(userId: string | null, isMember: (id: string) => Promise<boolean>) {
  if (!userId) return "unauthenticated" as const;
  return (await isMember(userId)) ? "admin" as const : "forbidden" as const;
}
