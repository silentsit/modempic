import type { SocialProofActivityItemDto } from "./queries";

export type SocialProofBootstrap = {
  items: SocialProofActivityItemDto[];
  aggregateCount?: number;
  aggregateHours?: number;
  windowDays: number;
  showAggregate: boolean;
};
