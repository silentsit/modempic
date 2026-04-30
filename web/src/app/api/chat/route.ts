import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { MEDICAL_INFO_CHAT_SYSTEM } from "@/lib/ai/med-chat-system-prompt";

export const maxDuration = 60;

export async function POST(req: Request) {
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
