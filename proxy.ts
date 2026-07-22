import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";

function getRoleTopUrl(role: string | undefined): string {
  return role === "MANAGER" ? "/manager/reports" : "/reports";
}

export default auth((req: NextAuthRequest) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  if (pathname === "/login") {
    if (user) {
      return NextResponse.redirect(new URL(getRoleTopUrl(user.role), req.url));
    }
    return NextResponse.next();
  }

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/reports")) {
    if (user.role !== "SALES") {
      return NextResponse.redirect(new URL("/manager/reports", req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/manager/reports")) {
    if (user.role !== "MANAGER") {
      return NextResponse.redirect(new URL("/reports", req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!user.isAdmin) {
      return NextResponse.redirect(new URL(getRoleTopUrl(user.role), req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).+)"],
};
