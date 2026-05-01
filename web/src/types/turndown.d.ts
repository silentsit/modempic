declare module "turndown" {
  export default class TurndownService {
    constructor(options?: Record<string, unknown>);
    turndown(html: string): string;
    remove(selectors: string[]): TurndownService;
  }
}
