import { Router } from "express";

import authMiddleware from "../middleware/auth.middleware";
import { login, logout, me, refresh, register } from "./auth.controller";
import { loginSchema, registerSchema } from "./auth.schema";
import validate from "../middleware/validate";

const authRouter = Router();

authRouter.post("/register", validate(registerSchema), register);
authRouter.post("/login", validate(loginSchema), login);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", authMiddleware, logout);
authRouter.get("/me", authMiddleware, me);

export default authRouter;
