import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { GUEST_CART_COOKIE, guestCartCookieOptions } from "@/lib/cart/guest-cookie";

function withGuestCartCookie(req: NextRequest, secure: boolean) {
  const path = req.nextUrl.pathname;
  const onCartOrCheckout = path === "/cart" || path.startsWith("/checkout");
  const existing = req.cookies.get(GUEST_CART_COOKIE)?.value;
  const guestKey = existing && existing.length >= 8 ? existing : crypto.randomUUID();

  const requestHeaders = new Headers(req.headers);
  if (onCartOrCheckout) {
    requestHeaders.set("x-guest-cart-key", guestKey);
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  if (onCartOrCheckout && !existing) {
    res.cookies.set(GUEST_CART_COOKIE, guestKey, guestCartCookieOptions(secure));
  }
  return res;
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const isSecure = req.nextUrl.protocol === "https:" || forwardedProto === "https";

  try {
    if (path === "/shop" && req.nextUrl.searchParams.has("query")) {
      const res = NextResponse.next();
      res.headers.set("X-Robots-Tag", "noindex, follow");
      return res;
    }

    if (path === "/blog" && req.nextUrl.searchParams.has("cat")) {
      const res = NextResponse.next();
      res.headers.set("X-Robots-Tag", "noindex, follow");
      return res;
    }

    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      return withGuestCartCookie(req, isSecure);
    }

    /**
     * In edge middleware on Vercel, NEXTAUTH_URL isn't reliably visible to @auth/core, so getToken's
     * automatic secure-cookie detection fails and it looks for the unprefixed cookie name — returning
     * null for genuinely logged-in users. Detect HTTPS explicitly and pass the matching cookie name + salt.
     */
    const cookieName = isSecure ? "__Secure-authjs.session-token" : "authjs.session-token";
    const token = await getToken({ req, secret, secureCookie: isSecure, salt: cookieName, cookieName });

    if (path.startsWith("/admin")) {
      if (!token) {
        return NextResponse.redirect(new URL("/login?callbackUrl=/admin", req.url));
      }
      const role = token.role as string | undefined;
      if (role !== "ADMIN" && role !== "STAFF") {
        return NextResponse.redirect(new URL("/", req.url));
      }
      return NextResponse.next();
    }

    if (path.startsWith("/account") && !token) {
      const cb = path + req.nextUrl.search;
      return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(cb)}`, req.url));
    }

    return withGuestCartCookie(req, isSecure);
  } catch (e) {
    console.error("[middleware]", e);
    if (path.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    if (path.startsWith("/account")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return withGuestCartCookie(req, isSecure);
  }
}

export const config = {
  matcher: ["/account/:path*", "/cart", "/checkout", "/admin/:path*", "/shop", "/blog"],
};
