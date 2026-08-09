import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/onboarding"];
const AUTH_PAGES = ["/login", "/signup", "/forgot-password"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("smartsync_token")?.value;
  const { pathname } = request.nextUrl;

  if (PROTECTED.some((r) => pathname.startsWith(r)) && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (AUTH_PAGES.some((r) => pathname.startsWith(r)) && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};