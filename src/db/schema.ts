import { int, mysqlTable, varchar, timestamp } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").notNull().primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const sessions = mysqlTable("sessions", {
  id: int("id").notNull().primaryKey().autoincrement(),
  userId: int("user_id").notNull().references(() => users.id),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
});
