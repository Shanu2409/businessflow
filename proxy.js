import { NextResponse } from "next/server";

// Optional site-wide access gate (HTTP Basic Auth).
// Active only when ACCESS_USER and ACCESS_PASSWORD are set in the environment.
// Covers every page and every /api route. Remove this file to turn it off.
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export function proxy(request) {
  const user = process.env.ACCESS_USER;
  const pass = process.env.ACCESS_PASSWORD;
  if (!user || !pass) return NextResponse.next();

  const header = request.headers.get("authorization") || "";
  if (header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const i = decoded.indexOf(":");
      if (i >= 0) {
        const u = decoded.slice(0, i);
        const p = decoded.slice(i + 1);
        if (safeEqual(u, user) && safeEqual(p, pass)) return NextResponse.next();
      }
    } catch (e) {}
  }
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="BusinessFlow", charset="UTF-8"' },
  });
}

export const config = {
  matcher: "/:path*",
};
