"use client";

import { useEffect, useRef } from "react";

/** Renders sanitized product HTML and hides any image that still fails to load. */
export function ProductBodyHtml({ html }: { html: string }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    function hide(img: HTMLImageElement) {
      img.style.display = "none";
      const figure = img.closest("figure");
      if (figure && figure.querySelectorAll("img").length === 1) {
        (figure as HTMLElement).style.display = "none";
      }
    }

    const imgs = Array.from(root.querySelectorAll("img"));
    const onError = (event: Event) => {
      if (event.currentTarget instanceof HTMLImageElement) hide(event.currentTarget);
    };

    for (const img of imgs) {
      if (img.complete && img.naturalWidth === 0) hide(img);
      img.addEventListener("error", onError);
    }

    return () => {
      for (const img of imgs) img.removeEventListener("error", onError);
    };
  }, [html]);

  return (
    <div
      ref={rootRef}
      className="product-body-html"
      dangerouslySetInnerHTML={{ __html: html }}
      suppressHydrationWarning
    />
  );
}
