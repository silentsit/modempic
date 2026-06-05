import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  try {
    const path = req.nextUrl.pathname;

    if (path === "/shop" && req.nextUrl.searchParams.has("query")) {
      const res = NextResponse.next();
      res.headers.set("X-Robots-Tag", "noindex, follow");
      return res;
    }

    const secret = process.env.AUTH_SECRET;
    if (!secret) return NextResponse.next();

    /**
     * In edge middleware on Vercel, NEXTAUTH_URL isn't reliably visible to @auth/core, so getToken's
     * automatic secure-cookie detection fails and it looks for the unprefixed cookie name — returning
     * null for genuinely logged-in users. Detect HTTPS explicitly and pass the matching cookie name + salt.
     */
    const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const isSecure = req.nextUrl.protocol === "https:" || forwardedProto === "https";
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

    const needsAuth = path.startsWith("/account") || path === "/cart";
    if (needsAuth && !token) {
      const cb = path + req.nextUrl.search;
      return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(cb)}`, req.url));
    }

    return NextResponse.next();
  } catch (e) {
    console.error("[middleware]", e);
    /** Avoid hard 500; continue without gating so the app stays usable (e.g. rotated AUTH_SECRET + stale cookie). */
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/account/:path*", "/cart", "/admin/:path*", "/shop"],
};
