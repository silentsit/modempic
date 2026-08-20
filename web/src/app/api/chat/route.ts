import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { MEDICAL_INFO_CHAT_SYSTEM } from "@/lib/ai/med-chat-system-prompt";

export const maxDuration = 60;

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

const rateLimits = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || now >= entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_REQUESTS_PER_WINDOW;
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return Response.json({ error: { message: "Too many chat requests. Please try again in a minute." } }, { status: 429 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: { message: "Chat is not configured. Add OPENAI_API_KEY to your environment." } },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: { message: "Invalid JSON body." } }, { status: 400 });
  }

  const messages = (body as { messages?: unknown }).messages;
  if (!Array.isArray(messages)) {
    return Response.json({ error: { message: "Expected a messages array." } }, { status: 400 });
  }

  try {
    const modelId =
      process.env.OPENAI_CHAT_MODEL?.trim() ||
      process.env.CHAT_OPENAI_MODEL?.trim() ||
      "gpt-4o-mini";
    const result = streamText({
      model: openai(modelId),
      system: MEDICAL_INFO_CHAT_SYSTEM,
      messages: await convertToModelMessages(messages as UIMessage[]),
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error("[api/chat]", err);
    return Response.json(
      { error: { message: err instanceof Error ? err.message : "Chat request failed." } },
      { status: 500 },
    );
  }
}
