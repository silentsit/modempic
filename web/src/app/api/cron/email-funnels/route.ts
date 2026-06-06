import { env } from "@/lib/env";
import { processDueEmailFunnels } from "@/lib/email/funnels/process";

function authorizeCron(request: Request): boolean {
  if (!env.CRON_SECRET) {
    return process.env.NODE_ENV === "development";
  }
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${env.CRON_SECRET}`;
}

async function run() {
  const result = await processDueEmailFunnels();
  return Response.json({ ok: true, ...result });
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return new Response("Unauthorized", { status: 401 });
  }
  return run();
}

export async function POST(request: Request) {
  if (!authorizeCron(request)) {
    return new Response("Unauthorized", { status: 401 });
  }
  return run();
}
