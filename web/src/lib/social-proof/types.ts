import type { SocialProofGlobalConfig, SocialProofNotificationConfig } from "./schema";
import type { SocialProofSlide } from "./slides";

export type SocialProofBootstrap = {
  slides: SocialProofSlide[];
  windowDays: number;
  global: Pick<SocialProofGlobalConfig, "brandLabel" | "debugMode">;
  notification: {
    id: string;
    name: string;
    config: SocialProofNotificationConfig;
  };
  streamNotificationId?: string;
  comboNotificationId?: string;
  counterNotification?: {
    id: string;
    scope: "page" | "site";
    windowMinutes: number;
    minDisplay: number;
    message: string;
  };
  comboMessage?: string;
  /** Server-side only diagnostic. */
  dataSource?: "real" | "demo" | "synthetic";
};

export type SocialProofWidgetConfig = SocialProofNotificationConfig;
