import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const auth = req.cookies.get("fay_auth")?.value;
  const { pathname } = req.nextUrl;

  if (pathname === "/login" || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (auth !== process.env.FAY_PASSWORD) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
