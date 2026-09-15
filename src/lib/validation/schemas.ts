import { z } from "zod";

// shared by the api routes and the client forms, so the rules can't drift

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address.")),
  password: z.string().min(1, "Password is required."),
});

export const announcementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters.")
    .max(120, "Title can be at most 120 characters."),
  body: z
    .string()
    .trim()
    .min(1, "Body cannot be empty.")
    .max(2_000, "Body can be at most 2,000 characters."),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type AnnouncementInput = z.infer<typeof announcementSchema>;

export function fieldErrorsFromZod(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && fields[key] === undefined) {
      fields[key] = issue.message;
    }
  }
  return fields;
}
