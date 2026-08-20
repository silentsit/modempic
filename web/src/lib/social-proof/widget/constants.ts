import type { SocialProofPosition } from "@/lib/social-proof/schema";

export const DISMISS_SESSION_KEY = "modempic_social_proof_snooze_until";
export const PRESENCE_SESSION_KEY = "modempic_social_proof_session";

export const POSITION_CLASS: Record<SocialProofPosition, string> = {
  "bottom-left":
    "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-4 max-sm:bottom-[calc(5.25rem+env(safe-area-inset-bottom))] max-sm:left-3",
  "bottom-right":
    "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 max-sm:bottom-[calc(5.25rem+env(safe-area-inset-bottom))] max-sm:right-3",
  "top-left": "top-[4.75rem] left-4 max-sm:top-[4.25rem] max-sm:left-3",
  "top-right": "top-[4.75rem] right-4 max-sm:top-[4.25rem] max-sm:right-3",
};
