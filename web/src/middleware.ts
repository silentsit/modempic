import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return NextResponse.next();

  const token = await getToken({ req, secret });
  const path = req.nextUrl.pathname;

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

  const needsAuth = path.startsWith("/account") || path.startsWith("/checkout") || path === "/cart";
  if (needsAuth && !token) {
    const cb = path + req.nextUrl.search;
    return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(cb)}`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/checkout/:path*", "/cart", "/admin/:path*"],
};
