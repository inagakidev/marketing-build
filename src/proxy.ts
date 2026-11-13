import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Protects `/admin/*` and refreshes the Supabase session.
 *
 * In Next 16 this file is called `proxy.ts` — the old `middleware.ts` was
 * deprecated and renamed.
 *
 * Besides blocking unauthenticated users, this is the only place in the flow
 * that can WRITE the refreshed cookies: Server Components can't. Without it
 * the session would expire even while the person is using the panel.
 */
export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Supabase not configured yet: let it through so the screens can explain
  // what's missing. Real authorization happens in each page and route, via
  // `requireUser`/`getSessionUser` — never only here.
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // `getUser` revalidates the token on Supabase's server. Don't swap it for
  // `getSession`, which only reads the cookie and can be forged.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith("/admin")) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    // Keeps the destination to return to it after login.
    login.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  /**
   * Only the authenticated surfaces (PERF-01). Each run costs a trip to
   * Supabase to revalidate the token; the public form (`/briefing`,
   * `/api/public`) has no session and shouldn't pay that cost on every
   * autosave.
   */
  matcher: [
    "/admin/:path*",
    "/login",
    "/print/:path*",
    "/api/clients/:path*",
    "/api/briefings/:path*",
  ],
};
