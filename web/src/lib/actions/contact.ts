"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(255),
  message: z.string().min(10).max(5000),
});

export type ContactState = { error?: string; success?: string } | null;

export async function contactAction(_p: ContactState, formData: FormData): Promise<ContactState> {
  const parsed = schema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    message: String(formData.get("message") ?? ""),
  });
  if (!parsed.success) {
    return { error: "Please fill in all fields. Message should be at least 10 characters." };
  }
  await prisma.contactSubmission.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      message: parsed.data.message,
    },
  });
  return { success: "Thanks — we received your message and will respond by email when we can." };
}
