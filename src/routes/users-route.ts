import { Elysia, t } from "elysia";
import { registerUser } from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .post(
    "/register",
    async ({ body, set }) => {
      try {
        const user = await registerUser(body);
        return { status: "success", data: user };
      } catch (error: any) {
        set.status = 400;
        return { status: "failed", error: error.message || "Registrasi gagal" };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 6 })
      })
    }
  );
