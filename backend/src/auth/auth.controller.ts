import { type RequestHandler } from "express";

import env from "../config/env";
import { loginUser, registerUser } from "./auth.service";

const REFRESH_TOKEN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export const register: RequestHandler = async (req, res, next) => {
  try {
    const { refreshToken, ...result } = await registerUser(req.body);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const { refreshToken, ...result } = await loginUser(req.body);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
