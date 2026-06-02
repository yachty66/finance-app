import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

/**
 * Chat conversations and their messages. In local-first mode every row
 * belongs to the implicit "owner" (a single human running this on their
 * machine), so there is no user FK yet. When hosted mode lands we'll add a
 * users table back and a user_id column on conversations.
 */
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // "user" | "assistant" | "system"
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
