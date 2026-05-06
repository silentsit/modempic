import { SiteHeader } from "./header";
import { SiteFooter } from "./footer";
import { SiteChatSlot } from "./site-chat-slot";
import { getCartCount } from "@/lib/data/cart";
import { auth } from "@/auth";

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const [session, cartCount] = await Promise.all([auth(), getCartCount()]);
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader cartCount={cartCount} user={session?.user ? { name: session.user.name, email: session.user.email } : null} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <SiteChatSlot />
    </div>
  );
}
