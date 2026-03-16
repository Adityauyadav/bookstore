import { z, ZodError} from "zod";

const schema = z.object({
    DATABASE_URL: z.string().min(1),
    PORT: z.string().min(1).transform(val=>parseInt(val,10)),
    NODE_ENV: z.enum(["development", "production", "test"]),
});

let env: z.infer<typeof schema>;

try {
  env = schema.parse(process.env);
} catch (e) {
  if (e instanceof ZodError) {
    throw new Error(
      "Invalid environment variables:\n" +
      e.issues.map(err => `${String(err.path[0])}: ${err.message}`).join("\n")
    );
  }
  throw e;
}

export default env;