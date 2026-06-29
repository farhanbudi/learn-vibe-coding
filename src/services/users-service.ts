import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

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
