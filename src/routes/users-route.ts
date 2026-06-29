import { Elysia, t } from "elysia";
import { registerUser, loginUser, logoutUser, getCurrentUser } from "../services/users-service";

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
  )
  .post(
    "/login",
    async ({ body, set }) => {
      try {
        const data = await loginUser(body);
        return { status: "success", data };
      } catch (error: any) {
        set.status = 401;
        return { status: "failed", error: error.message || "Login gagal" };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 1 })
      })
    }
  )
  .post(
    "/logout",
    async ({ request, set }) => {
      try {
        const auth = request.headers.get("authorization")?.split(" ")[1];
        if (!auth) throw new Error("Token missing");
        await logoutUser({ token: auth });
        return { status: "success", data: { message: "Logged out" } };
      } catch (error: any) {
        set.status = 400;
        return { status: "failed", error: error.message || "Logout gagal" };
      }
    },
    {
      body: t.Object({})
    }
  )
  .get(
    "/current",
    async ({ request, set }) => {
      try {
        const auth = request.headers.get("authorization")?.split(" ")[1];
        if (!auth) {
          set.status = 401;
          return { status: "failed", error: "Token missing" };
        }
        const user = await getCurrentUser({ token: auth });
        return { status: "success", data: user };
      } catch (error: any) {
        set.status = 401;
        return { status: "failed", error: error.message || "Unauthorized" };
      }
    }
  );
