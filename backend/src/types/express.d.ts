declare global {
  namespace Express {
    interface Request {
      cookies: Record<string, string | undefined>;
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export {};
