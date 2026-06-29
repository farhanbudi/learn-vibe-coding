import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

export type RegisterUserInput = {
  name: string;
  email: string;
  password: string;
};

export const registerUser = async (input: RegisterUserInput) => {
  const { name, email, password } = input;
  const existing = await db.select().from(users).where(eq(users.email, email));
  if (existing.length > 0) {
    throw new Error("Email already registered");
  }
  const hashed = await bcrypt.hash(password, 10);
  await db.insert(users).values({ name, email, password: hashed });
  const created = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
  }).from(users).where(eq(users.email, email));
  return created[0];
};

// -------------------------------------------------------------------
// Login & Logout
// -------------------------------------------------------------------
export const loginUser = async (input: { email: string; password: string }) => {
  const { email, password } = input;
  const [foundUser] = await db.select().from(users).where(eq(users.email, email));
  if (!foundUser) {
    throw new Error("Invalid credentials");
  }

  const matches = await bcrypt.compare(password, foundUser.password);
  if (!matches) {
    throw new Error("Invalid credentials");
  }
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
  await db.insert(sessions).values({
    userId: foundUser.id,
    token,
    expiresAt,
  });
  return { token };
};

export const logoutUser = async (input: { token: string }) => {
  const { token } = input;
  await db.delete(sessions).where(eq(sessions.token, token));
  return { success: true };
};
