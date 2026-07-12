// middleware.ts
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // 1. Redirect to login if not logged in
  if (!isLoggedIn) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // 2. Role-based access control
  const role = req.auth?.user?.role as string;

  // Driver restrictions
  if (role === "DRIVER") {
    // Block access to admin-only modules
    if (
      pathname.startsWith("/vehicles") ||
      pathname.startsWith("/drivers") ||
      pathname.startsWith("/expenses") ||
      pathname.startsWith("/reports") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/users")
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Block specific actions like creating trips
    if (pathname === "/trips/create") {
      return NextResponse.redirect(new URL("/trips", req.url));
    }
  }

  // Financial Analyst restrictions
  if (role === "FINANCIAL_ANALYST") {
    if (
      pathname.startsWith("/vehicles/create") ||
      pathname.startsWith("/vehicles/edit") ||
      pathname.startsWith("/drivers/create") ||
      pathname.startsWith("/drivers/edit") ||
      pathname.startsWith("/trips/create") ||
      pathname.startsWith("/maintenance/create")
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Safety Officer restrictions
  if (role === "SAFETY_OFFICER") {
    if (
      pathname.startsWith("/vehicles/create") ||
      pathname.startsWith("/vehicles/edit") ||
      pathname.startsWith("/drivers/create") ||
      pathname.startsWith("/trips/create") ||
      pathname.startsWith("/maintenance/create") ||
      pathname.startsWith("/expenses/create")
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)",
  ],
};
