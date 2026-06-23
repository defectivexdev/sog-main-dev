import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;

  const publicRoutes = ["/login", "/access-denied", "/api/auth"];
  const isPublic = publicRoutes.some((route) => nextUrl.pathname.startsWith(route));

  if (isPublic) return NextResponse.next();

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  const isProfileSetup = nextUrl.pathname === "/profile/setup" || nextUrl.pathname.startsWith("/api/profile");
  
  if (!session.user?.icName && !isProfileSetup) {
    return NextResponse.redirect(new URL("/profile/setup", nextUrl));
  }

  if (session.user?.icName && nextUrl.pathname === "/profile/setup") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
