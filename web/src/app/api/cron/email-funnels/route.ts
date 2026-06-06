import { env } from "@/lib/env";
import { processDueEmailFunnels } from "@/lib/email/funnels/process";

/** Cron may send multiple batches (Resend calls); allow headroom on Pro. */
export const maxDuration = 60;

function authorizeCron(request: Request): boolean {
  const cronSecret = env.CRON_SECRET;
  if (!cronSecret) {
    return process.env.NODE_ENV === "development";
  }
  const authHeader = request.headers.get("authorization") ?? "";
  return authHeader === `Bearer ${cronSecret}`;
}

async function run(request: Request) {
  const result = await processDueEmailFunnels();
  const schedule = request.headers.get("x-vercel-cron-schedule");
  return Response.json({
    ok: true,
    schedule: schedule ?? null,
    ...result,
  });
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return new Response("Unauthorized", { status: 401 });
  }
  return run(request);
}

export async function POST(request: Request) {
  if (!authorizeCron(request)) {
    return new Response("Unauthorized", { status: 401 });
  }
  return run(request);
}
