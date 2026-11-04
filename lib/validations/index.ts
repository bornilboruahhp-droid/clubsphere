import { z } from "zod";

/**
 * Example boilerplate validation schema.
 * Define your input validation schemas here.
 */
export const exampleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

export type ExampleInput = z.infer<typeof exampleSchema>;
