"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyPriceIndexButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={() => void onCopy()}>
      {copied ? "Copied" : "Copy table"}
    </Button>
  );
}
