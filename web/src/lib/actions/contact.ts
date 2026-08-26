"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";

const TOPICS = {
  order: "Order",
  shipping: "Shipping & tracking",
  payment: "Payment",
  other: "Something else",
} as const;

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(255),
  topic: z.enum(["order", "shipping", "payment", "other"]).default("other"),
  orderNumber: z.string().max(80).optional(),
  message: z.string().min(10).max(5000),
});

export type ContactState = { error?: string; success?: string } | null;

function composeMessage(topic: keyof typeof TOPICS, orderNumber: string | undefined, body: string) {
  const lines = [`Topic: ${TOPICS[topic]}`];
  if (orderNumber) lines.push(`Order: ${orderNumber}`);
  return `${lines.join("\n")}\n\n${body}`;
}

export async function contactAction(_p: ContactState, formData: FormData): Promise<ContactState> {
  const parsed = schema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    topic: String(formData.get("topic") ?? "other"),
    orderNumber: String(formData.get("orderNumber") ?? "").trim() || undefined,
    message: String(formData.get("message") ?? ""),
  });
  if (!parsed.success) {
    return { error: "Please fill in all fields. Message should be at least 10 characters." };
  }
  await prisma.contactSubmission.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      message: composeMessage(parsed.data.topic, parsed.data.orderNumber, parsed.data.message),
    },
  });
  return { success: "Thanks — we received your message and will respond by email when we can." };
}
