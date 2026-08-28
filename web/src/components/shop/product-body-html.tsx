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

    function isBroken(img: HTMLImageElement) {
      if (!img.complete || img.naturalWidth > 0) return false;
      const src = img.currentSrc || img.getAttribute("src") || "";
      if (!src) return false;
      // Lazy images that have not started fetching often report complete + 0×0.
      // Hiding them with display:none keeps them off-screen, so they never load.
      if (img.loading === "lazy" && !img.currentSrc) return false;
      return true;
    }

    const imgs = Array.from(root.querySelectorAll("img"));
    const onError = (event: Event) => {
      if (event.currentTarget instanceof HTMLImageElement) hide(event.currentTarget);
    };

    for (const img of imgs) {
      if (isBroken(img)) hide(img);
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
