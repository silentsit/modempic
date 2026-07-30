"use client";

import dynamic from "next/dynamic";

const StoreChatWidget = dynamic(
  () =>
    import("@/components/chat/store-chat-widget")
      .then((m) => ({ default: m.StoreChatWidget }))
      .catch(() => ({ default: () => null })),
  { ssr: false },
);

/** Loads the floating chat on the client only (no SSR for AI SDK + window). */
export function SiteChatSlot() {
  return <StoreChatWidget />;
}
