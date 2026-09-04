import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { GUEST_CART_COOKIE, guestCartCookieOptions } from "@/lib/cart/guest-cookie";
import {
  MARKDOWN_BYPASS_HEADER,
  MARKDOWN_SOURCE_PATH_HEADER,
  isMarkdownNegotiablePath,
  prefersMarkdown,
} from "@/lib/agent-markdown/negotiate";
import { applyHomepageLinkHeaders } from "@/lib/api-catalog/homepage-link-headers";
import {
  CANONICAL_PUBLIC_HOST,
  requestHostname,
  shouldNoindexNonCanonicalHost,
  shouldRedirectVercelAppToCanonical,
} from "@/lib/seo/canonical-host";
import { hasMeaningfulSearchParam } from "@/lib/seo/filter-noindex";

function rewriteToMarkdown(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/api/markdown-for-agents";
  url.search = "";
  const headers = new Headers(req.headers);
  headers.set(MARKDOWN_SOURCE_PATH_HEADER, req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.rewrite(url, { request: { headers } });
}

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

function requestHost(req: NextRequest) {
  return requestHostname(req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.hostname);
}

function redirectProductionVercelApp(req: NextRequest) {
  const host = requestHost(req);
  if (!shouldRedirectVercelAppToCanonical(host)) return null;
  const url = req.nextUrl.clone();
  url.protocol = "https:";
  url.hostname = CANONICAL_PUBLIC_HOST;
  url.port = "";
  return NextResponse.redirect(url, 308);
}

export async function middleware(req: NextRequest) {
  const hostRedirect = redirectProductionVercelApp(req);
  if (hostRedirect) return hostRedirect;

  const res = await handleRequest(req);
  applyHomepageLinkHeaders(res.headers, req.nextUrl.pathname);
  if (shouldNoindexNonCanonicalHost(requestHost(req))) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return res;
}

async function handleRequest(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const isSecure = req.nextUrl.protocol === "https:" || forwardedProto === "https";

  if (
    req.method === "GET" &&
    req.headers.get(MARKDOWN_BYPASS_HEADER) !== "1" &&
    prefersMarkdown(req.headers.get("accept")) &&
    isMarkdownNegotiablePath(path)
  ) {
    return rewriteToMarkdown(req);
  }

  try {
    if (path === "/shop" && hasMeaningfulSearchParam(req.nextUrl.searchParams.get("query"))) {
      const res = NextResponse.next();
      res.headers.set("X-Robots-Tag", "noindex, follow");
      return res;
    }

    if (path === "/blog" && hasMeaningfulSearchParam(req.nextUrl.searchParams.get("cat"))) {
      const res = NextResponse.next();
      res.headers.set("X-Robots-Tag", "noindex, follow");
      return res;
    }

    const needsAuthOrCart =
      path.startsWith("/admin") ||
      path.startsWith("/account") ||
      path === "/cart" ||
      path.startsWith("/checkout");
    if (!needsAuthOrCart) {
      return NextResponse.next();
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
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg|css|js|woff2?|map)$).*)",
  ],
};
