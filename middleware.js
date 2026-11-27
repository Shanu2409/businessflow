import { NextResponse } from "next/server";

// Safety guard for the isolated Excel-export preview only.
// When READ_ONLY_PREVIEW=1 (set only on that preview project), every API call
// that is not a read (GET/HEAD) is refused, so the live database cannot be
// changed through this deployment. Login is a read (it only looks up a user),
// so it stays allowed. Without the variable, nothing changes.
export function middleware(request) {
  if (process.env.READ_ONLY_PREVIEW !== "1") return NextResponse.next();

  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();
  const isRead = method === "GET" || method === "HEAD" || method === "OPTIONS";
  const isLogin = pathname === "/api/login" && method === "POST";

  if (!isRead && !isLogin) {
    return NextResponse.json(
      { Message: "Read-only test preview: changes are disabled here." },
      { status: 403 }
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
