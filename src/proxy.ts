import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Protege `/admin/*` e renova a sessão do Supabase.
 *
 * No Next 16 este arquivo se chama `proxy.ts` — o antigo `middleware.ts` foi
 * descontinuado e renomeado.
 *
 * Além de barrar quem não está autenticado, este é o único lugar do fluxo que
 * pode ESCREVER os cookies renovados: Server Components não podem. Sem isso a
 * sessão expiraria mesmo com a pessoa usando o painel.
 */
export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Supabase ainda não configurado: deixa passar para que as telas possam
  // explicar o que falta. A autorização de verdade acontece em cada página e
  // rota, via `requireUser`/`getSessionUser` — nunca só aqui.
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

  // `getUser` revalida o token no servidor do Supabase. Não troque por
  // `getSession`, que apenas lê o cookie e é falsificável.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith("/admin")) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    // Preserva o destino para voltar a ele depois do login.
    login.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  /**
   * Só as superfícies autenticadas (PERF-01). Cada execução custa uma ida ao
   * Supabase para revalidar o token; o formulário público (`/briefing`,
   * `/api/public`) não usa sessão e não deve pagar esse custo a cada autosave.
   */
  matcher: [
    "/admin/:path*",
    "/login",
    "/print/:path*",
    "/api/clients/:path*",
    "/api/briefings/:path*",
  ],
};
