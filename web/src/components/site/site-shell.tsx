import { SiteHeader } from "./header";
import { SiteFooter } from "./footer";
import { FreeShippingBanner } from "./free-shipping-banner";
import { SiteChatSlot } from "./site-chat-slot";
import { SocialProofWidget } from "@/components/social-proof/social-proof-widget";
import { loadSocialProofBootstrapOrNull } from "@/lib/social-proof/bootstrap";
import { getCartCount } from "@/lib/data/cart";
import { auth } from "@/auth";

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const [session, cartCount, socialProof] = await Promise.all([
    auth(),
    getCartCount(),
    loadSocialProofBootstrapOrNull(),
  ]);
  return (
    <div className="flex min-h-screen flex-col" suppressHydrationWarning>
      <FreeShippingBanner />
      <SiteHeader
        cartCount={cartCount}
        user={
          session?.user
            ? { name: session.user.name, email: session.user.email, role: session.user.role }
            : null
        }
      />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <SiteChatSlot />
      {socialProof ? <SocialProofWidget bootstrap={socialProof} /> : null}
    </div>
  );
}
