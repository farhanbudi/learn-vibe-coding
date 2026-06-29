import { Elysia } from "elysia";
import { usersRoute } from "./routes/users-route";

const app = new Elysia()
  .get("/", () => ({
    status: "OK",
    message: "Server is running",
  }))
  .use(usersRoute)
  .listen(Number(process.env.PORT) || 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
