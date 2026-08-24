"use client";

import dynamic from "next/dynamic";
import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const StoreChatWidget = dynamic(
  () =>
    import("@/components/chat/store-chat-widget")
      .then((m) => ({ default: m.StoreChatWidget }))
      .catch(() => ({ default: () => null })),
  { ssr: false },
);

/** Lightweight launcher so the AI chat bundle is not on the first mobile paint. */
export function SiteChatSlot() {
  const [load, setLoad] = useState(false);

  if (!load) {
    return (
      <Button
        type="button"
        onClick={() => setLoad(true)}
        className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-5 z-50 h-14 w-14 gap-0 rounded-full p-0 ring-1 ring-border shadow-[0_8px_30px_rgba(15,23,42,0.12)] max-lg:bottom-[calc(5.5rem+env(safe-area-inset-bottom))]"
        size="icon"
        aria-label="Open science and safety chat"
      >
        <MessageCircle className="h-6 w-6" aria-hidden />
      </Button>
    );
  }

  return <StoreChatWidget defaultOpen />;
}
