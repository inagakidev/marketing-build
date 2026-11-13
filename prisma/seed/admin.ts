import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../../src/generated/prisma/client";

/**
 * Cria a administradora — o único usuário do MVP.
 *
 * Não existe cadastro público de admin de propósito (seção 2 da
 * especificação): a conta nasce aqui, rodando `npm run db:seed:admin`.
 *
 * Funciona em dois modos:
 *
 * - **Com Supabase configurado:** cria o usuário no Supabase Auth e o registro
 *   local vinculado. É o caminho de produção.
 * - **Sem Supabase:** cria só o registro local, com um `supabaseAuthId`
 *   marcado como pendente. Serve para desenvolver o painel e os dados antes de
 *   as credenciais existirem; o login por senha só passa a funcionar depois de
 *   rodar este script de novo com o Supabase configurado.
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL não definida.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const NAME = process.env.ADMIN_NAME?.trim() || "Administradora";
const EMAIL = process.env.ADMIN_EMAIL?.trim();
const PASSWORD = process.env.ADMIN_PASSWORD;

/** Marca um registro local ainda sem contrapartida no Supabase Auth. */
const PENDING_PREFIX = "pending:";

async function main(): Promise<void> {
  if (!EMAIL) {
    throw new Error("ADMIN_EMAIL não definida no .env.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const temSupabase = Boolean(supabaseUrl && serviceKey);

  let supabaseAuthId = `${PENDING_PREFIX}${EMAIL}`;

  if (temSupabase) {
    if (!PASSWORD || PASSWORD.length < 8) {
      throw new Error(
        "ADMIN_PASSWORD não definida ou com menos de 8 caracteres.",
      );
    }

    const supabase = createClient(supabaseUrl as string, serviceKey as string, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const existing = await findAuthUserByEmail(supabase.auth.admin, EMAIL);

    if (existing) {
      // Já existe: atualiza a senha para o valor do .env, para que o script
      // continue sendo a forma de recuperar o acesso.
      const { error } = await supabase.auth.admin.updateUserById(existing.id, {
        password: PASSWORD,
      });
      if (error) throw error;

      supabaseAuthId = existing.id;
      console.log(`  Usuário já existia no Supabase Auth; senha atualizada.`);
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { name: NAME },
      });
      if (error) throw error;

      supabaseAuthId = data.user.id;
      console.log("  Usuário criado no Supabase Auth.");
    }
  } else {
    console.warn(
      "  ! Supabase não configurado. Criando apenas o registro local.\n" +
        "    O login só funcionará depois de preencher NEXT_PUBLIC_SUPABASE_URL\n" +
        "    e SUPABASE_SERVICE_ROLE_KEY no .env e rodar este script de novo.",
    );
  }

  // O e-mail é a identidade estável entre os dois modos: assim rodar o script
  // depois de configurar o Supabase promove o registro pendente em vez de
  // criar um usuário duplicado.
  const existingLocal = await prisma.user.findUnique({
    where: { email: EMAIL },
    select: { id: true },
  });

  const user = existingLocal
    ? await prisma.user.update({
        where: { id: existingLocal.id },
        data: { name: NAME, supabaseAuthId },
      })
    : await prisma.user.create({
        data: { name: NAME, email: EMAIL, supabaseAuthId },
      });

  console.log(`Administradora pronta: ${user.name} <${user.email}>`);
  if (supabaseAuthId.startsWith(PENDING_PREFIX)) {
    console.log("  (vínculo com o Supabase Auth ainda pendente)");
  }
}

/**
 * O Supabase não expõe busca por e-mail na Admin API; paginamos até achar.
 *
 * Recebe só o `auth.admin` em vez do client inteiro: os genéricos de
 * `SupabaseClient` dependem do schema do banco e não se deixam anotar à mão
 * sem uma tipagem gerada que não temos aqui.
 */
async function findAuthUserByEmail(
  admin: ReturnType<typeof createClient>["auth"]["admin"],
  email: string,
) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;

    const found = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (found) return found;
    if (data.users.length < 200) return null;
  }
  return null;
}

main()
  .catch((error) => {
    console.error("Falha ao criar a administradora:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
