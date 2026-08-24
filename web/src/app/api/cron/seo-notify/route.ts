import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import {
  notifySearchEngines,
  SEO_NOTIFY_LAST_RUN_KEY,
} from "@/lib/seo/notify-search-engines";

export const maxDuration = 60;

function authorizeCron(request: Request): boolean {
  const cronSecret = env.CRON_SECRET;
  if (!cronSecret) {
    return process.env.NODE_ENV === "development";
  }
  const authHeader = request.headers.get("authorization") ?? "";
  return authHeader === `Bearer ${cronSecret}`;
}

function channelFlags(request: Request) {
  const url = new URL(request.url);
  const indexNowParam = url.searchParams.get("indexNow");
  const gscParam = url.searchParams.get("gsc");
  const indexNow = indexNowParam == null ? true : indexNowParam !== "0" && indexNowParam !== "false";
  const googleSearchConsole = gscParam == null ? true : gscParam !== "0" && gscParam !== "false";
  return { indexNow, googleSearchConsole };
}

async function run(request: Request) {
  const flags = channelFlags(request);
  const result = await notifySearchEngines(flags);

  await prisma.storeSetting.upsert({
    where: { key: SEO_NOTIFY_LAST_RUN_KEY },
    create: { key: SEO_NOTIFY_LAST_RUN_KEY, value: { ...result, triggeredBy: "cron" } as object },
    update: { value: { ...result, triggeredBy: "cron" } as object },
  });

  return Response.json(result, { status: result.ok ? 200 : result.blockedReason ? 422 : 502 });
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
