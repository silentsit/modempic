import { SiteHeader } from "./header";
import { SiteFooter } from "./footer";
import { FreeShippingBanner } from "./free-shipping-banner";
import { SiteChatSlot } from "./site-chat-slot";
import { SocialProofLoader } from "@/components/social-proof/social-proof-loader";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col [--site-sticky-offset:calc(4rem+2.75rem)]" suppressHydrationWarning>
      <div className="sticky top-0 z-50">
        <FreeShippingBanner />
        <SiteHeader />
      </div>
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <SiteChatSlot />
      <SocialProofLoader />
    </div>
  );
}
