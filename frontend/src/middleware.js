import { NextResponse } from "next/server";

export function middleware(request) {
  const path = request.nextUrl.pathname;

  // Public paths that don't require authentication
  const isPublicPath = path === "/" || path.startsWith("/auth/");

  // Check for authentication cookie
  const isAuthenticated = request.cookies.has("accessToken");

  // Redirect authenticated users trying to access public paths to dashboard
  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users trying to access protected paths to login
  if (!isAuthenticated && !isPublicPath) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

// Configure paths that trigger the middleware
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
