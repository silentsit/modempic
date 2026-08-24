"use client";

import { useChat } from "@ai-sdk/react";
import { type UIMessage } from "ai";
import { MessageCircle, X, Send, Square } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function textFromMessage(message: UIMessage): string {
  return message.parts
    .filter(
      (p): p is { type: "text"; text: string } =>
        typeof p === "object" && p !== null && (p as { type?: string }).type === "text" && "text" in p,
    )
    .map((p) => p.text)
    .join("");
}

export function StoreChatWidget({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const { messages, sendMessage, status, error, clearError, stop } = useChat();

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const t = input.trim();
      if (!t || busy) return;
      void sendMessage({ text: t }).catch(() => {
        /* useChat surfaces failures via `error`; swallow stray promise rejections (can be non-Error). */
      });
      setInput("");
    },
    [input, sendMessage, busy],
  );

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (error) clearError();
        }}
        className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-5 z-50 h-14 w-14 gap-0 rounded-full p-0 ring-1 ring-border shadow-[0_8px_30px_rgba(15,23,42,0.12)] max-lg:bottom-[calc(5.5rem+env(safe-area-inset-bottom))]"
        size="icon"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? "modempic-chat-panel" : undefined}
      >
        {open ? <X className="h-6 w-6" aria-hidden /> : <MessageCircle className="h-6 w-6" aria-hidden />}
        <span className="sr-only">{open ? "Close chat" : "Open science and safety chat"}</span>
      </Button>

      {open ? (
        <div
          className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom))] right-5 z-50 flex w-[min(100vw-2.5rem,24rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_16px_50px_rgba(15,23,42,0.12)] max-lg:bottom-[calc(10.5rem+env(safe-area-inset-bottom))]"
          id="modempic-chat-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelId}
        >
          <div className="border-b border-border bg-muted px-4 py-3">
            <h2 id={labelId} className="text-sm font-semibold text-foreground">
              Science &amp; Safety (Not Medical Advice)
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Educational only. For personal decisions, talk to a clinician. Orders: info@modempic.com
            </p>
          </div>

          <div
            ref={listRef}
            className="max-h-[min(22rem,50vh)] space-y-3 overflow-y-auto px-4 py-3 text-sm"
            aria-live="polite"
          >
            {messages.length === 0 ? (
              <p className="text-muted-foreground">
                Ask about how things work, label reading, or what to discuss with a doctor—&nbsp;we won&apos;t tell you
                what to take.
              </p>
            ) : null}
            {messages.map((m) => (
              <div
                key={m.id}
                className={m.role === "user" ? "ml-6 text-right" : "mr-4 text-left"}
              >
                <p
                  className={
                    m.role === "user"
                      ? "inline-block rounded-2xl bg-primary px-3 py-2 text-left text-primary-foreground"
                      : "whitespace-pre-wrap text-foreground"
                  }
                >
                  {textFromMessage(m)}
                </p>
              </div>
            ))}
            {error ? (
              <p className="text-xs text-destructive" role="alert">
                {error.message}
              </p>
            ) : null}
          </div>

          <form onSubmit={onSubmit} className="border-t border-border p-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e);
                }
              }}
              placeholder="Ask something general…"
              aria-label="Chat message"
              className="min-h-[2.75rem] resize-none text-sm"
              rows={2}
              disabled={busy}
            />
            <div className="mt-2 flex justify-end gap-2">
              {busy ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void stop().catch(() => {});
                  }}
                >
                  <Square className="mr-1 h-3 w-3" />
                  Stop
                </Button>
              ) : null}
              <Button type="submit" size="sm" disabled={busy || !input.trim()}>
                <Send className="mr-1 h-4 w-4" />
                Send
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
