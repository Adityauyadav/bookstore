import { Router } from "express";

import { login, register } from "./auth.controller";
import { loginSchema, registerSchema } from "./auth.schema";
import validate from "../middleware/validate";

const authRouter = Router();

authRouter.post("/register", validate(registerSchema), register);
authRouter.post("/login", validate(loginSchema), login);

export default authRouter;
