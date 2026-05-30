import type { SocialProofGlobalConfig, SocialProofNotificationConfig } from "./schema";
import type { SocialProofSlide } from "./slides";
import type { ComboSlideDto, StreamAggregateDto } from "./stream-aggregates";

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
    message: string;
  };
  comboMessage?: string;
  comboSlides?: ComboSlideDto[];
  streamAggregates?: StreamAggregateDto[];
  /** Server-side only diagnostic. */
  dataSource?: "real" | "demo" | "synthetic";
};

export type SocialProofWidgetConfig = SocialProofNotificationConfig;
