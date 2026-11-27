import { NextResponse } from "next/server";

// Safety guards for the isolated Excel-export preview only. Both are inert
// unless their environment variable is set (only on the preview site).
//
// 1) PREVIEW_SECRET: every page and API call returns 401 unless the request
//    has a valid session cookie. A short-lived signed invite link (?invite=)
//    is exchanged for a Secure HttpOnly cookie and redirected to a clean URL.
//    Invites and cookies are HMAC-signed with expiry; the secret never leaves
//    the server environment.
// 2) READ_ONLY_PREVIEW=1: every API call that is not a read (GET/HEAD) is
//    refused so the database cannot be changed through this deployment.
//    Login is a read (it only looks up a user), so it stays allowed.

const enc = new TextEncoder();

async function sign(secret, msg) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length)
    return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// token format: "<expiryEpochSeconds>.<hexHmac>" for the given purpose
async function validToken(secret, purpose, token) {
  if (!token) return false;
  const [exp, mac] = String(token).split(".");
  const expN = Number(exp);
  if (!expN || !mac || expN < Math.floor(Date.now() / 1000)) return false;
  return safeEqual(await sign(secret, `${purpose}.${exp}`), mac);
}

const deny = () =>
  new NextResponse("Unauthorized", {
    status: 401,
    headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
  });

export async function middleware(request) {
  const secret = process.env.PREVIEW_SECRET;
  const { pathname, searchParams } = request.nextUrl;

  if (secret) {
    const session = request.cookies.get("pv_session")?.value;
    if (!(await validToken(secret, "sess", session))) {
      const invite = searchParams.get("invite");
      if (invite && (await validToken(secret, "invite", invite))) {
        const clean = request.nextUrl.clone();
        clean.searchParams.delete("invite");
        const res = NextResponse.redirect(clean);
        const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 6;
        res.cookies.set(
          "pv_session",
          `${exp}.${await sign(secret, `sess.${exp}`)}`,
          { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 6 }
        );
        res.headers.set("Cache-Control", "no-store");
        res.headers.set("Referrer-Policy", "no-referrer");
        return res;
      }
      return deny();
    }
  }

  if (
    pathname === "/preview-enter" &&
    !(process.env.READ_ONLY_PREVIEW === "1" && secret)
  ) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (process.env.READ_ONLY_PREVIEW === "1" && pathname.startsWith("/api/")) {
    const method = request.method.toUpperCase();
    const isRead = method === "GET" || method === "HEAD" || method === "OPTIONS";
    const isLogin = pathname === "/api/login" && method === "POST";
    if (!isRead && !isLogin) {
      return NextResponse.json(
        { Message: "Read-only test preview: changes are disabled here." },
        { status: 403 }
      );
    }
  }
  const res = NextResponse.next();
  if (secret) res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}

export const config = {
  matcher: "/:path*",
};
