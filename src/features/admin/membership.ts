import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { adminMembers } from "@/db/schema/admin";

export async function isAdminMember(userId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) return false;
  const [member] = await getDb().select({ userId: adminMembers.userId }).from(adminMembers)
    .where(eq(adminMembers.userId, userId)).limit(1);
  return Boolean(member);
}
