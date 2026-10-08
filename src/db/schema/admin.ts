import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

// Auth identities live in Supabase auth.users, not in application-owned PostgreSQL.
// Bootstrap only after the identity exists there; never trust a browser-supplied ID.
export const adminMembers = pgTable("admin_members", {
  userId: uuid("user_id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
