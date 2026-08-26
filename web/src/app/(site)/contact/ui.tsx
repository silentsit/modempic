"use client";

import { useActionState } from "react";
import { contactAction, type ContactState } from "@/lib/actions/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const TOPICS = [
  { value: "order", label: "Order" },
  { value: "shipping", label: "Shipping & tracking" },
  { value: "payment", label: "Payment" },
  { value: "other", label: "Something else" },
] as const;

export function ContactForm() {
  const [state, action, pending] = useActionState(contactAction, null as ContactState);

  return (
    <form action={action} className="space-y-4">
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.success ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900 dark:border-green-900 dark:bg-green-950/40">
          {state.success}
        </p>
      ) : null}
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required className="mt-1.5" autoComplete="name" />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required className="mt-1.5" autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="topic">Topic</Label>
        <select
          id="topic"
          name="topic"
          required
          defaultValue="order"
          className="mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {TOPICS.map((topic) => (
            <option key={topic.value} value={topic.value}>
              {topic.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="orderNumber">Order number (optional)</Label>
        <Input id="orderNumber" name="orderNumber" className="mt-1.5" autoComplete="off" placeholder="If this is about an order" />
      </div>
      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" required minLength={10} className="mt-1.5" rows={5} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
