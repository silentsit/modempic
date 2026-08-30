"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { titleCaseHeading } from "@/lib/text/heading-title-case";
import type { LandingFaq } from "@/content/landings/where-to-buy-modafinil-online";

export function LandingFaqAccordion({ faqs }: { faqs: LandingFaq[] }) {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.q ?? null);

  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      {faqs.map((faq, index) => {
        const panelId = `landing-faq-panel-${index}`;
        const buttonId = `landing-faq-button-${index}`;
        const isOpen = openId === faq.q;

        return (
          <div key={faq.q}>
            <h3 className="m-0">
              <button
                id={buttonId}
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-foreground transition-colors hover:bg-muted/70"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenId(isOpen ? null : faq.q)}
              >
                <span>{titleCaseHeading(faq.q)}</span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
                    isOpen && "rotate-180 text-primary",
                  )}
                  aria-hidden
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="px-5 pb-5"
            >
              <p className="max-w-prose text-sm leading-relaxed text-muted-foreground sm:text-base">{faq.a}</p>
              {faq.sources?.length ? (
                <ul className="mt-3 space-y-1.5 text-sm">
                  {faq.sources.map((source) => (
                    <li key={source.url}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-accent underline-offset-2 hover:text-accent-hover hover:underline"
                      >
                        {source.label}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
