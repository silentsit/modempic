import type { SocialProofPosition } from "@/lib/social-proof/schema";

export const DISMISS_SESSION_KEY = "modempic_social_proof_snooze_until";
export const PRESENCE_SESSION_KEY = "modempic_social_proof_session";

export const POSITION_CLASS: Record<SocialProofPosition, string> = {
  "bottom-left": "bottom-4 left-4 max-sm:bottom-3 max-sm:left-3",
  "bottom-right": "bottom-4 right-4 max-sm:bottom-3 max-sm:right-3",
  "top-left": "top-[4.75rem] left-4 max-sm:top-[4.25rem] max-sm:left-3",
  "top-right": "top-[4.75rem] right-4 max-sm:top-[4.25rem] max-sm:right-3",
};
